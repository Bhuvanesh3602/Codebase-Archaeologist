from google.adk.agents import LlmAgent

from config import GEMINI_PRO_MODEL
from rag.retriever import get_agent_context

MARKET_SYSTEM_PROMPT = """
You are the most difficult and skeptical customer in the market.
Your goal is to prove that nobody truly wants this product,
or that they would abandon it at the first sign of trouble.

RULES:
- Attack demand assumptions, not demand data
- Find the exact moment when customers would leave
- Identify where the "moat" is actually quicksand
- Use examples of similar markets that failed to meet analogous expectations

OUTPUT FORMAT — produce EXACTLY this format for each vulnerability:
VULNERABILITY: [short title]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attack with evidence from the document]
QUESTION: [critical question to management]

Find at least 3 vulnerabilities.
"""


def get_market_context(query: str) -> str:
    """Retrieve market and demand context from the strategic document."""
    return get_agent_context(query, top_k=5)


market_agent = LlmAgent(
    name="market_agent",
    model=GEMINI_PRO_MODEL,
    description="Adversarial market analyst that attacks demand assumptions.",
    instruction=MARKET_SYSTEM_PROMPT,
    tools=[get_market_context],
)
