import React, { useState, useEffect } from 'react'
import type { Intent, Reconciliation, Generation, RecDecision } from '../../types'
import { CheckCircle2, Upload, GitCompare, Code2, ShieldCheck } from 'lucide-react'

// ── Decision styles ───────────────────────────────────────────────────────────

const DECISION_STYLES: Record<RecDecision, { label: string; badge: string }> = {
  agree: {
    label: 'Agree',
    badge: 'text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20',
  },
  behavior_regressed: {
    label: 'Regression',
    badge: 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20',
  },
  no_observation: {
    label: 'No data',
    badge: 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20',
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

// ── Confidence bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const barColor =
    pct >= 85 ? 'bg-[#22C55E]' : pct >= 65 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
  const textColor =
    pct >= 85 ? 'text-[#22C55E]' : pct >= 65 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#24324A] rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${textColor} tabular-nums`}>{pct}%</span>
    </div>
  )
}

// ── Pipeline stages bar ───────────────────────────────────────────────────────

type StageConfig = {
  step: string
  label: string
  subtitle: string
  icon: React.ElementType
  numBg: string
  numBorder: string
  numText: string
  iconColor: string
  countColor: string
}

const STAGE_CONFIGS: StageConfig[] = [
  {
    step: '01',
    label: 'Ingest',
    subtitle: 'XLSX → test intents',
    icon: Upload,
    numBg: 'bg-[#3B82F6]/10',
    numBorder: 'border-[#3B82F6]/20',
    numText: 'text-[#60A5FA]',
    iconColor: 'text-[#60A5FA]',
    countColor: 'text-[#60A5FA]',
  },
  {
    step: '02',
    label: 'Reconcile',
    subtitle: 'Intent vs. behavior',
    icon: GitCompare,
    numBg: 'bg-violet-500/10',
    numBorder: 'border-violet-500/20',
    numText: 'text-violet-400',
    iconColor: 'text-violet-400',
    countColor: 'text-violet-400',
  },
  {
    step: '03',
    label: 'Generate',
    subtitle: 'PHP test files',
    icon: Code2,
    numBg: 'bg-emerald-500/10',
    numBorder: 'border-emerald-500/20',
    numText: 'text-emerald-400',
    iconColor: 'text-emerald-400',
    countColor: 'text-emerald-400',
  },
  {
    step: '04',
    label: 'Evaluate',
    subtitle: 'Gate-scored',
    icon: ShieldCheck,
    numBg: 'bg-amber-500/10',
    numBorder: 'border-amber-500/20',
    numText: 'text-amber-400',
    iconColor: 'text-amber-400',
    countColor: 'text-amber-400',
  },
]

function StageCard({ config, count }: { config: StageConfig; count: number }) {
  const Icon = config.icon
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-[#151E30] border border-[#24324A] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${config.numBg} border ${config.numBorder} text-[10px] font-mono font-bold ${config.numText}`}
          >
            {config.step}
          </span>
          <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        </div>
        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#F8FAFC]">{config.label}</p>
        <p className="text-xs text-[#64748B] mt-0.5">{config.subtitle}</p>
      </div>
      <p className={`text-2xl font-bold tabular-nums leading-none ${config.countColor}`}>{count}</p>
    </div>
  )
}

