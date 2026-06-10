import { FlaskConical } from 'lucide-react'
import type { Generation, EvalScore, GateDecision } from '../../types'

// ── Gate chip ─────────────────────────────────────────────────────────────────

const GATE_STYLES: Record<GateDecision, string> = {
  PASS: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
  WARN: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
  REVIEW: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  FAIL: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
}

function GateChip({ gate }: { gate: GateDecision }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${GATE_STYLES[gate]}`}>
      {gate}
    </span>
  )
}

// ── Level chip ────────────────────────────────────────────────────────────────

function LevelChip({ level }: { level: string }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
      {level}
    </span>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ composite }: { composite: number }) {
  const pct = Math.min(100, Math.max(0, composite))
  const color =
    pct >= 85
      ? 'bg-[#22C55E]'
      : pct >= 70
        ? 'bg-[#F59E0B]'
        : pct >= 50
          ? 'bg-orange-500'
          : 'bg-[#EF4444]'
  const textColor =
    pct >= 85
      ? 'text-[#22C55E]'
      : pct >= 70
        ? 'text-[#F59E0B]'
        : pct >= 50
          ? 'text-orange-400'
          : 'text-[#EF4444]'

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-20 h-1.5 bg-[#24324A] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${textColor} tabular-nums w-9`}>
        {pct.toFixed(1)}
      </span>
    </div>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────

interface TestsTableProps {
  generations: Generation[]
  evalScores: EvalScore[]
  displayCount?: number
  onExpand?: (genId: string) => void
}

export default function TestsTable({ generations, evalScores, displayCount, onExpand }: TestsTableProps) {
  const evalMap = new Map(evalScores.map((e) => [e.generation_id, e]))

  if (generations.length === 0) {
    return (
      <div className="rounded-xl bg-[#121827] border border-[#24324A] p-6">
        <p className="text-sm text-[#64748B]">No generated tests.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#121827] border border-[#24324A] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#24324A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#F8FAFC]">Generated tests</h2>
            <p className="text-xs text-[#64748B]">Gate-scored and ready to commit</p>
          </div>
        </div>
        <span className="text-sm font-medium text-[#94A3B8]">
          {(displayCount ?? generations.length).toLocaleString()} test{(displayCount ?? generations.length) !== 1 ? 's' : ''}
        </span>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#24324A]">
            {['Test file', 'Level', 'Score', 'Gate', ''].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-medium text-[#64748B] px-6 py-3 uppercase tracking-wider"
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
                  'border-b border-[#24324A]/60 hover:bg-[#151E30] transition-colors',
                  idx === generations.length - 1 ? 'border-b-0' : '',
                ].join(' ')}
              >
                {/* Test name */}
                <td className="px-6 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[#F8FAFC]">{filename}</span>
                    <span className="text-xs font-mono text-[#64748B]">{gen.id}</span>
                  </div>
                </td>

                {/* Level */}
                <td className="px-6 py-3.5">
                  <LevelChip level={gen.level} />
                </td>

                {/* Score */}
                <td className="px-6 py-3.5">
                  {evalRecord ? (
                    <ScoreBar composite={evalRecord.composite} />
                  ) : (
                    <span className="text-xs text-[#64748B]">—</span>
                  )}
                </td>

                {/* Gate */}
                <td className="px-6 py-3.5">
                  {evalRecord ? (
                    <GateChip gate={evalRecord.gate_decision} />
                  ) : (
                    <span className="text-xs text-[#64748B]">—</span>
                  )}
                </td>

                {/* Trace */}
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={() => onExpand?.(gen.id)}
                    className="text-xs font-medium text-[#64748B] border border-[#24324A] rounded-lg px-3 py-1.5 hover:text-[#60A5FA] hover:border-[#3B82F6]/40 transition-all duration-150"
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
