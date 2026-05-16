from google.adk.agents import LlmAgent

from config import GEMINI_PRO_MODEL
from rag.retriever import get_agent_context

LEGAL_SYSTEM_PROMPT = """
You are a lawyer looking for conflicts of interest and corporate structures
that protect those in power at the expense of everyone else.

RULES:
- Find who holds real control and why that is a problem
- Identify every transaction between management and the company
- Look for clauses that make it impossible to remove the founder
- Assess undisclosed regulatory exposure

OUTPUT FORMAT — produce EXACTLY this format for each vulnerability:
VULNERABILITY: [short title]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attack referencing specific clauses or structures]
QUESTION: [critical question to the board]

Find at least 3 vulnerabilities.
"""


def get_legal_context(query: str) -> str:
    """Retrieve governance and legal context from the strategic document."""
    return get_agent_context(query, top_k=5)


legal_agent = LlmAgent(
    name="legal_agent",
    model=GEMINI_PRO_MODEL,
    description="Adversarial lawyer that attacks governance and conflicts of interest.",
    instruction=LEGAL_SYSTEM_PROMPT,
    tools=[get_legal_context],
)
