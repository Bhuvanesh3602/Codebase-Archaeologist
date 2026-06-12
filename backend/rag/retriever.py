from rag.indexer import get_memory_store


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
    Uses in-memory keyword search.
    """
    decision_results = _memory_search("decision", query, top_k)
    internal_results = _memory_search("internal", query, top_k)

    merged = _deduplicate(decision_results + internal_results)
    return _format_context(merged[:top_k])
