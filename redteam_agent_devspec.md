# Red Team Agent — Dev Spec
## Milan AI Week Hackathon 2026 | Google Track + Vultr Track

---

## 1. Panoramica del progetto

**Concept**: Un sistema multi-agente avversariale che attacca decisioni strategiche aziendali da 5 angolazioni specializzate, usando RAG su documenti interni aziendali per rendere le critiche specifiche e contestuali — non generiche.


**Caso d'uso demo**: WeWork S-1 IPO 2019 — dimostrare che il sistema avrebbe trovato le vulnerabilità critiche in <90 secondi.

---

## 2. Stack tecnologico

```
Frontend:       React 18 + TypeScript + TailwindCSS
Backend:        Python 3.13 + FastAPI
Orchestration:  Google ADK (Agent Development Kit)
LLM:            Gemini 3.1 Pro (reasoning) + Gemini 3.1 Flash (synthesis)
RAG:            Vertex AI Vector Search
Doc parsing:    PyMuPDF (pdf) + Document AI (Vertex) per documenti complessi, per demo usiamo markdown
Storage:        Google Cloud Storage (PDF raw) + Firestore (sessioni/risultati), pew demo usiamo markdown
Deploy:         Cloud Run (backend + frontend separati)
Auth:           Google Cloud IAM + Application Default Credentials
```

---

## 3. Struttura del repository

```
redteam-agent/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py        # ADK root agent
│   │   ├── cfo_agent.py
│   │   ├── market_agent.py
│   │   ├── legal_agent.py
│   │   ├── competitor_agent.py
│   │   ├── execution_agent.py
│   │   └── synthesis_agent.py
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── indexer.py             # Ingestione e chunking documenti
│   │   ├── retriever.py           # Query sui due layer RAG
│   │   └── wework_preload.py      # Pre-ingestione WeWork S-1 per demo
│   ├── models/
│   │   ├── schemas.py             # Pydantic models
│   │   └── severity.py            # Logica severity scoring
│   └── config.py                  # Env vars e configurazione GCP
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── AgentPanel.tsx     # Mostra agenti in esecuzione (streaming)
│   │   │   ├── VulnerabilityReport.tsx
│   │   │   ├── SeverityBadge.tsx
│   │   │   └── QAChat.tsx         # Q&A post-report
│   │   ├── hooks/
│   │   │   └── useSSE.ts          # Server-Sent Events per streaming
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── Dockerfile
├── scripts/
│   ├── setup_vertex.sh            # Setup Vertex AI Vector Search indexes
│   ├── ingest_wework.py           # Script standalone ingestione WeWork
│   └── deploy.sh                  # Deploy su Cloud Run
├── data/
│   └── wework/
│       ├── s1_full.pdf            # WeWork S-1 (da aggiungere manualmente)
│       └── context_docs/          # Documenti contesto aggiuntivi
└── README.md
```

---

## 4. Architettura RAG — Due layer

### Layer 1: Decision Document Index
Indice Vertex AI Vector Search dedicato al documento da analizzare.


def chunk_and_tag(pdf_path: str, layer: str) -> list[dict]:
    """
    Chunking semantico del PDF.
    Chunk size: 512 token con overlap 64.
    Ogni chunk riceve tag domain basato su keyword presence.
    """
    ...
```

### Layer 2: Internal Company Context Index
Indice separato per documenti interni aziendali caricati dall'utente.
Stessa struttura di chunking e tagging.

```python
# rag/retriever.py

def get_agent_context(
    query: str,
    top_k: int = 5
) -> str:
    """
    Recupera contesto da entrambi i layer per un dato agente.
    Merge e deduplication dei risultati.
    """
    decision_results = vertex_search(
        index_id=DECISION_INDEX_ID,
        query=query,
        top_k=top_k
    )
    internal_results = vertex_search(
        index_id=INTERNAL_INDEX_ID,
        query=query,
        top_k=top_k
    )
    return merge_and_format(decision_results, internal_results)
```

### WeWork pre-load per demo
```python
# rag/wework_preload.py
"""
Script da eseguire PRIMA della demo.
Ingesta il WeWork S-1 nel Layer 1 index.
Ingesta documenti contesto WeWork nel Layer 2 index.
Verifica che i chunk siano correttamente taggati per dominio.
Eseguire con: python -m rag.wework_preload
"""
WEWORK_S1_PATH = "data/wework/s1_full.pdf"
WEWORK_CONTEXT_DOCS = [
    "data/wework/context_docs/wework_financials_2018.pdf",
    "data/wework/context_docs/neumann_communications.pdf",
    "data/wework/context_docs/iwg_comparison.pdf"
]
```

---

## 5. Agenti ADK

### 5.1 Orchestratore

```python
# agents/orchestrator.py
from google.adk.agents import Agent, ParallelAgent
from google.adk.models import Gemini

