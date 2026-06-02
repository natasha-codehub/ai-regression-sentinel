import { useState } from 'react'
import { useTraceData } from '../hooks/useTraceData'
import type {
  TraceIntent,
  TraceObservation,
  TraceReconciliation,
  TraceClassification,
  TraceGeneration,
  TraceEval,
  TraceDimension,
  TraceValidation,
  TraceCommit,
  SteeringSignal,
  AlternativeConsidered,
} from '../types'

// ── Tiny primitives ────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function DemoChip() {
  return (
    <span className="inline-flex items-center text-[9px] font-mono text-slate-600 bg-slate-800/80 border border-slate-700/60 rounded px-1.5 py-0.5 ml-1.5 leading-none">
      demo
    </span>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
      {children}
    </pre>
  )
}

function CollapsibleJSON({
  label,
  data,
  badge,
  defaultOpen = false,
}: {
  label: string
  data: unknown
  badge?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-800 rounded overflow-hidden mb-2 last:mb-0">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {badge && (
            <span className="shrink-0 text-[9px] font-mono text-slate-600 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
              {badge}
            </span>
          )}
          <span className="text-xs font-mono text-slate-400 truncate">{label}</span>
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="border-t border-slate-800 bg-slate-900/50">
          <pre className="px-3 py-3 text-xs font-mono text-slate-400 overflow-x-auto leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function GateChip({ gate }: { gate: string }) {
  const styles: Record<string, string> = {
    PASS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    WARN: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    REVIEW: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    FAIL: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  }
  return (
    <span className={`text-xs font-mono px-2.5 py-1 rounded border ${styles[gate] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {gate}
    </span>
  )
}

function LevelChip({ level }: { level: string }) {
  return (
    <span className="text-xs font-mono px-2.5 py-1 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30">
      {level}
    </span>
  )
}

function DecisionChip({ decision }: { decision: string }) {
  const styles: Record<string, string> = {
    agree: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    spec_outdated: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    behavior_regressed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    no_observation: 'bg-slate-500/10 text-slate-400 border-slate-600',
    human_review: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  }
  const label = decision.replace(/_/g, ' ')
  return (
    <span className={`text-xs font-mono px-2.5 py-1 rounded border ${styles[decision] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {label}
    </span>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Confidence</span>
        <span className="text-xs font-mono text-slate-300 tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const DIM_LABELS: Record<string, string> = {
  syntactic_validity: 'Syntax',
  behavior_fidelity: 'Fidelity',
  coverage_delta: 'Coverage',
  assertion_quality: 'Assertions',
  determinism: 'Determinism',
}

function DimBar({ dim }: { dim: TraceDimension }) {
  const [hover, setHover] = useState(false)
  const color =
    dim.score >= 85
      ? 'bg-emerald-500'
      : dim.score >= 70
        ? 'bg-amber-500'
        : dim.score >= 50
          ? 'bg-orange-500'
          : 'bg-rose-500'
  const label = DIM_LABELS[dim.name] ?? dim.name

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-slate-500 w-20 shrink-0">{label}</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${dim.score}%` }} />
        </div>
        <span className="text-xs font-mono text-slate-300 tabular-nums w-7 text-right shrink-0">
          {dim.score}
        </span>
        <span className="text-[10px] text-slate-600 w-10 text-right shrink-0">
          {Math.round(dim.weight * 100)}%
        </span>
      </div>
      {hover && dim.notes && (
        <div className="absolute left-24 right-0 bottom-6 z-20 bg-slate-800 border border-slate-700 rounded p-2.5 text-[11px] text-slate-400 leading-relaxed shadow-xl">
          {dim.notes}
        </div>
      )}
    </div>
  )
}

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}

// ── Stage expanded detail sections ────────────────────────────────────────────

