from config import (
    PROJECT_ID,
    REGION,
    DECISION_INDEX_ID,
    INTERNAL_INDEX_ID,
    VECTOR_SEARCH_ENDPOINT,
)
from rag.indexer import get_memory_store


def _vertex_search(index_id: str, query: str, top_k: int = 5) -> list[dict]:
    try:
        from google.cloud import aiplatform
        from vertexai.language_models import TextEmbeddingModel

        aiplatform.init(project=PROJECT_ID, location=REGION)
        model = TextEmbeddingModel.from_pretrained("text-embedding-004")
        query_embedding = model.get_embeddings([query])[0].values

        index_endpoint = aiplatform.MatchingEngineIndexEndpoint(
            index_endpoint_name=VECTOR_SEARCH_ENDPOINT
        )
        response = index_endpoint.find_neighbors(
            deployed_index_id=index_id,
            queries=[query_embedding],
            num_neighbors=top_k,
        )
        return [{"id": n.id, "score": n.distance} for n in response[0]]
    except Exception:
        return []


def _memory_search(layer: str, query: str, top_k: int = 5) -> list[dict]:
    store = get_memory_store()
    chunks = store.get(layer, [])
    if not chunks:
        return []

    query_words = set(query.lower().split())

    def score(chunk: dict) -> float:
        chunk_words = set(chunk["text"].lower().split())
        return len(query_words & chunk_words) / max(len(query_words), 1)

    ranked = sorted(chunks, key=score, reverse=True)
    return ranked[:top_k]


def _deduplicate(results: list[dict]) -> list[dict]:
    seen_ids = set()
    out = []
    for r in results:
        rid = r.get("id", r.get("text", "")[:40])
        if rid not in seen_ids:
            seen_ids.add(rid)
            out.append(r)
    return out


def _format_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("source", "unknown")
        text = chunk.get("text", "")
        parts.append(f"[{i}] ({source})\n{text}")
    return "\n\n".join(parts)


def get_agent_context(query: str, top_k: int = 5) -> str:
    """
    Retrieve context from both RAG layers for a given query.
    Falls back to in-memory keyword search when Vertex AI is unavailable.
    """
    decision_results = _vertex_search(DECISION_INDEX_ID, query, top_k) if DECISION_INDEX_ID else []
    internal_results = _vertex_search(INTERNAL_INDEX_ID, query, top_k) if INTERNAL_INDEX_ID else []

    if not decision_results and not internal_results:
        decision_results = _memory_search("decision", query, top_k)
        internal_results = _memory_search("internal", query, top_k)

    merged = _deduplicate(decision_results + internal_results)
    return _format_context(merged[:top_k])
