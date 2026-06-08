import { useState, useEffect } from 'react'
import { useSteadyStateData } from '../hooks/useSteadyStateData'
import DiffPanel from '../components/steadystate/DiffPanel'
import ImpactGraph from '../components/steadystate/ImpactGraph'
import PRCommentPanel from '../components/steadystate/PRCommentPanel'
import { Play, Loader2, CheckCircle2, Zap } from 'lucide-react'

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
        <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
        <span className="text-sm font-medium text-[#F8FAFC] tracking-wide">Running Sentinel</span>
      </div>

      <div className="flex flex-col gap-2.5 w-56">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 transition-opacity duration-400"
            style={{ opacity: visible.includes(i) ? 1 : 0 }}
          >
            {done.includes(i) ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
            ) : visible.includes(i) ? (
              <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 shrink-0" />
            )}
            <span
              className={`text-sm transition-colors duration-300 ${
                done.includes(i) ? 'text-[#64748B]' : 'text-[#94A3B8]'
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
      <p className="text-sm text-[#64748B]">
        Click{' '}
        <span className="font-semibold text-[#60A5FA]">Run Sentinel</span>
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
      {/* Banner */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#24324A] bg-[#121827]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#64748B] leading-none mb-1">Triggered by</p>
            <p className="text-sm font-semibold text-[#F8FAFC] truncate">
              PR #2387{' '}
              <span className="text-[#94A3B8] font-normal italic">
                "Fix tax calculation for free shipping in CA"
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={phase !== 'idle'}
          className={`
            shrink-0 ml-6 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200
            ${phase === 'idle'
              ? 'bg-[#3B82F6] border-[#3B82F6] text-white hover:bg-[#2563EB] cursor-pointer shadow-lg shadow-[#3B82F6]/20'
              : phase === 'analyzing'
                ? 'bg-[#151E30] border-[#24324A] text-[#64748B] cursor-not-allowed'
                : 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E] cursor-default'
            }
          `}
        >
          {phase === 'idle' && <><Play className="w-3.5 h-3.5" />Run Sentinel</>}
          {phase === 'analyzing' && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</>}
          {phase === 'done' && <><CheckCircle2 className="w-3.5 h-3.5" />Complete</>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {phase === 'idle' && <IdleState />}
        {phase === 'analyzing' && <AnalyzingState />}

        {phase === 'done' && (
          <div className="flex h-full gap-3 p-4 overflow-hidden">
            {/* Left — Diff */}
            <div className="w-[44%] min-w-0 shrink-0">
              <DiffPanel diffText={diffText} />
            </div>

            {/* Right — Impact + PR comment */}
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
