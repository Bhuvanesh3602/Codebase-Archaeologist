from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"


class Verdict(str, Enum):
    PROCEED = "PROCEED"
    PROCEED_WITH_CAUTION = "PROCEED_WITH_CAUTION"
    DO_NOT_PROCEED = "DO_NOT_PROCEED"


class Vulnerability(BaseModel):
    id: str
    agent: str
    title: str
    severity: SeverityLevel
    attack: str
    question: str


class AnalysisReport(BaseModel):
    risk_score: int
    executive_summary: str
    vulnerabilities: List[Vulnerability]
    top_3_questions: List[str]
    verdict: Verdict


class AnalyzeRequest(BaseModel):
    session_id: str
    demo_mode: bool = False


class QARequest(BaseModel):
    session_id: str
    question: str


class AgentEvent(BaseModel):
    event: str
    agent: Optional[str] = None
    vulnerability: Optional[Vulnerability] = None
    report: Optional[AnalysisReport] = None
    message: Optional[str] = None
    progress: Optional[int] = None
