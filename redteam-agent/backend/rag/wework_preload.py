"""
Pre-load WeWork S-1 documents into the RAG indexes before the demo.
Run with: python -m rag.wework_preload
"""
import os
from pathlib import Path

from rag.indexer import chunk_and_tag, ingest_document, store_chunks_in_memory

BASE = Path(__file__).parent.parent.parent / "data" / "wework"

WEWORK_S1_PATH = BASE / "s1_full.pdf"
WEWORK_S1_MD = BASE / "s1_summary.md"

WEWORK_CONTEXT_DOCS = [
    BASE / "context_docs" / "wework_financials_2018.md",
    BASE / "context_docs" / "neumann_communications.md",
    BASE / "context_docs" / "iwg_comparison.md",
]


def _load_source(path: Path, layer: str) -> list[dict]:
    if not path.exists():
        print(f"[preload] SKIP {path.name} — file not found")
        return []
    print(f"[preload] Ingesting {path.name} -> layer={layer}")
    chunks = chunk_and_tag(str(path), layer)
    store_chunks_in_memory(chunks, layer)
    try:
        ingest_document(str(path), layer)
    except Exception as e:
        print(f"[preload] Vertex AI skipped ({e}), in-memory only")
    print(f"[preload] {path.name}: {len(chunks)} chunks loaded")
    return chunks


def _verify_chunks(chunks: list[dict]) -> None:
    domain_counts: dict[str, int] = {}
    for chunk in chunks:
        for domain in chunk.get("domains", []):
            domain_counts[domain] = domain_counts.get(domain, 0) + 1
    print("[preload] Domain distribution:", domain_counts)


def run() -> None:
    print("=== WeWork S-1 Pre-load ===")

    decision_chunks = []
    if WEWORK_S1_PATH.exists():
        decision_chunks = _load_source(WEWORK_S1_PATH, "decision")
    elif WEWORK_S1_MD.exists():
        decision_chunks = _load_source(WEWORK_S1_MD, "decision")
    else:
        print("[preload] WARNING: No WeWork S-1 document found in data/wework/")

    _verify_chunks(decision_chunks)

    internal_chunks = []
    for doc_path in WEWORK_CONTEXT_DOCS:
        internal_chunks.extend(_load_source(doc_path, "internal"))

    _verify_chunks(internal_chunks)

    print(f"\n[preload] Complete: {len(decision_chunks)} decision chunks, {len(internal_chunks)} internal chunks")


if __name__ == "__main__":
    run()
