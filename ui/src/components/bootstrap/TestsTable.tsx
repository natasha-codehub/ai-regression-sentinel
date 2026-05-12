import type { Generation, EvalScore, GateDecision } from '../../types'

// ── Gate chip ─────────────────────────────────────────────────────────────────

const GATE_STYLES: Record<GateDecision, string> = {
  PASS: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  WARN: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
  REVIEW: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',
  FAIL: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
}

function GateChip({ gate }: { gate: GateDecision }) {
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${GATE_STYLES[gate]}`}>{gate}</span>
  )
}

// ── Level chip ────────────────────────────────────────────────────────────────

function LevelChip({ level }: { level: string }) {
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
      {level}
    </span>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ composite }: { composite: number }) {
  const pct = Math.min(100, Math.max(0, composite))
  const color =
    pct >= 85 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : pct >= 50 ? 'bg-orange-500' : 'bg-rose-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 tabular-nums w-8">{pct.toFixed(1)}</span>
    </div>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────

interface TestsTableProps {
  generations: Generation[]
  evalScores: EvalScore[]
  onExpand?: (genId: string) => void
}

export default function TestsTable({ generations, evalScores, onExpand }: TestsTableProps) {
  const evalMap = new Map(evalScores.map((e) => [e.generation_id, e]))

  if (generations.length === 0) {
    return (
      <div className="border border-slate-800 rounded-lg p-5">
        <p className="text-xs font-mono text-slate-600">No generated tests.</p>
      </div>
    )
  }

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Generated Tests
        </h2>
        <span className="text-xs font-mono text-slate-600">{generations.length} tests</span>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            {['Test', 'Level', 'Composite', 'Gate', ''].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-mono text-slate-500 px-5 py-2.5 font-normal uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {generations.map((gen, idx) => {
            const evalRecord = evalMap.get(gen.id)
            const filename = (gen.file.split('/').pop() ?? gen.file).replace('.php', '')

            return (
              <tr
                key={gen.id}
                className={[
                  'border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors',
                  idx === generations.length - 1 ? 'border-b-0' : '',
                ].join(' ')}
              >
                {/* Test name */}
                <td className="px-5 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-mono text-slate-200">{filename}</span>
                    <span className="text-xs font-mono text-slate-600">{gen.id}</span>
                  </div>
                </td>

                {/* Level */}
                <td className="px-5 py-3">
                  <LevelChip level={gen.level} />
                </td>

                {/* Composite */}
                <td className="px-5 py-3">
                  {evalRecord ? (
                    <ScoreBar composite={evalRecord.composite} />
                  ) : (
                    <span className="text-xs font-mono text-slate-600">—</span>
                  )}
                </td>

                {/* Gate */}
                <td className="px-5 py-3">
                  {evalRecord ? (
                    <GateChip gate={evalRecord.gate_decision} />
                  ) : (
                    <span className="text-xs font-mono text-slate-600">—</span>
                  )}
                </td>

                {/* Expand */}
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onExpand?.(gen.id)}
                    className="text-xs font-mono text-slate-500 border border-slate-700 rounded px-2.5 py-1 hover:text-blue-400 hover:border-blue-500/50 transition-colors"
                  >
                    Trace →
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
