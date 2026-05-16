import { useCallback, useState } from 'react'
import {
  Agent,
  AgentName,
  AgentState,
  AnalysisReport,
  AppView,
  DashboardSection,
  SSEEvent,
  User,
} from './types'
import { MOCK_AGENTS, MOCK_DATA_SOURCES, MOCK_HISTORY, MOCK_USER } from './data/mock'
import { useSSE } from './hooks/useSSE'
import { LoginView } from './views/LoginView'
import { DashboardView } from './views/DashboardView'
import { AnalysisView } from './views/AnalysisView'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

const INITIAL_AGENTS: AgentState[] = (
  ['cfo_agent', 'market_agent', 'legal_agent', 'competitor_agent', 'execution_agent'] as AgentName[]
).map((name) => ({ name, status: 'waiting', vulnerabilities: [] }))

export default function App() {
  // Auth
  const [view, setView] = useState<AppView>('login')
  const [user, setUser] = useState<User | null>(null)

  // Dashboard
  const [section, setSection] = useState<DashboardSection>('overview')
  const [dataSources, setDataSources] = useState(MOCK_DATA_SOURCES)
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
  const [history] = useState(MOCK_HISTORY)

  // Analysis
  const [analysisPhase, setAnalysisPhase] = useState<'running' | 'done'>('running')
  const [agentStates, setAgentStates] = useState<AgentState[]>(INITIAL_AGENTS)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [progress, setProgress] = useState(0)

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.event) {
      case 'ingesting':
        setProgress(5)
        break
      case 'agent_start':
        setAgentStates((prev) =>
          prev.map((a) => (a.name === event.agent ? { ...a, status: 'thinking' } : a)),
        )
        break
      case 'agent_complete':
        setAgentStates((prev) =>
          prev.map((a) =>
            a.name === event.agent
              ? { ...a, status: 'complete', vulnerabilities: event.vulnerabilities ?? [] }
              : a,
          ),
        )
        setProgress(event.progress ?? 0)
        break
      case 'synthesizing':
        setProgress(85)
        break
      case 'complete':
        if (event.report) {
          setReport(event.report)
          setAnalysisPhase('done')
          setProgress(100)
        }
        break
    }
  }, [])

  const { connect, isConnected } = useSSE(handleSSEEvent)

  function handleLogin(loggedUser: User) {
    setUser(loggedUser)
    setView('dashboard')
  }

  function handleLogout() {
    setUser(null)
    setView('login')
  }

  function handleStartAnalysis(formData: FormData) {
    const sid = crypto.randomUUID()
    setSessionId(sid)
    setAgentStates(INITIAL_AGENTS)
    setReport(null)
    setProgress(0)
    setAnalysisPhase('running')
    setView('analysis')

    formData.append('session_id', sid)
    connect(`${API_BASE}/analyze`, formData)
  }

  function handleBackToDashboard() {
    setView('dashboard')
    setAgentStates(INITIAL_AGENTS)
    setReport(null)
    setProgress(0)
  }

  function toggleSource(id: string) {
    setDataSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s)),
    )
  }

  function toggleAgent(id: string) {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    )
  }

  function addAgent(newAgent: Omit<Agent, 'id' | 'isBuiltIn'>) {
    setAgents((prev) => [
      ...prev,
      { ...newAgent, id: `custom_${Date.now()}`, isBuiltIn: false },
    ])
  }

  if (view === 'login') {
    return <LoginView onLogin={handleLogin} />
  }

  if (view === 'analysis') {
    return (
      <AnalysisView
        phase={analysisPhase}
        agents={agentStates}
        report={report}
        progress={progress}
        sessionId={sessionId}
        onBack={handleBackToDashboard}
      />
    )
  }

  return (
    <DashboardView
      user={user ?? MOCK_USER}
      section={section}
      onSection={setSection}
      dataSources={dataSources}
      agents={agents}
      history={history}
      onToggleSource={toggleSource}
      onToggleAgent={toggleAgent}
      onAddAgent={addAgent}
      onStart={handleStartAnalysis}
      isLoading={isConnected}
      onLogout={handleLogout}
    />
  )
}
