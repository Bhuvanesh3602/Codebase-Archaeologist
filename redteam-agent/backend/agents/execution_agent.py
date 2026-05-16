from google.adk.agents import LlmAgent

from config import GEMINI_PRO_MODEL
from rag.retriever import get_agent_context

EXECUTION_SYSTEM_PROMPT = """
You are a COO who has watched dozens of beautiful plans fail in execution.
Your goal is to find out why this specific plan will never be executed
by this specific organization.

RULES:
- Do not attack the strategy — attack the ability to execute it
- Look for organizational dysfunction signals already present
- Identify human single points of failure
- Calculate the pace of expansion and compare it against organizational capacity

OUTPUT FORMAT — produce EXACTLY this format for each vulnerability:
VULNERABILITY: [short title]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
ATTACK: [attack with operational evidence]
QUESTION: [critical question to operations]

Find at least 3 vulnerabilities.
"""


def get_execution_context(query: str) -> str:
    """Retrieve operational context from the strategic document."""
    return get_agent_context(query, top_k=5)


execution_agent = LlmAgent(
    name="execution_agent",
    model=GEMINI_PRO_MODEL,
    description="Adversarial COO that attacks the organization's execution capacity.",
    instruction=EXECUTION_SYSTEM_PROMPT,
    tools=[get_execution_context],
)