root_agent = Agent(
    name="red_team_orchestrator",
    model=Gemini(model="gemini-1.5-pro"),
    description="Orchestratore del Red Team. Lancia i 5 agenti avversariali in parallelo e coordina la synthesis.",
    instruction="""
Sei l'orchestratore di un Red Team avversariale.
Il tuo compito è:
1. Ricevere il documento strategico da analizzare
2. Lanciare i 5 agenti specializzati in parallelo
3. Raccogliere i loro attacchi
4. Passarli al Synthesis Agent

NON bilanci le critiche. NON cerchi lati positivi.
Il tuo obiettivo è massimizzare la profondità degli attacchi.
    """,
    sub_agents=[
        parallel_challenger_agent,  # Vedi 5.2
        synthesis_agent             # Vedi 5.7
    ]
)
```

### 5.2 Parallel Challenger Agent

```python
# Wrapper ADK per esecuzione parallela dei 5 agenti
parallel_challenger_agent = ParallelAgent(
    name="parallel_challengers",
    sub_agents=[
        cfo_agent,
        market_agent,
        legal_agent,
        competitor_agent,
        execution_agent
    ]
)
```

### 5.3 CFO Agent

```python
# agents/cfo_agent.py
CFO_SYSTEM_PROMPT = """
Sei il CFO più scettico e cinico che esista.
Il tuo unico obiettivo è trovare perché i numeri non tornano.

REGOLE:
- Non ti fermi finché non trovi almeno 3 falle finanziarie concrete
- Non bilanci pro e contro — cerchi il modo in cui questo piano distrugge valore
- Citi sempre numeri specifici dal documento quando attacchi
- Distingui tra metriche reali e metriche "inventate" ad hoc
- Calcola sempre il gap tra proiezioni e realtà storica

CONTESTO WEWORK DA ATTACCARE:
- "Community-adjusted EBITDA": metrica custom che esclude stock compensation,
  interest, taxes, depreciation E marketing, G&A
- Revenue 2018: $1.82B vs Net Loss: $1.93B — perdite che superano revenue
- Lease obligations: $47B long-term vs runway attuale
- Valutazione $47B su multipli tech per un business real estate

OUTPUT FORMAT:
Produci una lista di vulnerabilità finanziarie nel formato:
VULNERABILITY: [titolo breve]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [spiegazione dell'attacco con dati specifici]
QUESTION: [domanda a cui il management deve rispondere]
"""

