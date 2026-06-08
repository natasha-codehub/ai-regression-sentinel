import { Server, Monitor, Settings2, Database, CheckCircle2 } from 'lucide-react'

interface Signal {
  icon: React.ElementType
  name: string
  description: string
  captures: string[]
  active: boolean
}

const SIGNALS: Signal[] = [
  {
    icon: Server,
    name: 'REST API traces',
    description: 'HTTP request/response pairs captured from live or recorded sessions',
    captures: ['Endpoint', 'Status code', 'Request body', 'Response shape', 'User context'],
    active: true,
  },
  {
    icon: Monitor,
    name: 'Browser / UI',
    description: 'DOM snapshots, user interactions, and screenshots from Playwright recordings',
    captures: ['Element visibility', 'Click targets', 'Page transitions', 'Visual diffs', 'Error states'],
    active: false,
  },
  {
    icon: Settings2,
    name: 'Config snapshots',
    description: 'Magento system config and feature flag state before and after a change',
    captures: ['Config key/value pairs', 'Payment method toggles', 'Shipping rules', 'Feature flags'],
    active: false,
  },
  {
    icon: Database,
    name: 'DB schema diffs',
    description: 'Table schemas, migration files, and integrity rules across deploys',
    captures: ['Column types', 'Index presence', 'FK constraints', 'Migration deltas'],
    active: false,
  },
]

function SignalCard({ signal }: { signal: Signal }) {
  const Icon = signal.icon

  return (
    <div
      className={`rounded-xl p-4 flex flex-col gap-3 transition-colors duration-200 ${
        signal.active
          ? 'bg-[#121827] border border-[#3B82F6]/30 hover:border-[#3B82F6]/50'
          : 'bg-[#121827] border border-dashed border-[#24324A] opacity-60 hover:opacity-75'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              signal.active
                ? 'bg-[#3B82F6]/10 border border-[#3B82F6]/20'
                : 'bg-[#151E30] border border-[#24324A]'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${signal.active ? 'text-[#60A5FA]' : 'text-[#64748B]'}`}
            />
          </div>
          <span
            className={`text-sm font-semibold ${
              signal.active ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'
            }`}
          >
            {signal.name}
          </span>
        </div>
        {signal.active ? (
          <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-medium text-violet-400 bg-violet-500/10 border border-dashed border-violet-500/25 rounded-full px-2 py-0.5">
            Roadmap
          </span>
        )}
      </div>

      {/* Description */}
      <p
        className={`text-xs leading-relaxed ${
          signal.active ? 'text-[#94A3B8]' : 'text-[#64748B]'
        }`}
      >
        {signal.description}
      </p>

      {/* Captures */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {signal.captures.map((c) => (
          <span
            key={c}
            className={`text-[11px] rounded-md px-2 py-0.5 border ${
              signal.active
                ? 'text-[#64748B] border-[#24324A] bg-[#151E30]'
                : 'text-[#64748B]/60 border-[#24324A]/60 bg-[#151E30]/60'
            }`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignalSources() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#F8FAFC]">Signal sources</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Sentinel's pipeline is signal-agnostic — point it at any observable system state
          </p>
        </div>
        <span className="text-xs text-[#64748B]">1 of 4 active</span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {SIGNALS.map((s) => (
          <SignalCard key={s.name} signal={s} />
        ))}
      </div>
    </div>
  )
}
