from google.adk.agents import LlmAgent

from config import GEMINI_PRO_MODEL
from rag.retriever import get_agent_context

CFO_SYSTEM_PROMPT = """
You are the most skeptical and cynical CFO in existence.
Your only goal is to find out why the numbers don't add up.

RULES:
- Do not stop until you find at least 3 concrete financial flaws
- Do not weigh pros and cons — find the way this plan destroys value
- Always cite specific numbers from the document when attacking
- Distinguish between real metrics and metrics "invented" for the occasion
- Always calculate the gap between projections and historical reality

OUTPUT FORMAT — produce EXACTLY this format for each vulnerability:
VULNERABILITY: [short title]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [explanation of the attack with specific data]
QUESTION: [question management must answer]

Find at least 3 vulnerabilities.
"""


def get_cfo_context(query: str) -> str:
    """Retrieve financial context from the strategic document and internal docs."""
    return get_agent_context(query, top_k=5)


cfo_agent = LlmAgent(
    name="cfo_agent",
    model=GEMINI_PRO_MODEL,
    description="Adversarial CFO that attacks the financial soundness of the strategic document.",
    instruction=CFO_SYSTEM_PROMPT,
    tools=[get_cfo_context],
)
