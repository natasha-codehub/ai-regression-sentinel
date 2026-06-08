interface Signal {
  icon: string
  name: string
  description: string
  captures: string[]
  active: boolean
}

const SIGNALS: Signal[] = [
  {
    icon: '⇄',
    name: 'REST API Traces',
    description: 'HTTP request/response pairs captured from live or recorded sessions',
    captures: ['Endpoint', 'Status code', 'Request body', 'Response shape', 'User context'],
    active: true,
  },
  {
    icon: '◻',
    name: 'Browser / UI',
    description: 'DOM snapshots, user interactions, and screenshots from Playwright recordings',
    captures: ['Element visibility', 'Click targets', 'Page transitions', 'Visual diffs', 'Error states'],
    active: false,
  },
  {
    icon: '⚙',
    name: 'Config Snapshots',
    description: 'Magento system config and feature flag state before and after a change',
    captures: ['Config key/value pairs', 'Payment method toggles', 'Shipping rules', 'Feature flags'],
    active: false,
  },
  {
    icon: '◈',
    name: 'DB Schema Diffs',
    description: 'Table schemas, migration files, and integrity rules across deploys',
    captures: ['Column types', 'Index presence', 'FK constraints', 'Migration deltas'],
    active: false,
  },
]

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div
      className={`relative rounded-lg p-4 flex flex-col gap-3 transition-colors ${
        signal.active
          ? 'border-2 border-blue-500/60 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,0.08)]'
          : 'border border-dashed border-slate-600 bg-slate-900/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`text-base leading-none ${signal.active ? 'text-blue-300' : 'text-slate-500'}`}
          >
            {signal.icon}
          </span>
          <span
            className={`text-sm font-semibold ${signal.active ? 'text-slate-100' : 'text-slate-400'}`}
          >
            {signal.name}
          </span>
        </div>
        {signal.active ? (
          <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono text-blue-300 bg-blue-500/20 border border-blue-500/50 rounded px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            active
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-mono text-slate-500 bg-slate-800/60 border border-dashed border-slate-600 rounded px-2 py-0.5">
            roadmap
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`text-xs leading-relaxed ${signal.active ? 'text-slate-300' : 'text-slate-500'}`}>
        {signal.description}
      </p>

      {/* Captures */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {signal.captures.map((c) => (
          <span
            key={c}
            className={`text-[10px] font-mono rounded px-1.5 py-0.5 border ${
              signal.active
                ? 'text-slate-500 border-slate-700 bg-slate-800/50'
                : 'text-slate-700 border-slate-800 bg-slate-900/40'
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-slate-200">
            Observation signals
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            Sentinel's pipeline is signal-agnostic — point it at any observable system state
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">1 of 4 active</span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {SIGNALS.map((s) => (
          <SignalCard key={s.name} signal={s} />
        ))}
      </div>
    </div>
  )
}
