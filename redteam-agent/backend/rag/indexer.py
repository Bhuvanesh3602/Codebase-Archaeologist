import re
import hashlib
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

from config import PROJECT_ID, REGION, DECISION_INDEX_ID, INTERNAL_INDEX_ID

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64

DOMAIN_KEYWORDS = {
    "financial": ["revenue", "ebitda", "loss", "profit", "cash", "debt", "valuation", "equity", "ipo", "margin"],
    "market": ["customer", "member", "demand", "growth", "market", "competitor", "product", "churn", "retention"],
    "legal": ["governance", "founder", "control", "vote", "board", "conflict", "interest", "subsidiary", "trademark"],
    "competitor": ["competitor", "regus", "iwg", "incumbent", "alternative", "benchmark", "comparison", "moat"],
    "execution": ["operations", "expansion", "headcount", "team", "leadership", "cfo", "ceo", "scale", "city"],
}


def _tag_domain(text: str) -> list[str]:
    text_lower = text.lower()
    tags = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            tags.append(domain)
    return tags or ["general"]


def _tokenize_approx(text: str) -> list[str]:
    return text.split()


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = _tokenize_approx(text)
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start += chunk_size - overlap
    return chunks


def chunk_and_tag(source_path: str, layer: str) -> list[dict]:
    """
    Parse and chunk a document (PDF or Markdown) into tagged segments.
    Returns list of chunk dicts with text, metadata, and domain tags.
    """
    path = Path(source_path)

    if path.suffix.lower() == ".pdf":
        doc = fitz.open(source_path)
        full_text = "\n".join(page.get_text() for page in doc)
        doc.close()
    else:
        full_text = path.read_text(encoding="utf-8")

    raw_chunks = _chunk_text(full_text)
    result = []
    for i, chunk_text in enumerate(raw_chunks):
        chunk_id = hashlib.md5(f"{source_path}:{i}".encode()).hexdigest()
        result.append({
            "id": chunk_id,
            "text": chunk_text,
            "layer": layer,
            "source": path.name,
            "chunk_index": i,
            "domains": _tag_domain(chunk_text),
        })
    return result


def ingest_document(source_path: str, layer: str = "decision") -> list[dict]:
    """Chunk a document and upsert embeddings into the appropriate Vertex AI index."""
    chunks = chunk_and_tag(source_path, layer)

    try:
        from google.cloud import aiplatform
        from vertexai.language_models import TextEmbeddingModel

        aiplatform.init(project=PROJECT_ID, location=REGION)
        embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")

        index_id = DECISION_INDEX_ID if layer == "decision" else INTERNAL_INDEX_ID
        texts = [c["text"] for c in chunks]

        embeddings = embedding_model.get_embeddings(texts)

        datapoints = []
        for chunk, emb in zip(chunks, embeddings):
            datapoints.append({
                "id": chunk["id"],
                "embedding": emb.values,
                "restricts": [{"namespace": "domain", "allow_list": chunk["domains"]}],
            })

        index = aiplatform.MatchingEngineIndex(index_name=index_id)
        index.upsert_datapoints(datapoints=datapoints)

    except Exception as e:
        print(f"[indexer] Vertex AI unavailable ({e}), storing chunks in memory only")
        _memory_store[layer].extend(chunks)

    return chunks


_memory_store: dict[str, list[dict]] = {"decision": [], "internal": []}


def store_chunks_in_memory(chunks: list[dict], layer: str) -> None:
    _memory_store[layer] = [c for c in _memory_store[layer] if c["source"] != chunks[0]["source"]]
    _memory_store[layer].extend(chunks)


def get_memory_store() -> dict[str, list[dict]]:
    return _memory_store