function SourceIntentsDetail({ intents }: { intents: TraceIntent[] }) {
  const [showJson, setShowJson] = useState(false)
  const intent = intents[0]
  if (!intent) return null
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Original XLSX row</p>
        <div className="bg-slate-900/80 border border-slate-800 rounded px-3 py-2.5">
          <p className="text-xs font-mono text-slate-400 leading-relaxed">{intent.original_text}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Kv label="Feature area" value={intent.feature_area} />
        <Kv label="Intent ID" value={intent.id} />
      </div>

      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Action</p>
        <p className="text-xs text-slate-400 leading-relaxed">{intent.action_description}</p>
      </div>

      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Expected behavior</p>
        <p className="text-xs text-slate-400 leading-relaxed">{intent.expected_behavior}</p>
      </div>

      {intent.preconditions.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Preconditions</p>
          <ul className="space-y-0.5">
            {intent.preconditions.map((p, i) => (
              <li key={i} className="text-xs text-slate-500 flex gap-2">
                <span className="text-slate-700 shrink-0">·</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
        onClick={() => setShowJson((v) => !v)}
      >
        {showJson ? '▴ Hide' : '▾ Show'} full parsed JSON
      </button>
      {showJson && (
        <CodeBlock>{JSON.stringify(intent, null, 2)}</CodeBlock>
      )}
    </div>
  )
}

function SourceObservationsDetail({ observations }: { observations: TraceObservation[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-300">{observations.length}</span>
        <span className="text-xs text-slate-500">API interactions captured in this session</span>
      </div>
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
          Sample payloads
        </p>
        {observations.slice(0, 2).map((obs) => (
          <CollapsibleJSON
            key={obs.id}
            label={`${obs.endpoint}`}
            badge={obs.id}
            data={{ request: obs.request, response: obs.response, context: obs.context }}
          />
        ))}
        {observations.length > 2 && (
          <p className="text-[10px] font-mono text-slate-600 mt-1">
            + {observations.length - 2} more not shown
          </p>
        )}
      </div>
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">
          Summaries
        </p>
        <div className="space-y-1">
          {observations.map((obs) => (
            <div key={obs.id} className="flex gap-2 text-xs">
              <span className="font-mono text-slate-600 shrink-0">{obs.id}</span>
              <span className="text-slate-500">{obs.summary}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReconciliationDetail({ rec }: { rec: TraceReconciliation }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <DecisionChip decision={rec.decision} />
        <span className="text-xs font-mono text-slate-600">{rec.id}</span>
      </div>
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Reasoning</p>
        <p className="text-xs text-slate-400 leading-relaxed">{rec.reasoning}</p>
      </div>
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">
          Final expected behavior
        </p>
        <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-3">
          {rec.final_expected_behavior}
        </p>
      </div>
      <ConfidenceBar value={rec.confidence} />
    </div>
  )
}

function ClassificationDetail({
  cls,
  showSynthetic,
}: {
  cls: TraceClassification
  showSynthetic: boolean
}) {
  const [altOpen, setAltOpen] = useState(false)
  const hasSynthAlt = cls.alternatives_considered.some((a) => a._demo_synthetic)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <LevelChip level={cls.level} />
        <span className="text-xs text-slate-500">assigned test level</span>
      </div>
      <div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Reasoning</p>
        <p className="text-xs text-slate-400 leading-relaxed">{cls.reasoning}</p>
      </div>
      {cls.alternatives_considered.length > 0 && (
        <div>
          <button
            className="flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
            onClick={() => setAltOpen((v) => !v)}
          >
            <Chevron open={altOpen} />
            <span>
              Alternatives considered ({cls.alternatives_considered.length})
            </span>
            {hasSynthAlt && showSynthetic && <DemoChip />}
          </button>
          {altOpen && (
            <div className="mt-2 space-y-2">
              {cls.alternatives_considered.map((alt: AlternativeConsidered, i) => (
                <div
                  key={i}
                  className="border border-slate-800 rounded px-3 py-2.5 flex items-start gap-3"
                >
                  <span className="text-xs font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                    {alt.level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 leading-relaxed">{alt.reason_rejected}</p>
                    {alt._demo_synthetic && showSynthetic && (
                      <DemoChip />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GenerationDetail({
  gen,
  showSynthetic,
}: {
  gen: TraceGeneration
  showSynthetic: boolean
}) {
  const [altsOpen, setAltsOpen] = useState(false)
  const isSynthField = (f: string) => gen._synthetic_fields?.includes(f) ?? false

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Kv label="Model" value={gen.model} />
        <Kv
          label={
            <>
              Tokens in
              {isSynthField('tokens_in') && showSynthetic && <DemoChip />}
            </>
          }
          value={gen.tokens_in.toLocaleString()}
        />
        <Kv
          label={
            <>
              Tokens out
              {isSynthField('tokens_out') && showSynthetic && <DemoChip />}
            </>
          }
          value={gen.tokens_out.toLocaleString()}
        />
        <Kv
          label={
            <>
              Latency
              {isSynthField('latency_ms') && showSynthetic && <DemoChip />}
            </>
          }
          value={`${(gen.latency_ms / 1000).toFixed(1)}s`}
        />
        <Kv
          label={
            <>
              Attempt
              {isSynthField('attempt_number') && showSynthetic && <DemoChip />}
            </>
          }
          value={`#${gen.attempt_number}`}
        />
        <Kv label="Template" value={gen.prompt_template.split('/').pop() ?? gen.prompt_template} />
      </div>

      {gen.alternatives_rejected.length > 0 ? (
        <div>
          <button
            className="flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
            onClick={() => setAltsOpen((v) => !v)}
          >
            <Chevron open={altsOpen} />
            <span>
              Show {gen.alternatives_rejected.length} alternative
              {gen.alternatives_rejected.length !== 1 ? 's' : ''} rejected
            </span>
            {showSynthetic && <DemoChip />}
          </button>
          {altsOpen && (
            <div className="mt-2 space-y-2">
              {gen.alternatives_rejected.map((alt, i) => (
                <div key={i} className="border border-slate-800 rounded px-3 py-2.5 space-y-1.5">
                  <p className="text-xs font-mono text-slate-400">{alt.draft_summary}</p>
                  <p className="text-xs text-slate-600">
                    <span className="text-slate-500">Rejected: </span>
                    {alt.reason_rejected}
                  </p>
                  {alt._demo_synthetic && showSynthetic && <DemoChip />}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs font-mono text-slate-600">No alternative drafts — accepted on first attempt.</p>
      )}
    </div>
  )
}

function EvalDetail({ ev }: { ev: TraceEval }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {ev.dimensions.map((dim) => (
          <DimBar key={dim.name} dim={dim} />
        ))}
      </div>
      <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
            Composite
          </span>
          <span className="text-sm font-mono font-semibold text-slate-200">
            {ev.composite.toFixed(1)}
          </span>
        </div>
        <GateChip gate={ev.gate_decision} />
      </div>
      <p className="text-[10px] font-mono text-slate-600">
        Hover each bar to read the evaluator's notes for that dimension.
      </p>
    </div>
  )
}

function ValidationDetail({
  val,
  showSynthetic,
}: {
  val: TraceValidation
  showSynthetic: boolean
}) {
  return (
    <div className="space-y-3">
      {val._demo_synthetic && showSynthetic && (
        <div className="flex items-center gap-2">
          <DemoChip />
          <span className="text-[10px] text-slate-600">Validation result is synthetic demo data</span>
        </div>
      )}
      <div className="space-y-2.5">
        <div className="flex items-start gap-3">
          <CheckIcon ok={val.ran_against_current} />
          <div>
            <p className="text-xs text-slate-300 font-medium">Ran against current</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Test executed against the current codebase without errors
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckIcon ok={val.mutation_caught} />
          <div>
            <p className="text-xs text-slate-300 font-medium">Mutation caught</p>
            {val.mutation_notes ? (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{val.mutation_notes}</p>
            ) : (
              <p className="text-[11px] text-slate-600 mt-0.5">
                Test correctly detected an injected mutation
              </p>
            )}
          </div>
        </div>
      </div>
      {val.flake_signals.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1">
            Flake signals
          </p>
          {val.flake_signals.map((s, i) => (
            <p key={i} className="text-xs text-amber-500/70">{s}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function CommitDetail({
  meta,
  showSynthetic,
}: {
  meta: TraceCommit
  showSynthetic: boolean
}) {
  const signingStyle =
    meta.signing_status === 'signed'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'

  return (
    <div className="space-y-3">
      {meta._demo_synthetic && showSynthetic && (
        <div className="flex items-center gap-2">
          <DemoChip />
          <span className="text-[10px] text-slate-600">Commit metadata is synthetic demo data</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Kv label="PR" value={`#${meta.pr_number}`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
            Signing
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded border self-start ${signingStyle}`}
          >
            {meta.signing_status}
          </span>
        </div>
        <Kv label="Branch" value={meta.branch} />
        <Kv label="Timestamp" value={formatTs(meta.timestamp)} />
      </div>
    </div>
  )
}

function SteeringDetail({
  signals,
  showSynthetic,
}: {
  signals: SteeringSignal[]
  showSynthetic: boolean
}) {
  if (signals.length === 0) {
    return (
      <p className="text-xs font-mono text-slate-600">No steering signals applied to this test.</p>
    )
  }
  return (
    <div className="space-y-2">
      {signals.map((sig) => (
        <div
          key={sig.rule_id}
          className="border border-slate-800 rounded px-3 py-2.5 space-y-1.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono text-slate-600 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                {sig.rule_id}
              </span>
              {sig._demo_synthetic && showSynthetic && <DemoChip />}
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{sig.rule_text}</p>
          <div className="flex gap-4 text-[10px] font-mono text-slate-600">
            <span>by {sig.set_by}</span>
            <span>{formatTs(sig.set_on)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Kv with React.ReactNode label support ─────────────────────────────────────

function Kv({ label, value, mono = true }: { label: React.ReactNode; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center text-[10px] font-mono text-slate-600 uppercase tracking-wider">
        {label}
      </div>
      <span className={`text-xs ${mono ? 'font-mono' : ''} text-slate-300`}>{value}</span>
    </div>
  )
}

// ── Stage card ────────────────────────────────────────────────────────────────

interface StageCardProps {
  step: string
  dotColor: string
  label: string
  summary: React.ReactNode
  isLast?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}

function StageCard({
  step,
  dotColor,
  label,
  summary,
  isLast = false,
  defaultOpen = false,
  children,
}: StageCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="flex gap-0">
      {/* Timeline column */}
      <div className="flex flex-col items-center w-10 shrink-0">
        <div className={`w-4 h-4 rounded-full border-2 mt-3.5 shrink-0 ${dotColor}`} />
        {!isLast && <div className="flex-1 w-px bg-slate-800 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 min-w-0 mb-3 ml-3`}>
        <button
          className="w-full flex items-start justify-between gap-3 py-2 text-left group"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono text-slate-700 tabular-nums">{step}</span>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                {label}
              </h3>
            </div>
            <div className="text-xs text-slate-500 leading-snug">{summary}</div>
          </div>
          <div className="shrink-0 mt-1">
            <Chevron open={open} />
          </div>
        </button>

        {open && (
          <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4 mt-1">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Test picker (no test selected) ───────────────────────────────────────────

const KNOWN_TRACES = ['GEN-001', 'GEN-003', 'GEN-009', 'GEN-010', 'GEN-013']

const TRACE_LABELS: Record<string, string> = {
  'GEN-001': 'OnboardingProcessTest',
  'GEN-003': 'SfCaseCreationTest',
  'GEN-009': 'AdminOtpResendTest',
  'GEN-010': 'PaymentMethodDeletionTest',
  'GEN-013': 'MoqEnforcementTest',
}

function TestPicker({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono text-blue-500 tracking-widest uppercase">
          Chapter C
        </span>
        <h1 className="text-xl font-semibold text-slate-200">Trace Explorer</h1>
        <p className="text-sm text-slate-500">
          Every AI decision, visible and steerable
        </p>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-3 text-center">
          Select a trace
        </p>
        <div className="space-y-1.5">
          {KNOWN_TRACES.map((id) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-800 rounded-lg hover:border-slate-600 hover:bg-slate-800/30 transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-mono text-slate-300 group-hover:text-white transition-colors">
                  {TRACE_LABELS[id] ?? id}
                </p>
                <p className="text-xs font-mono text-slate-600">{id}</p>
              </div>
              <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs font-mono">
                open →
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-slate-700 text-center mt-4">
          or click "Trace →" on any row in the Bootstrap view
        </p>
      </div>
    </div>
  )
}

// ── Synthetic toggle ──────────────────────────────────────────────────────────

function SyntheticToggle({
  on,
  onChange,
}: {
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      className="flex items-center gap-2 group"
      onClick={() => onChange(!on)}
      title="Some fields were synthesized for this demo — toggle to show/hide indicators"
    >
      <div
        className={`relative w-7 h-4 rounded-full border transition-colors ${
          on ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
            on ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
        Show synthetic demo data
      </span>
    </button>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  testId: string | null
  onSelectTest: (id: string) => void
}

export default function TracePanel({ testId, onSelectTest }: Props) {
  const [showSynthetic, setShowSynthetic] = useState(true)
  const { trace, loading } = useTraceData(testId)

  if (!testId) return <TestPicker onSelect={onSelectTest} />

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header bar ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onSelectTest('')}
            className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors shrink-0"
          >
            ← traces
          </button>
          <span className="text-slate-800">·</span>
          {trace ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-slate-500">{trace.test_id}</span>
              <span className="text-slate-700">·</span>
              <span className="text-sm text-slate-300 truncate">
                {TRACE_LABELS[trace.test_id] ?? trace.test_id}
              </span>
            </div>
          ) : loading ? (
            <span className="text-xs font-mono text-slate-600 animate-pulse">loading…</span>
          ) : (
            <span className="text-xs font-mono text-rose-500">trace not found</span>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {showSynthetic && (
            <span className="text-[9px] font-mono text-slate-700 italic hidden sm:block">
              Some fields are synthesized for demo purposes
            </span>
          )}
          <SyntheticToggle on={showSynthetic} onChange={setShowSynthetic} />
        </div>
      </div>

      {/* ── Timeline ── */}
      {loading && (
        <div className="flex items-center justify-center flex-1">
          <span className="text-xs font-mono text-slate-600 animate-pulse">Loading trace…</span>
        </div>
      )}

      {!loading && !trace && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-slate-500">No trace found for {testId}</p>
        </div>
      )}

      {!loading && trace && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">
            {/* ── Test summary chip row ── */}
            <div className="flex items-center gap-2 flex-wrap mb-6 pb-4 border-b border-slate-800/60">
              <LevelChip level={trace.classification.level} />
              <GateChip gate={trace.eval.gate_decision} />
              <span className="text-xs font-mono text-slate-500">
                {trace.eval.composite.toFixed(1)} composite
              </span>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-xs font-mono text-slate-500">
                {trace.source_observations.length} observations
              </span>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-xs font-mono text-slate-500">
                {trace.steering_signals_applied.length} steering rules
              </span>
            </div>

            {/* ── Stages ── */}
            <div>
              <StageCard
                step="01"
                dotColor="border-sky-500 bg-sky-500/20"
                label="Source Intents"
                summary={`${trace.source_intents[0]?.id ?? '—'} · ${trace.source_intents[0]?.feature_area ?? '—'} · ${trace.source_intents.length} intent${trace.source_intents.length !== 1 ? 's' : ''}`}
              >
                <SourceIntentsDetail intents={trace.source_intents} />
              </StageCard>

              <StageCard
                step="02"
                dotColor="border-cyan-500 bg-cyan-500/20"
                label="Source Observations"
                summary={`${trace.source_observations.length} API interactions captured`}
              >
                <SourceObservationsDetail observations={trace.source_observations} />
              </StageCard>

              <StageCard
                step="03"
                dotColor="border-violet-500 bg-violet-500/20"
                label="Reconciliation"
                summary={
                  <span className="flex items-center gap-2">
                    <DecisionChip decision={trace.reconciliation.decision} />
                    <span>{Math.round(trace.reconciliation.confidence * 100)}% confidence</span>
                  </span>
                }
              >
                <ReconciliationDetail rec={trace.reconciliation} />
              </StageCard>

              <StageCard
                step="04"
                dotColor="border-indigo-500 bg-indigo-500/20"
                label="Classification"
                summary={`→ ${trace.classification.level} test · ${trace.classification.alternatives_considered.length} alternative${trace.classification.alternatives_considered.length !== 1 ? 's' : ''} considered`}
              >
                <ClassificationDetail cls={trace.classification} showSynthetic={showSynthetic} />
              </StageCard>

              <StageCard
                step="05"
                dotColor="border-purple-500 bg-purple-500/20"
                label="Generation"
                summary={`${trace.generation.model} · ${(trace.generation.tokens_in + trace.generation.tokens_out).toLocaleString()} tokens · ${(trace.generation.latency_ms / 1000).toFixed(1)}s`}
              >
                <GenerationDetail gen={trace.generation} showSynthetic={showSynthetic} />
              </StageCard>

              <StageCard
                step="06"
                dotColor="border-amber-500 bg-amber-500/20"
                label="Eval"
                summary={
                  <span className="flex items-center gap-2">
                    <GateChip gate={trace.eval.gate_decision} />
                    <span>composite {trace.eval.composite.toFixed(1)}</span>
                  </span>
                }
              >
                <EvalDetail ev={trace.eval} />
              </StageCard>

              <StageCard
                step="07"
                dotColor={
                  trace.validation.ran_against_current && trace.validation.mutation_caught
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-rose-500 bg-rose-500/20'
                }
                label="Validation"
                summary={`${trace.validation.ran_against_current ? '✓' : '✗'} ran against current · ${trace.validation.mutation_caught ? '✓' : '✗'} mutation caught`}
              >
                <ValidationDetail val={trace.validation} showSynthetic={showSynthetic} />
              </StageCard>

              <StageCard
                step="08"
                dotColor="border-slate-500 bg-slate-500/20"
                label="Commit"
                summary={`PR #${trace.commit_metadata.pr_number} · ${trace.commit_metadata.branch}`}
              >
                <CommitDetail meta={trace.commit_metadata} showSynthetic={showSynthetic} />
              </StageCard>

              <StageCard
                step="09"
                dotColor="border-orange-500 bg-orange-500/20"
                label="Steering Signals"
                summary={`${trace.steering_signals_applied.length} rule${trace.steering_signals_applied.length !== 1 ? 's' : ''} applied`}
                isLast
              >
                <SteeringDetail signals={trace.steering_signals_applied} showSynthetic={showSynthetic} />
              </StageCard>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