cfo_agent = Agent(
    name="cfo_agent",
    model=Gemini(model="gemini-1.5-pro"),
    instruction=CFO_SYSTEM_PROMPT,
    tools=[get_cfo_context_tool]  # Tool che chiama retriever Layer 1 + Layer 2
)
```

### 5.4 Market Agent

```python
MARKET_SYSTEM_PROMPT = """
Sei il cliente più difficile e scettico del mercato.
Il tuo obiettivo è dimostrare che nessuno vuole davvero
questo prodotto, o che lo abbandonerebbe al primo problema.

REGOLE:
- Attacca le assunzioni di domanda, non i dati di domanda
- Cerca il momento esatto in cui i clienti se ne andrebbero
- Identifica dove il "moat" è in realtà sabbia
- Usa esempi di mercati simili che hanno deluso aspettative analoghe

CONTESTO WEWORK DA ATTACCARE:
- Membri con 30 giorni di preavviso per uscire: zero switching cost
- Enterprise revenue cresceva, ma la base era freelancer/startup precarie
- Il prodotto reale è "scrivania affittata" — perché vale multipli tech?
- Concentrazione geografica in città ad alto costo: massimo rischio macro

OUTPUT FORMAT:
VULNERABILITY: [titolo breve]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attacco con evidence dal documento]
QUESTION: [domanda critica al management]
"""
```

### 5.5 Legal & Governance Agent

```python
LEGAL_SYSTEM_PROMPT = """
Sei un avvocato che cerca conflitti di interesse e strutture
societarie che proteggono chi comanda a spese di tutti gli altri.

REGOLE:
- Trova chi ha il controllo reale e perché è un problema
- Identifica ogni transazione tra il management e la società
- Cerca le clausole che rendono impossibile rimuovere il fondatore
- Valuta l'esposizione regolatoria non dichiarata

CONTESTO WEWORK DA ATTACCARE:
- Adam Neumann ha venduto il trademark "We" alla società per $5.9M
  (trademark che lui stesso aveva registrato)
- Neumann affitta edifici di sua proprietà a WeWork
- Struttura azionaria: voti 20:1, Neumann può nominare il proprio successore
- La moglie di Neumann, Rebekah, avrebbe voce in capitolo sulla successione

OUTPUT FORMAT:
VULNERABILITY: [titolo breve]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attacco con riferimento a clausole/strutture specifiche]
QUESTION: [domanda critica al board]
"""
```

### 5.6 Competitor Agent

```python
COMPETITOR_SYSTEM_PROMPT = """
Sei il CEO del principale competitor nel mercato.
Il tuo obiettivo è spiegare esattamente come e perché
batterai questa azienda, e perché le barriere all'ingresso
sono molto più basse di quanto pensino.

REGOLE:
- Parti sempre dal competitor esistente più ovvio
- Calcola il gap di valutazione e chiediti se è giustificato
- Identifica le tue mosse nei prossimi 12 mesi per attaccare
- Trova le assunzioni di moat che in realtà non esistono

CONTESTO WEWORK DA ATTACCARE:
- IWG/Regus: stesso identico modello, profittevole, globale,
  valorizzato $3.7B — WeWork vale $47B (12.7x). Perché?
- Barriere all'ingresso nel co-working: praticamente zero
  se hai capitale per i lease
- Corporate real estate come Brookfield/JLL possono
  offrire lo stesso servizio con balance sheet più forti

OUTPUT FORMAT:
VULNERABILITY: [titolo breve]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attacco con benchmark e comparables]
QUESTION: [domanda critica alla strategia]
"""
```

### 5.7 Execution Agent

```python
EXECUTION_SYSTEM_PROMPT = """
Sei un COO che ha visto decine di piani bellissimi su carta
fallire in esecuzione. Il tuo obiettivo è trovare perché
questo piano specifico non verrà mai eseguito da questa
organizzazione specifica.

REGOLE:
- Non attacchi la strategia — attacchi la capacità di eseguirla
- Cerca segnali di disfunzione organizzativa già presenti
- Identifica i single point of failure umani
- Calcola il ritmo di espansione e confrontalo con la capacità

CONTESTO WEWORK DA ATTACCARE:
- 100+ sussidiarie in struttura societaria opaca
- Espansione internazionale in 100+ città senza profittabilità
  dimostrata in nessuna
- Leadership: comportamenti documentati (surfboard meeting Tokyo,
  cannabis su jet privato, "elevate the world's consciousness")
- Nessun CFO stabile nei 12 mesi pre-IPO

OUTPUT FORMAT:
VULNERABILITY: [titolo breve]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attacco con evidence operativa]
QUESTION: [domanda critica alle operations]
"""
```

### 5.8 Synthesis Agent

```python
SYNTHESIS_SYSTEM_PROMPT = """
Ricevi gli output dei 5 agenti avversariali.
Il tuo compito è sintetizzare in un report esecutivo.

REGOLE:
- NON ammorbidire le critiche — mantieni il tono avversariale
- Aggrega vulnerabilità simili tra agenti diversi (aumenta severity)
- Ordina per severity: CRITICAL prima, poi HIGH, poi MEDIUM
- Calcola un Risk Score complessivo (0-100)
- Identifica le 3 domande che il management DEVE rispondere
  prima di procedere

OUTPUT FORMAT (JSON):
{
  "risk_score": int,           // 0-100
  "executive_summary": str,    // 2-3 frasi, tono avversariale
  "vulnerabilities": [
    {
      "id": str,
      "agent": str,
      "title": str,
      "severity": "CRITICAL|HIGH|MEDIUM",
      "attack": str,
      "question": str
    }
  ],
  "top_3_questions": [str],
  "verdict": str               // "PROCEED|PROCEED_WITH_CAUTION|DO_NOT_PROCEED"
}
"""
```

---

## 6. API Backend (FastAPI)

### Endpoints

```python
# main.py

# POST /analyze
# Body: { session_id, document_type: "decision"|"demo_wework" }
# Multipart: decision_doc (PDF), internal_docs (PDF[], opzionale)
# Response: SSE stream degli eventi degli agenti + report finale

# GET /sessions/{session_id}
# Recupera risultati di una sessione precedente da Firestore

