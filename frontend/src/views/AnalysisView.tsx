import logo from '../../logo.png'
import { AgentName, AgentState, AnalysisReport, AGENT_LABELS, Verdict } from '../types'
import { VulnerabilityReport } from '../components/VulnerabilityReport'
import { QAChat } from '../components/QAChat'
import { RemediationDiagram } from '../components/RemediationDiagram'

interface AnalysisViewProps {
  phase: 'running' | 'done'
  agents: AgentState[]
  report: AnalysisReport | null
  progress: number
  sessionId: string
  onBack: () => void
}

const VERDICT_STYLES: Record<Verdict, string> = {
  DO_NOT_PROCEED: 'text-red-400 bg-red-500/10 border-red-500/20',
  PROCEED_WITH_CAUTION: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PROCEED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'text-red-400' : s >= 50 ? 'text-amber-400' : 'text-emerald-400'

const AGENT_ICONS: Record<AgentName, string> = {
  cfo_agent: '💰',
  market_agent: '📊',
  legal_agent: '⚖️',
  competitor_agent: '🎯',
  execution_agent: '⚙️',
}

const SEVERITY_WEIGHTS: Record<string, number> = { CRITICAL: 30, HIGH: 15, MEDIUM: 5 }

export function AnalysisView({ phase, agents, report, progress, sessionId, onBack }: AnalysisViewProps) {
  if (phase === 'running') {
    return <RunningView agents={agents} progress={progress} onBack={onBack} />
  }

  return <ResultView report={report!} sessionId={sessionId} onBack={onBack} />
}

function RunningView({
  agents,
  progress,
  onBack,
}: {
  agents: AgentState[]
  progress: number
  onBack: () => void
}) {
  const completedCount = agents.filter((a) => a.status === 'complete').length
  const totalVulns = agents.reduce((acc, a) => acc + a.vulnerabilities.length, 0)

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-900 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
        >
          ← Back
        </button>
        <img src={logo} alt="Red Team Agent" className="h-6 w-auto" />
      </header>

      {/* Loading content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-2xl mx-auto w-full">
        <div className="w-full space-y-8">
          <div className="text-center">
            <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">Red Team in progress</p>
            <h2 className="text-3xl font-bold text-white">
              {progress < 80 ? 'Attacking your document...' : 'Synthesizing findings...'}
            </h2>
            {totalVulns > 0 && (
              <p className="text-zinc-500 text-sm mt-2">
                {totalVulns} vulnerabilit{totalVulns === 1 ? 'y' : 'ies'} found so far
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-900 rounded-full h-1.5">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Agent status */}
          <div className="grid grid-cols-5 gap-2">
            {agents.map((a) => (
              <div
                key={a.name}
                className={`p-3 rounded-xl border text-center transition-all ${
                  a.status === 'waiting'
                    ? 'border-zinc-900 opacity-40'
                    : a.status === 'thinking'
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className="text-lg mb-1">{AGENT_ICONS[a.name]}</div>
                <p className="text-xs text-zinc-400 font-medium">{AGENT_LABELS[a.name]}</p>
                <p className={`text-xs mt-1 ${
                  a.status === 'thinking' ? 'text-red-400 animate-pulse' :
                  a.status === 'complete' ? 'text-emerald-500' :
                  'text-zinc-700'
                }`}>
                  {a.status === 'thinking' ? 'attacking' : a.status === 'complete' ? `${a.vulnerabilities.length} found` : 'waiting'}
                </p>
                {a.status === 'complete' && a.vulnerabilities.length > 0 && (
                  <p className="text-xs font-black text-red-400 mt-0.5">
                    +{a.vulnerabilities.reduce((sum, v) => sum + (SEVERITY_WEIGHTS[v.severity] ?? 0), 0)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-700 text-xs">
            {completedCount} of {agents.length} agents complete
          </p>
        </div>
      </div>
    </div>
  )
}

function ResultView({
  report,
  sessionId,
  onBack,
}: {
  report: AnalysisReport
  sessionId: string
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-black">
      {/* Fixed top bar */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-zinc-900 px-8 py-5 flex items-center gap-6">
        <button
          onClick={onBack}
          className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors shrink-0"
        >
          ← Back
        </button>
        <img src={logo} alt="Red Team Agent" className="h-12 w-auto shrink-0" />
        <div className="flex-1" />
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-0.5">Risk Score</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-5xl font-black leading-none ${SCORE_COLOR(report.risk_score)}`}>
                {report.risk_score}
              </span>
              <span className="text-zinc-700 text-base">/100</span>
            </div>
          </div>
          <div className={`text-sm font-bold px-4 py-2.5 rounded-xl border ${VERDICT_STYLES[report.verdict]}`}>
            {report.verdict.replace(/_/g, ' ')}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Q&A at top, after result */}
        <QAChat sessionId={sessionId} />

        {/* Remediation flowchart */}
        <RemediationDiagram report={report} />

        {/* Full findings */}
        <VulnerabilityReport report={report} />
      </div>
    </div>
  )
}
