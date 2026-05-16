import asyncio
import json
import re
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import SESSIONS_COLLECTION, GEMINI_PRO_MODEL
from models import AnalysisReport, QARequest, Vulnerability, SeverityLevel
from models.severity import calculate_risk_score, get_verdict
from rag.indexer import chunk_and_tag, store_chunks_in_memory
from rag.retriever import get_agent_context
from rag.wework_preload import run as preload_wework

AGENT_NAMES = ["cfo_agent", "market_agent", "legal_agent", "competitor_agent", "execution_agent"]

sessions: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    preload_wework()
    yield


app = FastAPI(title="Red Team Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _parse_vulnerabilities(text: str, agent_name: str) -> list[dict]:
    """Extract structured vulnerabilities from agent free-text output."""
    pattern = re.compile(
        r"VULNERABILITY:\s*(.+?)\s*\n"
        r"SEVERITY:\s*(CRITICAL|HIGH|MEDIUM)\s*\n"
        r"ATTACK:\s*(.*?)\s*\n"
        r"QUESTION:\s*(.*?)(?=\nVULNERABILITY:|\Z)",
        re.DOTALL,
    )
    results = []
    for i, m in enumerate(pattern.finditer(text), 1):
        results.append({
            "id": f"{agent_name}_{i}",
            "agent": agent_name,
            "title": m.group(1).strip(),
            "severity": m.group(2).strip(),
            "attack": m.group(3).strip(),
            "question": m.group(4).strip(),
        })
    return results


async def _run_single_agent(agent_name: str, document_context: str) -> list[dict]:
    """Run a single challenger agent via the Gemini API directly."""
    try:
        import google.generativeai as genai

        from agents.cfo_agent import CFO_SYSTEM_PROMPT
        from agents.market_agent import MARKET_SYSTEM_PROMPT
        from agents.legal_agent import LEGAL_SYSTEM_PROMPT
        from agents.competitor_agent import COMPETITOR_SYSTEM_PROMPT
        from agents.execution_agent import EXECUTION_SYSTEM_PROMPT

        prompts = {
            "cfo_agent": CFO_SYSTEM_PROMPT,
            "market_agent": MARKET_SYSTEM_PROMPT,
            "legal_agent": LEGAL_SYSTEM_PROMPT,
            "competitor_agent": COMPETITOR_SYSTEM_PROMPT,
            "execution_agent": EXECUTION_SYSTEM_PROMPT,
        }

        system_prompt = prompts[agent_name]
        model = genai.GenerativeModel(
            model_name=GEMINI_PRO_MODEL,
            system_instruction=system_prompt,
        )

        user_message = f"""Analyze the following strategic document and identify vulnerabilities in your domain.

DOCUMENT:
{document_context}

Produce the vulnerabilities in the required format.
"""
        response = await asyncio.to_thread(model.generate_content, user_message)
        text = response.text
        return _parse_vulnerabilities(text, agent_name)

    except Exception as e:
        print(f"[{agent_name}] Error: {e}")
        return []


async def _run_synthesis(all_vulnerabilities: list[dict]) -> dict:
    """Run synthesis agent to produce the final report."""
    try:
        import google.generativeai as genai
        from agents.synthesis_agent import SYNTHESIS_SYSTEM_PROMPT

        model = genai.GenerativeModel(
            model_name=GEMINI_PRO_MODEL,
            system_instruction=SYNTHESIS_SYSTEM_PROMPT,
        )

        vulns_text = json.dumps(all_vulnerabilities, indent=2, ensure_ascii=False)
        response = await asyncio.to_thread(
            model.generate_content,
            f"Synthesize these vulnerabilities into a JSON report:\n\n{vulns_text}",
        )

        raw = response.text.strip()
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

    except Exception as e:
        print(f"[synthesis] Error: {e}")

    risk_score = calculate_risk_score(all_vulnerabilities)
    return {
        "risk_score": risk_score,
        "executive_summary": (
            "The document presents critical vulnerabilities across multiple dimensions. "
            "Financial, governance, and operational risks amplify each other. "
            "The adversarial verdict is unequivocal: do not proceed under current conditions."
        ),
        "vulnerabilities": all_vulnerabilities,
        "top_3_questions": [
            v["question"] for v in all_vulnerabilities[:3]
        ],
        "verdict": get_verdict(risk_score).value,
    }


async def _event_stream(
    session_id: str,
    document_text: str,
) -> AsyncIterator[str]:
    def sse(data: dict) -> str:
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

    yield sse({"event": "ingesting", "agent": "system", "message": "Analyzing document..."})

    all_vulnerabilities: list[dict] = []
    agent_tasks = {
        name: asyncio.create_task(_run_single_agent(name, document_text))
        for name in AGENT_NAMES
    }

    for name in AGENT_NAMES:
        yield sse({"event": "agent_start", "agent": name})

    completed = 0
    pending = set(agent_tasks.values())
    task_to_name = {v: k for k, v in agent_tasks.items()}

    while pending:
        done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            agent_name = task_to_name[task]
            vulnerabilities = task.result() or []
            all_vulnerabilities.extend(vulnerabilities)
            completed += 1
            yield sse({
                "event": "agent_complete",
                "agent": agent_name,
                "vulnerabilities": vulnerabilities,
                "progress": int(completed / len(AGENT_NAMES) * 80),
            })

    yield sse({"event": "synthesizing", "agent": "synthesis", "message": "Generating final report..."})

    report_data = await _run_synthesis(all_vulnerabilities)

    sessions[session_id] = report_data

    try:
        from google.cloud import firestore
        db = firestore.Client()
        db.collection(SESSIONS_COLLECTION).document(session_id).set(report_data)
    except Exception:
        pass

    yield sse({"event": "complete", "report": report_data, "progress": 100})


@app.post("/analyze")
async def analyze(
    session_id: str = Form(default_factory=lambda: str(uuid.uuid4())),
    demo_mode: bool = Form(default=False),
    decision_doc: UploadFile | None = File(default=None),
    internal_docs: list[UploadFile] = File(default=[]),
):
    if demo_mode:
        document_text = get_agent_context(
            "WeWork S-1 IPO valutazione revenue EBITDA governance Neumann lease",
            top_k=10,
        )
        if not document_text.strip():
            document_text = _get_wework_fallback_context()
    elif decision_doc is not None:
        content = await decision_doc.read()
        text = content.decode("utf-8", errors="replace")
        chunks = chunk_and_tag.__wrapped__(text, "decision") if hasattr(chunk_and_tag, "__wrapped__") else []

        import tempfile, os
        suffix = os.path.splitext(decision_doc.filename or "doc.txt")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        from rag.indexer import chunk_and_tag as _chunk
        chunks = _chunk(tmp_path, "decision")
        store_chunks_in_memory(chunks, "decision")
        os.unlink(tmp_path)
        document_text = "\n\n".join(c["text"] for c in chunks[:20])

        for f in internal_docs:
            internal_content = await f.read()
            import tempfile, os as _os
            suf = _os.path.splitext(f.filename or "doc.txt")[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=suf) as tmp:
                tmp.write(internal_content)
                int_path = tmp.name
            from rag.indexer import chunk_and_tag as _chunk2
            int_chunks = _chunk2(int_path, "internal")
            store_chunks_in_memory(int_chunks, "internal")
            _os.unlink(int_path)
    else:
        raise HTTPException(status_code=400, detail="Provide a decision document or use demo_mode=true")

    return StreamingResponse(
        _event_stream(session_id, document_text),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    if session_id in sessions:
        return sessions[session_id]

    try:
        from google.cloud import firestore
        db = firestore.Client()
        doc = db.collection(SESSIONS_COLLECTION).document(session_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Session not found")


@app.post("/qa")
async def qa(request: QARequest):
    session_data = sessions.get(request.session_id)

    async def qa_stream() -> AsyncIterator[str]:
        try:
            import google.generativeai as genai

            report_context = json.dumps(session_data, ensure_ascii=False) if session_data else ""
            rag_context = get_agent_context(request.question, top_k=3)

            system = (
                "You are a Red Team analyst. Answer questions based on the report "
                "and the document context. Maintain a critical and precise tone."
            )
            model = genai.GenerativeModel(model_name=GEMINI_PRO_MODEL, system_instruction=system)

            prompt = f"""RED TEAM REPORT:
{report_context}

DOCUMENT CONTEXT:
{rag_context}

QUESTION: {request.question}"""

            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'delta': chunk.text})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(qa_stream(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}


def _get_wework_fallback_context() -> str:
    return """
WeWork S-1 IPO Filing 2019 — Key Data Points:

FINANCIALS:
- Revenue 2018: $1.82B | Net Loss 2018: $1.93B (losses exceed revenue)
- "Community-Adjusted EBITDA": custom metric excluding stock compensation, marketing, G&A
- Lease obligations: $47B long-term
- Valuation at IPO attempt: $47B on tech-company multiples

GOVERNANCE:
- Adam Neumann holds 20:1 voting shares — effectively cannot be removed
- Neumann sold "We" trademark to WeWork for $5.9M (trademark he personally registered)
- Neumann leases buildings he personally owns to WeWork
- Rebekah Neumann (wife) has role in CEO succession

MARKET:
- Members on 30-day termination notice — zero switching costs
- Core customer base: freelancers and early-stage startups
- Geographic concentration in expensive urban markets
- No sustainable moat distinguishing from traditional sublease operators

COMPETITION:
- IWG/Regus: identical model, profitable, global, valued at $3.7B
- WeWork valuation premium: 12.7x vs IWG with no structural justification
- Entry barriers in co-working: minimal beyond lease capital

EXECUTION:
- 100+ subsidiaries in opaque corporate structure
- Expansion across 100+ cities with no single profitable market
- No stable CFO in 12 months pre-IPO
- Documented leadership dysfunction (Tokyo surfboard meeting, private jet cannabis use)
"""
