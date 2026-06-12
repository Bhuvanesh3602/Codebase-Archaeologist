import { HistoryItem, Verdict } from '../types'

interface HistorySectionProps {
  items: HistoryItem[]
  compact?: boolean
}

const VERDICT_STYLES: Record<Verdict, string> = {
  DO_NOT_PROCEED: 'text-red-400 bg-red-500/10 border-red-500/20',
  PROCEED_WITH_CAUTION: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PROCEED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const VERDICT_LABELS: Record<Verdict, string> = {
  DO_NOT_PROCEED: 'Do Not Proceed',
  PROCEED_WITH_CAUTION: 'Caution',
  PROCEED: 'Proceed',
}

const SCORE_COLOR = (score: number) =>
  score >= 80 ? 'text-red-400' : score >= 50 ? 'text-amber-400' : 'text-emerald-400'

export function HistorySection({ items, compact = false }: HistorySectionProps) {
  if (compact) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Analyses</h3>
          <span className="text-xs text-zinc-500">{items.length} total</span>
        </div>
        <div className="space-y-2">
          {items.slice(0, 3).map((item) => (
            <HistoryRow key={item.id} item={item} compact />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Analysis History</h2>
        <p className="text-zinc-500 text-sm mt-1">All past Red Team evaluations.</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function HistoryRow({ item, compact }: { item: HistoryItem; compact?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer group">
      <div className="text-center shrink-0 w-10">
        <p className={`text-lg font-black leading-none ${SCORE_COLOR(item.riskScore)}`}>
          {item.riskScore}
        </p>
        <p className="text-zinc-700 text-xs">score</p>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-zinc-100">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-zinc-600 text-xs">{item.date}</span>
          {!compact && item.tags.map((tag) => (
            <span key={tag} className="text-zinc-600 text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        {!compact && (
          <span className="text-xs text-zinc-600">{item.vulnerabilitiesCount} findings</span>
        )}
        <span className={`text-xs font-medium px-2 py-1 rounded-md border ${VERDICT_STYLES[item.verdict]}`}>
          {VERDICT_LABELS[item.verdict]}
        </span>
      </div>
    </div>
  )
}
