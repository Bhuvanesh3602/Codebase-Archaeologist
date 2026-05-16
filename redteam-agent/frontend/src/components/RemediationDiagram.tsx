import { AnalysisReport, AgentName, SeverityLevel } from '../types'

const SEV_STYLES: Record<SeverityLevel, { bg: string; border: string; dot: string; label: string }> = {
  CRITICAL: { bg: '#1c0707', border: '#b91c1c', dot: '#ef4444', label: '#fca5a5' },
  HIGH: { bg: '#1c0c07', border: '#c2410c', dot: '#f97316', label: '#fdba74' },
  MEDIUM: { bg: '#1c1607', border: '#a16207', dot: '#eab308', label: '#fde047' },
}

const AGENT_ACTIONS: Record<AgentName, string> = {
  cfo_agent: 'Independent financial audit',
  market_agent: 'Third-party market validation',
  legal_agent: 'External legal & compliance review',
  competitor_agent: 'Competitive intelligence update',
  execution_agent: 'Operational readiness assessment',
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function RemediationDiagram({ report }: { report: AnalysisReport }): JSX.Element | null {
  const sorted = [...report.vulnerabilities].sort((a, b) => {
    const order: Record<SeverityLevel, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
    return order[a.severity] - order[b.severity]
  })

  const topFindings = sorted.slice(0, 4)

  const agentActions: { agent: AgentName; action: string }[] = []
  const seenAgents = new Set<AgentName>()
  for (const v of sorted) {
    const agent = v.agent as AgentName
    if (!seenAgents.has(agent)) {
      seenAgents.add(agent)
      agentActions.push({ agent, action: AGENT_ACTIONS[agent] ?? trunc(v.title, 30) })
    }
    if (agentActions.length >= 4) break
  }

  const verdictColor =
    report.verdict === 'DO_NOT_PROCEED'
      ? '#ef4444'
      : report.verdict === 'PROCEED_WITH_CAUTION'
        ? '#f59e0b'
        : '#22c55e'
  const scoreColor = report.risk_score >= 80 ? '#ef4444' : report.risk_score >= 50 ? '#f59e0b' : '#22c55e'

  const W = 800
  const BOX_H = 46
  const GAP_Y = 14
  const START_Y = 36
  const n = Math.max(topFindings.length, agentActions.length, 1)
  const H = START_Y + n * (BOX_H + GAP_Y) + 24

  const C1_X = 0,
    C1_W = 245
  const C2_X = 295,
    C2_W = 245
  const C3_X = 592,
    C3_W = 180

  const rowCY = (i: number) => START_Y + i * (BOX_H + GAP_Y) + BOX_H / 2
  const verdictCY = H / 2

  if (topFindings.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
        <span className="text-sm font-semibold text-white">Remediation Roadmap</span>
        <span className="text-zinc-600 text-sm">—</span>
        <span className="text-sm text-zinc-400">risk-to-action operational flowchart</span>
      </div>
      <div className="p-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: Math.min(H, 300) }}
          fontFamily="inherit"
        >
          <defs>
            <marker id="rta-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <polyline points="1,1 6,4 1,7" fill="none" stroke="#52525b" strokeWidth="1.2" />
            </marker>
          </defs>

          {/* Column headers */}
          <text x={C1_X + C1_W / 2} y={16} textAnchor="middle" fontSize={9} fill="#52525b" fontWeight="700" letterSpacing="1.5">
            IDENTIFIED RISKS
          </text>
          <text x={C2_X + C2_W / 2} y={16} textAnchor="middle" fontSize={9} fill="#52525b" fontWeight="700" letterSpacing="1.5">
            REMEDIATION ACTIONS
          </text>
          <text x={C3_X + C3_W / 2} y={16} textAnchor="middle" fontSize={9} fill="#52525b" fontWeight="700" letterSpacing="1.5">
            ASSESSMENT
          </text>

          {/* Finding boxes */}
          {topFindings.map((v, i) => {
            const s = SEV_STYLES[v.severity]
            const y = START_Y + i * (BOX_H + GAP_Y)
            const cy = y + BOX_H / 2
            const targetI = Math.min(i, agentActions.length - 1)
            const targetCY = rowCY(targetI)
            const x1 = C1_X + C1_W
            const x2 = C2_X
            return (
              <g key={v.id}>
                <rect x={C1_X} y={y} width={C1_W} height={BOX_H} rx={6} fill={s.bg} stroke={s.border} strokeWidth={0.75} />
                <circle cx={C1_X + 13} cy={cy} r={4} fill={s.dot} />
                <text x={C1_X + 26} y={y + 17} fontSize={9} fill={s.label} fontWeight="700">
                  {v.severity}
                </text>
                <text x={C1_X + 26} y={y + 33} fontSize={11} fill="#d4d4d8">
                  {trunc(v.title, 27)}
                </text>
                <path
                  d={`M ${x1} ${cy} C ${x1 + 28} ${cy} ${x2 - 28} ${targetCY} ${x2} ${targetCY}`}
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth={1}
                  markerEnd="url(#rta-arr)"
                />
              </g>
            )
          })}

          {/* Action boxes */}
          {agentActions.map(({ action }, i) => {
            const y = START_Y + i * (BOX_H + GAP_Y)
            const cy = y + BOX_H / 2
            const x1 = C2_X + C2_W
            const x2 = C3_X
            return (
              <g key={i}>
                <rect x={C2_X} y={y} width={C2_W} height={BOX_H} rx={6} fill="#141414" stroke="#3f3f46" strokeWidth={0.75} />
                <text x={C2_X + 13} y={y + 17} fontSize={9} fill="#71717a" fontWeight="600">
                  {`ACTION ${String(i + 1).padStart(2, '0')}`}
                </text>
                <text x={C2_X + 13} y={y + 33} fontSize={11} fill="#a1a1aa">
                  {trunc(action, 31)}
                </text>
                <path
                  d={`M ${x1} ${cy} C ${x1 + 28} ${cy} ${x2 - 28} ${verdictCY} ${x2} ${verdictCY}`}
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth={1}
                  markerEnd="url(#rta-arr)"
                />
              </g>
            )
          })}

          {/* Verdict box */}
          {(() => {
            const vH = 118
            const vY = verdictCY - vH / 2
            return (
              <g>
                <rect x={C3_X} y={vY} width={C3_W} height={vH} rx={8} fill="#080808" stroke={verdictColor} strokeWidth={1.5} />
                <text x={C3_X + C3_W / 2} y={vY + 22} textAnchor="middle" fontSize={9} fill="#52525b" fontWeight="600" letterSpacing="1">
                  RISK SCORE
                </text>
                <text x={C3_X + C3_W / 2} y={vY + 62} textAnchor="middle" fontSize={38} fill={scoreColor} fontWeight="900">
                  {report.risk_score}
                </text>
                <text x={C3_X + C3_W / 2} y={vY + 78} textAnchor="middle" fontSize={9} fill="#52525b">
                  / 100
                </text>
                <text x={C3_X + C3_W / 2} y={vY + 100} textAnchor="middle" fontSize={9} fill={verdictColor} fontWeight="700">
                  {report.verdict.replace(/_/g, ' ')}
                </text>
              </g>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}
