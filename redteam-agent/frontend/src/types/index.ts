export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM'
export type Verdict = 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'DO_NOT_PROCEED'
export type AgentName = 'cfo_agent' | 'market_agent' | 'legal_agent' | 'competitor_agent' | 'execution_agent'
export type AgentStatus = 'waiting' | 'thinking' | 'complete' | 'error'
export type AppView = 'login' | 'dashboard' | 'analysis'
export type DashboardSection = 'overview' | 'sources' | 'agents' | 'history'

export interface Vulnerability {
  id: string
  agent: AgentName
  title: string
  severity: SeverityLevel
  attack: string
  question: string
  sources?: string[]
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

export type DataSourceType =
  | 'notion'
  | 'gdrive'
  | 'confluence'
  | 'salesforce'
  | 'slack'
  | 'jira'
  | 'sharepoint'
  | 'upload'

export interface DataSource {
  id: string
  name: string
  type: DataSourceType
  connected: boolean
  lastSync?: string
  docsCount?: number
  description: string
}

export interface Agent {
  id: string
  name: string
  role: string
  description: string
  icon: string
  isBuiltIn: boolean
  enabled: boolean
  color: string
}

export interface HistoryItem {
  id: string
  title: string
  date: string
  riskScore: number
  verdict: Verdict
  vulnerabilitiesCount: number
  tags: string[]
}

export interface User {
  name: string
  email: string
  company: string
  avatar: string
}

export const AGENT_LABELS: Record<AgentName, string> = {
  cfo_agent: 'CFO',
  market_agent: 'Market',
  legal_agent: 'Legal',
  competitor_agent: 'Competitor',
  execution_agent: 'Execution',
}
