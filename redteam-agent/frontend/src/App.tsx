import { useCallback, useState } from 'react'
import { AgentName, AgentState, AnalysisReport, SSEEvent } from './types'
import { DocumentUpload } from './components/DocumentUpload'
import { AgentPanel } from './components/AgentPanel'
import { VulnerabilityReport } from './components/VulnerabilityReport'
import { QAChat } from './components/QAChat'
import { useSSE } from './hooks/useSSE'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

const INITIAL_AGENTS: AgentState[] = (
  ['cfo_agent', 'market_agent', 'legal_agent', 'competitor_agent', 'execution_agent'] as AgentName[]
).map((name) => ({ name, status: 'waiting', vulnerabilities: [] }))

export default function App() {
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.event) {
      case 'ingesting':
        setPhase('running')
        setProgress(5)
        break

      case 'agent_start':
        setAgents((prev) =>
          prev.map((a) =>
            a.name === event.agent ? { ...a, status: 'thinking' } : a,
          ),
        )
        break

      case 'agent_complete':
        setAgents((prev) =>
          prev.map((a) =>
            a.name === event.agent
              ? { ...a, status: 'complete', vulnerabilities: event.vulnerabilities ?? [] }
              : a,
          ),
        )
        setProgress(event.progress ?? progress)
        break

      case 'synthesizing':
        setProgress(85)
        break

      case 'complete':
        if (event.report) {
          setReport(event.report)
          setPhase('done')
          setProgress(100)
        }
        break
    }
  }, [progress])

  const { connect, isConnected, error } = useSSE(handleEvent)

  function handleStart(formData: FormData) {
    setAgents(INITIAL_AGENTS)
    setReport(null)
    setProgress(0)
    setPhase('idle')

    const sid = crypto.randomUUID()
    setSessionId(sid)
    formData.append('session_id', sid)
    connect(`${API_BASE}/analyze`, formData)
  }

  function handleReset() {
    setAgents(INITIAL_AGENTS)
    setReport(null)
    setPhase('idle')
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-red-500">RED</span> TEAM AGENT
          </h1>
          <p className="text-xs text-gray-500">Adversarial Strategic Analysis</p>
        </div>
        {phase !== 'idle' && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Reset
          </button>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {phase === 'idle' && (
          <div className="max-w-lg mx-auto">
            <div className="mb-8 text-center">
              <p className="text-gray-400 text-sm leading-relaxed">
                5 adversarial agents attack your strategic document from different angles.
                <br />RAG-powered using your internal company context.
              </p>
            </div>
            <DocumentUpload onStart={handleStart} isLoading={isConnected} />
            {error && (
              <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        )}

        {phase === 'running' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <AgentPanel agents={agents} />
            </div>
            <div className="lg:col-span-2 flex flex-col items-center justify-center">
              <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">
                {progress < 80 ? 'Agents attacking...' : 'Synthesizing report...' }
              </p>
            </div>
          </div>
        )}

        {phase === 'done' && report && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <AgentPanel agents={agents} />
              <div className="h-96 bg-gray-900 rounded-xl p-4 flex flex-col">
                <QAChat sessionId={sessionId} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <VulnerabilityReport report={report} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
