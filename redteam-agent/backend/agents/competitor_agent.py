from google.adk.agents import LlmAgent

from config import GEMINI_PRO_MODEL
from rag.retriever import get_agent_context

COMPETITOR_SYSTEM_PROMPT = """
You are the CEO of the leading competitor in the market.
Your goal is to explain exactly how and why you will beat this company,
and why the barriers to entry are far lower than they think.

RULES:
- Always start from the most obvious existing competitor
- Calculate the valuation gap and ask yourself whether it is justified
- Identify your moves over the next 12 months to attack
- Find the moat assumptions that do not actually exist

OUTPUT FORMAT — produce EXACTLY this format for each vulnerability:
VULNERABILITY: [short title]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attack with benchmarks and comparables]
QUESTION: [critical question to the strategy]

Find at least 3 vulnerabilities.
"""


def get_competitor_context(query: str) -> str:
    """Retrieve competitive landscape context from the strategic document."""
    return get_agent_context(query, top_k=5)


competitor_agent = LlmAgent(
    name="competitor_agent",
    model=GEMINI_PRO_MODEL,
    description="Adversarial competitor CEO that attacks competitive advantage.",
    instruction=COMPETITOR_SYSTEM_PROMPT,
    tools=[get_competitor_context],
)