function StageConnector() {
  return (
    <div className="flex items-center justify-center w-8 shrink-0 pb-4">
      <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
        <path
          d="M1 5h15M12 1.5l4 3.5-4 3.5"
          stroke="#334155"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ── Stagger animation ─────────────────────────────────────────────────────────

function AnimatedItem({
  index,
  visible,
  children,
}: {
  index: number
  visible: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.3s ease ${index * 100}ms, transform 0.3s ease ${index * 100}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColumnHeader({
  step,
  title,
  subtitle,
  count,
  accentColor,
}: {
  step: string
  title: string
  subtitle: string
  count: number
  accentColor: string
}) {
  return (
    <div className="mb-3 pb-3 border-b border-[#24324A]">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${accentColor}`}>{step}</span>
          <span className="text-sm font-semibold text-[#F8FAFC]">{title}</span>
        </div>
        <span className="text-xs text-[#64748B] bg-[#151E30] border border-[#24324A] rounded-md px-2 py-0.5 tabular-nums">
          {count}
        </span>
      </div>
      <p className="text-xs text-[#64748B] pl-7">{subtitle}</p>
    </div>
  )
}

// ── Data cards ────────────────────────────────────────────────────────────────

function IngestionCard({
  intent,
  index,
  visible,
}: {
  intent: Intent
  index: number
  visible: boolean
}) {
  return (
    <AnimatedItem index={index} visible={visible}>
      <div className="rounded-lg bg-[#151E30] border border-[#24324A] p-3 hover:border-[#3B82F6]/25 transition-colors cursor-default">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-[#60A5FA] bg-blue-500/10 border border-blue-500/15 rounded-md px-2 py-0.5 truncate">
            {cap(intent.feature_area)}
          </span>
          <span className="text-[11px] font-mono text-[#64748B] shrink-0">{intent.id}</span>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
          {intent.action_description}
        </p>
      </div>
    </AnimatedItem>
  )
}

function ReconciliationCard({
  rec,
  index,
  visible,
}: {
  rec: Reconciliation
  index: number
  visible: boolean
}) {
  const style = DECISION_STYLES[rec.decision]
  return (
    <AnimatedItem index={index} visible={visible}>
      <div className="rounded-lg bg-[#151E30] border border-[#24324A] p-3 hover:border-violet-500/25 transition-colors cursor-default">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`text-xs font-medium ${style.badge} rounded-md px-2 py-0.5`}>
            {style.label}
          </span>
          <span className="text-[11px] font-mono text-[#64748B]">{rec.intent_id}</span>
        </div>
        <ConfidenceBar value={rec.confidence} />
        <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2 mt-2">{rec.reasoning}</p>
      </div>
    </AnimatedItem>
  )
}

function GenerationCard({
  gen,
  index,
  visible,
}: {
  gen: Generation
  index: number
  visible: boolean
}) {
  return (
    <AnimatedItem index={index} visible={visible}>
      <div className="rounded-lg bg-[#151E30] border border-[#24324A] p-3 hover:border-emerald-500/25 transition-colors cursor-default">
        <p className="text-sm font-medium text-[#F8FAFC] truncate">{getTestFilename(gen)}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/15 rounded-md px-2 py-0.5">
            {ASSERTION_COUNTS[gen.id] ?? '—'} assertions
          </span>
          <span className="text-xs text-[#64748B] truncate">{getEndpoint(gen)}</span>
        </div>
      </div>
    </AnimatedItem>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface PipelineFeedProps {
  intents: Intent[]
  reconciliations: Reconciliation[]
  generations: Generation[]
  evalCount?: number
}

export default function PipelineFeed({
  intents,
  reconciliations,
  generations,
  evalCount,
}: PipelineFeedProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const genIntentIds = new Set(generations.map((g) => g.intent_id))
  const linkedRecs = reconciliations.filter((r) => genIntentIds.has(r.intent_id))
  const stageCounts = [
    intents.length,
    linkedRecs.length,
    generations.length,
    evalCount ?? generations.length,
  ]

  return (
    <div className="rounded-xl bg-[#121827] border border-[#24324A] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#24324A] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#F8FAFC]">Pipeline run</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            XLSX intents → behavior reconciliation → test generation → evaluation
          </p>
        </div>
        <span className="text-xs font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-3 py-1.5">
          Completed
        </span>
      </div>

      {/* Stage status bar */}
      <div className="px-6 py-5 border-b border-[#24324A] flex items-stretch gap-2">
        {STAGE_CONFIGS.map((config, i) => (
          <React.Fragment key={config.step}>
            <StageCard config={config} count={stageCounts[i]} />
            {i < STAGE_CONFIGS.length - 1 && <StageConnector />}
          </React.Fragment>
        ))}
      </div>

      {/* Data columns */}
      <div className="px-6 py-5 flex gap-0 items-stretch">
        {/* Column 1 — Ingest */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ height: '280px' }}>
          <ColumnHeader
            step="01"
            title="Ingested"
            subtitle="XLSX rows → test intents"
            count={intents.length}
            accentColor="text-[#60A5FA]"
          />
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
            {intents.map((intent, i) => (
              <IngestionCard key={intent.id} intent={intent} index={i} visible={visible} />
            ))}
          </div>
        </div>

        <div className="w-px bg-[#24324A] self-stretch mx-4 shrink-0" />

        {/* Column 2 — Reconcile */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ height: '280px' }}>
          <ColumnHeader
            step="02"
            title="Reconciled"
            subtitle="Intent vs. observed behavior"
            count={linkedRecs.length}
            accentColor="text-violet-400"
          />
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
            {linkedRecs.map((rec, i) => (
              <ReconciliationCard key={rec.id} rec={rec} index={i} visible={visible} />
            ))}
            {linkedRecs.length === 0 && (
              <p className="text-xs text-[#64748B]">No reconciliation data</p>
            )}
          </div>
        </div>

        <div className="w-px bg-[#24324A] self-stretch mx-4 shrink-0" />

        {/* Column 3 — Generate */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ height: '280px' }}>
          <ColumnHeader
            step="03"
            title="Generated"
            subtitle="PHP test files written"
            count={generations.length}
            accentColor="text-emerald-400"
          />
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
            {generations.map((gen, i) => (
              <GenerationCard key={gen.id} gen={gen} index={i} visible={visible} />
            ))}
            {generations.length === 0 && (
              <p className="text-xs text-[#64748B]">No tests generated</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
