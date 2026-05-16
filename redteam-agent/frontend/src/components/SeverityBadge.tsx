import { SeverityLevel } from '../types'

const STYLES: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide ${STYLES[severity]}`}>
      {severity}
    </span>
  )
}
