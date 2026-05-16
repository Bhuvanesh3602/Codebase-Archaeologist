import { SeverityLevel } from '../types'

const COLORS: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-yellow-400 text-black',
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wide ${COLORS[severity]}`}>
      {severity}
    </span>
  )
}
