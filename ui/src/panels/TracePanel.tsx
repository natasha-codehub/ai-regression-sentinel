export default function TracePanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-mono text-blue-500 tracking-widest uppercase">
          Chapter C
        </span>
        <h1 className="text-2xl font-semibold text-slate-200">Trace</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every AI decision visible and steerable
        </p>
      </div>

      <div className="mt-8 border border-slate-800 rounded-lg px-8 py-5 flex flex-col items-center gap-2 max-w-sm w-full">
        <span className="text-xs font-mono text-slate-600 tracking-wider">COMING UP</span>
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          Per-test trace explorer: source intent, observations, reconciliation
          decision, classification, generation, eval score, and steering rules.
        </p>
      </div>
    </div>
  )
}
