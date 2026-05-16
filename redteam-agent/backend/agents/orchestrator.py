from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent

from config import GEMINI_PRO_MODEL
from agents.cfo_agent import cfo_agent
from agents.market_agent import market_agent
from agents.legal_agent import legal_agent
from agents.competitor_agent import competitor_agent
from agents.execution_agent import execution_agent
from agents.synthesis_agent import synthesis_agent

parallel_challenger_agent = ParallelAgent(
    name="parallel_challengers",
    description="Runs the 5 adversarial agents in parallel.",
    sub_agents=[
        cfo_agent,
        market_agent,
        legal_agent,
        competitor_agent,
        execution_agent,
    ],
)

root_agent = SequentialAgent(
    name="red_team_orchestrator",
    description="Red Team orchestrator. Launches the 5 adversarial agents in parallel and coordinates synthesis.",
    sub_agents=[
        parallel_challenger_agent,
        synthesis_agent,
    ],
)