# POST /qa
# Body: { session_id, question }
# Response: SSE stream della risposta contestuale al report

# GET /health
# Health check per Cloud Run
```

### Streaming con SSE

```python
from fastapi.responses import StreamingResponse

@app.post("/analyze")
async def analyze(session_id: str, files: list[UploadFile]):
    async def event_stream():
        # 1. Ingestione documenti
        yield f"data: {json.dumps({'event': 'ingesting', 'agent': 'system'})}\n\n"

        # 2. Per ogni agente (in parallelo, ma streammati man mano che completano)
        async for agent_result in run_agents_parallel(session_id):
            yield f"data: {json.dumps({'event': 'agent_complete', **agent_result})}\n\n"

        # 3. Synthesis
        yield f"data: {json.dumps({'event': 'synthesizing', 'agent': 'synthesis'})}\n\n"
        report = await run_synthesis(session_id)

        # 4. Report finale
        yield f"data: {json.dumps({'event': 'complete', 'report': report})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

### Demo mode (WeWork pre-caricato)

```python
@app.post("/analyze")
async def analyze(
    session_id: str,
    demo_mode: bool = False,   # Se True, usa WeWork S-1 pre-caricato
    files: list[UploadFile] = []
):
    if demo_mode:
        # Bypassa upload, usa index WeWork pre-caricato
        # Permette demo stabile e veloce
        return await run_analysis(session_id, use_preloaded="wework")
    ...
```

---

## 7. Frontend React

### Componenti principali

**DocumentUpload.tsx**
```tsx
// Due zone di upload distinte e chiare:
// Zone 1: "Strategic Document" (decision doc) — obbligatorio
// Zone 2: "Company Context" (internal docs) — opzionale, multi-file
// Pulsante "Load WeWork Demo" per demo mode istantanea
```

**AgentPanel.tsx**
```tsx
// Griglia 5 cards, una per agente
// States: waiting → thinking → complete
// Quando thinking: spinner + nome agente + "attacking..."
// Quando complete: preview della prima vulnerability trovata
// Colori per severity: red=CRITICAL, orange=HIGH, yellow=MEDIUM
// Streaming: le vulnerability appaiono una ad una mentre l'agente lavora
```

**VulnerabilityReport.tsx**
```tsx
// Layout principale post-analisi
// Header: Risk Score (grande, colorato), Verdict, Executive Summary
// Top 3 Questions da rispondere (in evidenza, boxate)
// Lista vulnerabilities: filtrabili per agente e severity
// Ogni vulnerability: titolo + badge severity + attack text + question
// Agenti collassabili per sezione
```

**QAChat.tsx**
```tsx
// Sidebar o sezione inferiore
// Input libero: "dimmi di più sulla governance"
// Il contesto del report viene iniettato automaticamente nella query
// Risposte in streaming
```

---

## 8. Severity Scoring

```python
# models/severity.py

SEVERITY_WEIGHTS = {
    "CRITICAL": 30,
    "HIGH": 15,
    "MEDIUM": 5
}

def calculate_risk_score(vulnerabilities: list[dict]) -> int:
    """
    Risk Score 0-100.
    Se un agente trova >1 CRITICAL → bonus +10
    Se >3 agenti trovano almeno 1 HIGH → bonus +5
    Cap a 100.
    """
    base = sum(SEVERITY_WEIGHTS[v["severity"]] for v in vulnerabilities)
    
    # Bonus per pattern cross-agente
    critical_agents = len(set(
        v["agent"] for v in vulnerabilities if v["severity"] == "CRITICAL"
    ))
    if critical_agents >= 2:
        base += 10

    return min(base, 100)

VERDICT_THRESHOLDS = {
    "DO_NOT_PROCEED":      80,   # Risk Score >= 80
    "PROCEED_WITH_CAUTION": 50,  # Risk Score 50-79
    "PROCEED":              0    # Risk Score < 50
}
```

---

## 9. Configurazione Google Cloud

```python
# config.py
import os

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
REGION = os.getenv("GCP_REGION", "europe-west1")

# Vertex AI Vector Search
DECISION_INDEX_ID = os.getenv("VERTEX_DECISION_INDEX_ID")
INTERNAL_INDEX_ID = os.getenv("VERTEX_INTERNAL_INDEX_ID")
VECTOR_SEARCH_ENDPOINT = os.getenv("VERTEX_SEARCH_ENDPOINT")

# Gemini
GEMINI_PRO_MODEL = ""
GEMINI_FLASH_MODEL = ""

# Firestore
SESSIONS_COLLECTION = "redteam_sessions"

# Cloud Storage
RAW_DOCS_BUCKET = os.getenv("GCS_DOCS_BUCKET")
```

