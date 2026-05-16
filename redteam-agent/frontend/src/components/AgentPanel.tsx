import { AgentName, AgentState, AGENT_DESCRIPTIONS, AGENT_LABELS } from '../types'
import { SeverityBadge } from './SeverityBadge'

const AGENT_ICONS: Record<AgentName, string> = {
  cfo_agent: '💰',
  market_agent: '📊',
  legal_agent: '⚖️',
  competitor_agent: '🎯',
  execution_agent: '⚙️',
}

function AgentCard({ state }: { state: AgentState }) {
  const { name, status, vulnerabilities } = state
  const firstVuln = vulnerabilities[0]

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-300 ${
        status === 'waiting'
          ? 'border-gray-700 bg-gray-800/50 opacity-60'
          : status === 'thinking'
            ? 'border-blue-500 bg-blue-900/20 shadow-blue-500/20 shadow-lg'
            : 'border-gray-600 bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{AGENT_ICONS[name]}</span>
        <div>
          <p className="font-bold text-white">{AGENT_LABELS[name]}</p>
          <p className="text-xs text-gray-400">{AGENT_DESCRIPTIONS[name]}</p>
        </div>
        <div className="ml-auto">
          {status === 'thinking' && (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'complete' && <span className="text-green-400 text-lg">✓</span>}
          {status === 'waiting' && <span className="text-gray-600">○</span>}
        </div>
      </div>

      {status === 'thinking' && (
        <p className="text-blue-300 text-sm animate-pulse">Attacking...</p>
      )}

      {status === 'complete' && firstVuln && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={firstVuln.severity} />
            <p className="text-sm text-gray-200 font-medium truncate">{firstVuln.title}</p>
          </div>
          {vulnerabilities.length > 1 && (
            <p className="text-xs text-gray-500">+{vulnerabilities.length - 1} more</p>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentPanel({ agents }: { agents: AgentState[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Red Team Agents
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {agents.map((a) => (
          <AgentCard key={a.name} state={a} />
        ))}
      </div>
    </div>
  )
}
