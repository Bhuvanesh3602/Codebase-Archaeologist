import os

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
REGION = os.getenv("GCP_REGION", "europe-west1")

DECISION_INDEX_ID = os.getenv("VERTEX_DECISION_INDEX_ID")
INTERNAL_INDEX_ID = os.getenv("VERTEX_INTERNAL_INDEX_ID")
VECTOR_SEARCH_ENDPOINT = os.getenv("VERTEX_SEARCH_ENDPOINT")

GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.0-flash")
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.0-flash")

SESSIONS_COLLECTION = "redteam_sessions"

RAW_DOCS_BUCKET = os.getenv("GCS_DOCS_BUCKET")

DEMO_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "wework")
