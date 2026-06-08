import { useState, useEffect } from 'react'
import { useSteadyStateData } from '../hooks/useSteadyStateData'
import DiffPanel from '../components/steadystate/DiffPanel'
import ImpactGraph from '../components/steadystate/ImpactGraph'
import PRCommentPanel from '../components/steadystate/PRCommentPanel'

type Phase = 'idle' | 'analyzing' | 'done'

// ── Analysis animation ────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Parsing diff…', delay: 0 },
  { label: 'Mapping affected tests…', delay: 950 },
  { label: 'Drafting PR comment…', delay: 1900 },
]

function AnalyzingState() {
  const [visible, setVisible] = useState<number[]>([0])
  const [done, setDone] = useState<number[]>([])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => { setDone([0]); setVisible([0, 1]) }, 950))
    timers.push(setTimeout(() => { setDone([0, 1]); setVisible([0, 1, 2]) }, 1900))
    timers.push(setTimeout(() => { setDone([0, 1, 2]) }, 2700))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-300 font-medium tracking-wide">Running Sentinel</span>
      </div>

      <div className="flex flex-col gap-2.5 w-56">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 transition-opacity duration-400"
            style={{ opacity: visible.includes(i) ? 1 : 0 }}
          >
            {done.includes(i) ? (
              <span className="text-emerald-400 text-xs leading-none">✓</span>
            ) : visible.includes(i) ? (
              <div className="w-3 h-3 border border-slate-500 border-t-slate-300 rounded-full animate-spin shrink-0" />
            ) : (
              <span className="w-3 h-3 shrink-0" />
            )}
            <span
              className={`text-xs transition-colors duration-300 ${
                done.includes(i) ? 'text-slate-500' : 'text-slate-300'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Idle state ────────────────────────────────────────────────────────────────

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-2 select-none">
      <p className="text-sm text-slate-400">
        Click{' '}
        <span className="font-mono text-blue-300 font-semibold">Run Sentinel</span>
        {' '}to analyze the PR
      </p>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function SteadyStatePanel() {
  const [phase, setPhase] = useState<Phase>('idle')
  const { impact, prComment, diffText } = useSteadyStateData()

  function handleRun() {
    if (phase !== 'idle') return
    setPhase('analyzing')
    setTimeout(() => setPhase('done'), 3000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Banner ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-700 border-t-2 border-t-violet-500 bg-zinc-900/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-orange-400 text-base shrink-0">⚡</span>
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest leading-none mb-0.5">
              Triggered by
            </p>
            <p className="text-base text-slate-100 font-semibold truncate">
              PR #2387&nbsp;
              <span className="text-slate-300 font-normal italic">
                "Fix tax calculation for free shipping in CA"
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={phase !== 'idle'}
          className={`
            shrink-0 ml-6 text-xs font-mono px-4 py-2 rounded border transition-all duration-200
            ${phase === 'idle'
              ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-900/40'
              : phase === 'analyzing'
                ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-900/40 border-emerald-700 text-emerald-400 cursor-default'
            }
          `}
        >
          {phase === 'idle' && 'Run Sentinel'}
          {phase === 'analyzing' && 'Analyzing…'}
          {phase === 'done' && '✓ Complete'}
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {phase === 'idle' && <IdleState />}
        {phase === 'analyzing' && <AnalyzingState />}

        {phase === 'done' && (
          <div className="flex h-full gap-3 p-4 overflow-hidden">
            {/* Left — Diff viewer */}
            <div className="w-[44%] min-w-0 shrink-0">
              <DiffPanel diffText={diffText} />
            </div>

            {/* Right — Impact graph + PR comment */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div className="flex-1 min-h-0">
                <ImpactGraph impact={impact} />
              </div>
              <div className="flex-1 min-h-0">
                <PRCommentPanel markdown={prComment} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
