import { Agent, DataSource, DashboardSection, HistoryItem, User } from '../types'
import { Sidebar } from '../components/Sidebar'
import { NewAnalysisCard } from '../components/NewAnalysisCard'
import { DataSourcesSection } from '../components/DataSourcesSection'
import { HistorySection } from '../components/HistorySection'
import { AgentsSection } from '../components/AgentsSection'

interface DashboardViewProps {
  user: User
  section: DashboardSection
  onSection: (s: DashboardSection) => void
  dataSources: DataSource[]
  agents: Agent[]
  history: HistoryItem[]
  onToggleSource: (id: string) => void
  onToggleAgent: (id: string) => void
  onAddAgent: (agent: Omit<Agent, 'id' | 'isBuiltIn'>) => void
  onStart: (formData: FormData) => void
  isLoading: boolean
  onLogout: () => void
}

export function DashboardView({
  user,
  section,
  onSection,
  dataSources,
  agents,
  history,
  onToggleSource,
  onToggleAgent,
  onAddAgent,
  onStart,
  isLoading,
  onLogout,
}: DashboardViewProps) {
  const connectedSources = dataSources.filter((s) => s.connected)
  const activeAgents = agents.filter((a) => a.enabled)

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar section={section} onSection={onSection} user={user} onLogout={onLogout} />

      <main className="ml-56 flex-1 overflow-y-auto min-w-0">
        {section === 'overview' && (
          <OverviewSection
            user={user}
            dataSources={dataSources}
            history={history}
            connectedCount={connectedSources.length}
            activeAgentCount={activeAgents.length}
            onToggleSource={onToggleSource}
            onStart={onStart}
            isLoading={isLoading}
          />
        )}
        {section === 'sources' && (
          <div className="p-8">
            <DataSourcesSection sources={dataSources} onToggle={onToggleSource} />
          </div>
        )}
        {section === 'agents' && (
          <div className="p-8">
            <AgentsSection agents={agents} onToggle={onToggleAgent} onAdd={onAddAgent} />
          </div>
        )}
        {section === 'history' && (
          <div className="p-8">
            <HistorySection items={history} />
          </div>
        )}
      </main>
    </div>
  )
}

interface OverviewProps {
  user: User
  dataSources: DataSource[]
  history: HistoryItem[]
  connectedCount: number
  activeAgentCount: number
  onToggleSource: (id: string) => void
  onStart: (fd: FormData) => void
  isLoading: boolean
}

function OverviewSection({
  user,
  dataSources,
  history,
  connectedCount,
  activeAgentCount,
  onToggleSource,
  onStart,
  isLoading,
}: OverviewProps) {
  return (
    <div className="p-4 sm:p-8 space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good morning, {user.name.split(' ')[0]}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {user.company} workspace — {connectedCount} sources active, {activeAgentCount} agents ready
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Analyses this month"
          value={String(history.length)}
          trend="+2 vs last month"
          trendUp
        />
        <StatCard
          label="Critical findings"
          value={String(history.reduce((acc) => acc + 3, 0))}
          trend="across all analyses"
        />
        <StatCard
          label="Avg. Risk Score"
          value={String(Math.round(history.reduce((a, h) => a + h.riskScore, 0) / history.length))}
          trend="last 30 days"
        />
      </div>

      {/* New analysis (full width, prominent) */}
      <NewAnalysisCard onStart={onStart} isLoading={isLoading} />

      {/* Two columns: history + sources */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <HistorySection items={history} compact />
        <DataSourcesSection sources={dataSources} onToggle={onToggleSource} compact />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string
  value: string
  trend: string
  trendUp?: boolean
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-zinc-400 text-xs font-medium mt-0.5">{label}</p>
      <p className={`text-xs mt-2 ${trendUp ? 'text-emerald-500' : 'text-zinc-600'}`}>{trend}</p>
    </div>
  )
}
