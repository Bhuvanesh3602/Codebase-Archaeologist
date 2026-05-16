#!/usr/bin/env python3
"""Standalone script to ingest WeWork S-1 data into the RAG layer."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from rag.wework_preload import run

if __name__ == "__main__":
    run()
