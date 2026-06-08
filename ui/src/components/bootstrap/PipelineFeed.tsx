import { useState, useEffect } from 'react'
import type { Intent, Reconciliation, Generation, RecDecision } from '../../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const DECISION_STYLES: Record<RecDecision, { label: string; cls: string }> = {
  agree: {
    label: 'agree',
    cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50',
  },
  behavior_regressed: {
    label: 'regression',
    cls: 'bg-rose-500/20 text-rose-300 border border-rose-500/50',
  },
  no_observation: {
    label: 'no obs',
    cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/50',
  },
}

const SOURCE_TO_ENDPOINT: Record<string, string> = {
  'Save.php': 'POST /businessaccount/index/save',
  'PaymentMethods.php': 'GET /stripe/customer/paymentmethods',
  'Resend.php': 'POST /admin/otp/resend',
}

const ASSERTION_COUNTS: Record<string, number> = {
  'GEN-001': 10,
  'GEN-003': 6,
  'GEN-009': 9,
  'GEN-010': 7,
  'GEN-013': 5,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getEndpoint(gen: Generation): string {
  const src = gen.source_files[0]
  if (!src) return 'REST checkout API'
  const file = src.split('/').pop() ?? ''
  return SOURCE_TO_ENDPOINT[file] ?? file
}

function getTestFilename(gen: Generation): string {
  return (gen.file.split('/').pop() ?? gen.file).replace('.php', '')
}

// ── Stagger wrapper ───────────────────────────────────────────────────────────

interface AnimatedItemProps {
  index: number
  visible: boolean
  children: React.ReactNode
}

function AnimatedItem({ index, visible, children }: AnimatedItemProps) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.3s ease ${index * 120}ms, transform 0.3s ease ${index * 120}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Column header ─────────────────────────────────────────────────────────────

const STEP_ACCENT: Record<string, string> = {
  '01': 'text-blue-400',
  '02': 'text-purple-400',
  '03': 'text-emerald-400',
}

function ColumnHeader({
  step,
  title,
  subtitle,
  count,
}: {
  step: string
  title: string
  subtitle: string
  count: number
}) {
  const accentColor = STEP_ACCENT[step] ?? 'text-slate-400'
  return (
    <div className="mb-3 pb-3 border-b border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${accentColor}`}>{step}</span>
          <span className="text-sm font-semibold text-slate-200">
            {title}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 rounded px-1.5 py-0.5">
          {count}
        </span>
      </div>
      <p className="text-xs text-slate-400 pl-6">{subtitle}</p>
    </div>
  )
}

// ── Arrow divider ─────────────────────────────────────────────────────────────

function FlowArrow() {
  return (
    <div className="flex items-center justify-center w-6 shrink-0 pt-8">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ── Ingestion cards ───────────────────────────────────────────────────────────

function IngestionCard({ intent, index, visible }: { intent: Intent; index: number; visible: boolean }) {
  return (
    <AnimatedItem index={index} visible={visible}>
      <div className="border border-slate-700 rounded-md p-2.5 space-y-1 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 shrink-0">
            {cap(intent.feature_area)}
          </span>
          <span className="text-xs font-mono text-slate-500 truncate">{intent.id}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {intent.action_description}
        </p>
      </div>
    </AnimatedItem>
  )
}

// ── Reconciliation cards ──────────────────────────────────────────────────────

function ReconciliationCard({ rec, index, visible }: { rec: Reconciliation; index: number; visible: boolean }) {
  const style = DECISION_STYLES[rec.decision]
  return (
    <AnimatedItem index={index} visible={visible}>
      <div className="border border-slate-700 rounded-md p-2.5 space-y-1.5 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${style.cls}`}>
            {style.label}
          </span>
          <span className="text-xs font-mono text-slate-400">{Math.round(rec.confidence * 100)}% conf</span>
          <span className="text-xs font-mono text-slate-500 ml-auto">{rec.intent_id}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{rec.reasoning}</p>
      </div>
    </AnimatedItem>
  )
}

// ── Generation cards ──────────────────────────────────────────────────────────

function GenerationCard({ gen, index, visible }: { gen: Generation; index: number; visible: boolean }) {
  return (
    <AnimatedItem index={index} visible={visible}>
      <div className="border border-slate-700 rounded-md p-2.5 space-y-1 hover:border-slate-600 transition-colors">
        <p className="text-sm font-mono text-slate-200 truncate">{getTestFilename(gen)}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-400">
            {ASSERTION_COUNTS[gen.id] ?? '—'} assertions
          </span>
          <span className="text-xs font-mono text-slate-600">·</span>
          <span className="text-xs font-mono text-slate-500 truncate">{getEndpoint(gen)}</span>
        </div>
      </div>
    </AnimatedItem>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PipelineFeedProps {
  intents: Intent[]
  reconciliations: Reconciliation[]
  generations: Generation[]
}

export default function PipelineFeed({ intents, reconciliations, generations }: PipelineFeedProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const genIntentIds = new Set(generations.map((g) => g.intent_id))
  const linkedRecs = reconciliations.filter((r) => genIntentIds.has(r.intent_id))

  return (
    <div className="border border-slate-700 border-t-2 border-t-blue-500 rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-200">
            Pipeline Run
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            XLSX intents → behavior reconciliation → test generation
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-500/70 border border-emerald-500/20 bg-emerald-500/5 rounded px-2 py-0.5">
          completed
        </span>
      </div>

      {/* Three-column pipeline */}
      <div className="p-5 flex gap-0 items-stretch" style={{ minHeight: 0 }}>
        {/* Column 1 — Ingestion */}
        <div className="flex-1 min-w-0 flex flex-col border-l-2 border-l-blue-500/60 pl-3" style={{ height: '300px' }}>
          <ColumnHeader
            step="01"
            title="Ingest"
            subtitle="XLSX rows → test intents"
            count={intents.length}
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {intents.map((intent, i) => (
              <IngestionCard key={intent.id} intent={intent} index={i} visible={visible} />
            ))}
          </div>
        </div>

        <FlowArrow />

        {/* Column 2 — Reconciliation */}
        <div className="flex-1 min-w-0 flex flex-col border-l-2 border-l-purple-500/60 pl-3" style={{ height: '300px' }}>
          <ColumnHeader
            step="02"
            title="Reconcile"
            subtitle="Intent vs. observed behavior"
            count={linkedRecs.length}
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {linkedRecs.map((rec, i) => (
              <ReconciliationCard key={rec.id} rec={rec} index={i} visible={visible} />
            ))}
            {linkedRecs.length === 0 && (
              <p className="text-xs text-slate-600 font-mono">No reconciliation data</p>
            )}
          </div>
        </div>

        <FlowArrow />

        {/* Column 3 — Generation */}
        <div className="flex-1 min-w-0 flex flex-col border-l-2 border-l-emerald-500/60 pl-3" style={{ height: '300px' }}>
          <ColumnHeader
            step="03"
            title="Generate"
            subtitle="PHP test files written"
            count={generations.length}
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {generations.map((gen, i) => (
              <GenerationCard key={gen.id} gen={gen} index={i} visible={visible} />
            ))}
            {generations.length === 0 && (
              <p className="text-xs text-slate-600 font-mono">No tests generated</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
