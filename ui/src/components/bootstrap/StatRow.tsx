import { useCountUp } from '../../hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  hint: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  const displayed = useCountUp(value)

  return (
    <div className="border border-slate-700 border-t-2 border-t-blue-500 rounded-lg p-5 space-y-1 bg-zinc-900/40">
      <p className="text-sm font-mono text-slate-300 uppercase tracking-widest">{label}</p>
      <p className="text-4xl font-mono font-bold text-blue-200 tabular-nums">{displayed}</p>
      <p className="text-sm text-slate-400">{hint}</p>
    </div>
  )
}

interface StatRowProps {
  intentCount: number
  observationCount: number
  generationCount: number
}

export default function StatRow({ intentCount, observationCount, generationCount }: StatRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="XLSX rows ingested" value={intentCount} hint={`+${intentCount} this run`} />
      <StatCard label="Behaviors observed" value={observationCount} hint={`+${observationCount} this run`} />
      <StatCard label="Tests generated" value={generationCount} hint={`+${generationCount} this run`} />
    </div>
  )
}
