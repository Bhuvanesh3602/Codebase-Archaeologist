export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM'

export type Verdict = 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'DO_NOT_PROCEED'

export type AgentName = 'cfo_agent' | 'market_agent' | 'legal_agent' | 'competitor_agent' | 'execution_agent'

export type AgentStatus = 'waiting' | 'thinking' | 'complete' | 'error'

export interface Vulnerability {
  id: string
  agent: AgentName
  title: string
  severity: SeverityLevel
  attack: string
  question: string
}

export interface AnalysisReport {
  risk_score: number
  executive_summary: string
  vulnerabilities: Vulnerability[]
  top_3_questions: string[]
  verdict: Verdict
}

export interface AgentState {
  name: AgentName
  status: AgentStatus
  vulnerabilities: Vulnerability[]
}

export interface SSEEvent {
  event: 'ingesting' | 'agent_start' | 'agent_complete' | 'synthesizing' | 'complete'
  agent?: string
  vulnerabilities?: Vulnerability[]
  report?: AnalysisReport
  message?: string
  progress?: number
}

export const AGENT_LABELS: Record<AgentName, string> = {
  cfo_agent: 'CFO',
  market_agent: 'Market',
  legal_agent: 'Legal',
  competitor_agent: 'Competitor',
  execution_agent: 'Execution',
}

export const AGENT_DESCRIPTIONS: Record<AgentName, string> = {
  cfo_agent: 'Financial vulnerabilities',
  market_agent: 'Demand assumptions',
  legal_agent: 'Governance & conflicts',
  competitor_agent: 'Competitive landscape',
  execution_agent: 'Operational capacity',
}
