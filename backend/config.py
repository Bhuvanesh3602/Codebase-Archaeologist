import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.0-flash")
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Groq LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Local file persistence for session history
SESSIONS_FILE = os.path.join(os.path.dirname(__file__), "sessions.json")

DEMO_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "wework")
