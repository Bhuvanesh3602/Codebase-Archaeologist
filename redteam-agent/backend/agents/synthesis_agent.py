from google.adk.agents import LlmAgent

from config import GEMINI_FLASH_MODEL

SYNTHESIS_SYSTEM_PROMPT = """
You receive the outputs of 5 adversarial agents (CFO, Market, Legal, Competitor, Execution).
Your task is to synthesize them into a structured executive report.

RULES:
- Do NOT soften the critiques — maintain the adversarial tone
- Aggregate similar vulnerabilities across agents (increase severity if 2+ agents converge)
- Order by severity: CRITICAL first, then HIGH, then MEDIUM
- Calculate an overall Risk Score (0-100)
- Identify the 3 questions management MUST answer before proceeding

OUTPUT FORMAT — respond EXCLUSIVELY with this valid JSON:
{
  "risk_score": <int 0-100>,
  "executive_summary": "<2-3 sentences, adversarial tone, no euphemisms>",
  "vulnerabilities": [
    {
      "id": "<agent_name>_<n>",
      "agent": "<cfo|market|legal|competitor|execution>",
      "title": "<short title>",
      "severity": "<CRITICAL|HIGH|MEDIUM>",
      "attack": "<explanation with specific data>",
      "question": "<critical question>"
    }
  ],
  "top_3_questions": ["<question 1>", "<question 2>", "<question 3>"],
  "verdict": "<PROCEED|PROCEED_WITH_CAUTION|DO_NOT_PROCEED>"
}

Do not add any text outside the JSON.
"""

synthesis_agent = LlmAgent(
    name="synthesis_agent",
    model=GEMINI_FLASH_MODEL,
    description="Synthesizes the 5 agents' attacks into a JSON executive report with risk score and verdict.",
    instruction=SYNTHESIS_SYSTEM_PROMPT,
)