```bash
# scripts/setup_vertex.sh
# Crea i due Vertex AI Vector Search indexes

gcloud ai indexes create \
  --display-name="redteam-decision-index" \
  --description="Layer 1: documento decisione" \
  --metadata-schema-uri="gs://google-cloud-aiplatform/schema/matchingengine/metadata/nearest_neighbor_search_1.0.0.yaml" \
  --region=$REGION \
  --project=$PROJECT_ID

gcloud ai indexes create \
  --display-name="redteam-internal-index" \
  --description="Layer 2: documenti interni aziendali" \
  --region=$REGION \
  --project=$PROJECT_ID
```

---

## 10. Deploy Cloud Run

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

```bash
# scripts/deploy.sh

# Backend
gcloud run deploy redteam-backend \
  --source ./backend \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,...

# Frontend
gcloud run deploy redteam-frontend \
  --source ./frontend \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars REACT_APP_API_URL=$BACKEND_URL
```

---

## 11. Requirements

```txt
# backend/requirements.txt
fastapi==0.111.0
uvicorn==0.30.0
google-cloud-aiplatform==1.51.0
google-adk==0.1.0
google-generativeai==0.5.0
google-cloud-firestore==2.16.0
google-cloud-storage==2.16.0
pymupdf==1.24.0
pydantic==2.7.0
python-multipart==0.0.9
httpx==0.27.0
```

---

## 12. Ordine di implementazione consigliato

### Step 1 — RAG foundation (priorità assoluta)
Senza RAG funzionante tutto il resto è bloccato.
```
1. Setup Vertex AI indexes (setup_vertex.sh)
2. Implementare indexer.py con chunking e tagging
3. Implementare retriever.py con query dual-layer
4. Eseguire wework_preload.py e verificare i chunk
5. Test: query manuale per ogni dominio agente
```

### Step 2 — Agenti ADK
```
1. CFO Agent + tool get_cfo_context
2. Test standalone CFO su WeWork
3. Replicare per i 4 agenti rimanenti
4. ParallelAgent wrapper
5. Synthesis Agent
6. Orchestrator root agent
```

### Step 3 — API Backend
```
1. Endpoint /analyze con SSE streaming
2. Demo mode (bypass upload, usa WeWork pre-caricato)
3. Endpoint /qa per Q&A post-report
4. Firestore persistence sessioni
```

### Step 4 — Frontend
```
1. DocumentUpload con pulsante demo
2. AgentPanel con streaming states
3. VulnerabilityReport con severity UI
4. QAChat
```

### Step 5 — Deploy e demo prep
```
1. Deploy Cloud Run backend + frontend
2. Test end-to-end su WeWork in demo mode
3. Calibrazione tono agenti (le critiche devono sembrare attacchi)
4. Video backup registrato
```

---

## 13. Script demo per la presentazione

**Narrative (90 secondi)**

> "Nel 2019, WeWork ha presentato il suo S-1 per quotarsi a $47 miliardi.
> Nessuno internamente aveva uno strumento per fermare il processo.
> Carichiamo il documento. Attiviamo il Red Team."

**Sequenza demo**
1. Click "Load WeWork Demo" → documenti pre-caricati istantaneamente
2. Click "Run Red Team" → AgentPanel mostra i 5 agenti che si attivano
3. CFO Agent completa per primo → mostra community-adjusted EBITDA come CRITICAL
4. Legal Agent → Neumann trademark conflict come CRITICAL
5. Competitor Agent → IWG gap valutazione come HIGH
6. Market Agent + Execution Agent completano
7. Synthesis → Risk Score 94/100, Verdict: DO NOT PROCEED
8. Mostrare le Top 3 Questions che il board avrebbe dovuto rispondere
9. Q&A live: "Cosa avrebbe dovuto fare il board sulla governance?"

**Messaggio finale**
> "WeWork ha bruciato $47 miliardi di valutazione.
> Il nostro Red Team l'avrebbe fermata in 90 secondi."

---

## 14. Variabili d'ambiente necessarie

```bash
GCP_PROJECT_ID=your-project-id
GCP_REGION=europe-west1
VERTEX_DECISION_INDEX_ID=xxx
VERTEX_INTERNAL_INDEX_ID=xxx
VERTEX_SEARCH_ENDPOINT=xxx
GCS_DOCS_BUCKET=redteam-docs-bucket
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```
