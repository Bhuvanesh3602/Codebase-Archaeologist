import { DataSource } from '../types'
import { DATA_SOURCE_ICONS } from '../data/mock'

interface DataSourcesSectionProps {
  sources: DataSource[]
  onToggle: (id: string) => void
  compact?: boolean
}

export function DataSourcesSection({ sources, onToggle, compact = false }: DataSourcesSectionProps) {
  const connected = sources.filter((s) => s.connected)

  if (compact) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Data Sources</h3>
          <span className="text-xs text-zinc-500">{connected.length} connected</span>
        </div>
        <div className="space-y-2">
          {sources.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-base">{DATA_SOURCE_ICONS[s.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 font-medium">{s.name}</p>
                {s.connected && s.docsCount && (
                  <p className="text-xs text-zinc-600">{s.docsCount.toLocaleString()} docs</p>
                )}
              </div>
              <div className={`w-2 h-2 rounded-full ${s.connected ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Data Sources</h2>
        <p className="text-zinc-500 text-sm mt-1">
          Connected sources are automatically included as context in every analysis.
        </p>
      </div>

      {connected.length > 0 && (
        <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <p className="text-emerald-400 text-sm font-medium mb-2">
            {connected.length} source{connected.length > 1 ? 's' : ''} active — Red Team will use this context
          </p>
          <div className="flex flex-wrap gap-2">
            {connected.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full">
                <span>{DATA_SOURCE_ICONS[s.type]}</span>
                {s.name}
                {s.docsCount && <span className="text-zinc-600">· {s.docsCount.toLocaleString()}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map((s) => (
          <SourceCard key={s.id} source={s} onToggle={() => onToggle(s.id)} />
        ))}
      </div>
    </div>
  )
}

function SourceCard({ source, onToggle }: { source: DataSource; onToggle: () => void }) {
  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 transition-colors ${
      source.connected ? 'border-zinc-700' : 'border-zinc-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5">{DATA_SOURCE_ICONS[source.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white font-medium text-sm">{source.name}</p>
            <Toggle checked={source.connected} onChange={onToggle} />
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">{source.description}</p>
          {source.connected && (
            <div className="flex items-center gap-3 mt-2">
              {source.docsCount && (
                <span className="text-xs text-zinc-400">{source.docsCount.toLocaleString()} docs</span>
              )}
              {source.lastSync && (
                <span className="text-xs text-zinc-600">Synced {source.lastSync}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-emerald-500' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )
}
