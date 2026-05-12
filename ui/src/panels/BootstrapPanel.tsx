import { useBootstrapData } from '../hooks/useBootstrapData'
import StatRow from '../components/bootstrap/StatRow'
import PipelineFeed from '../components/bootstrap/PipelineFeed'
import TestsTable from '../components/bootstrap/TestsTable'

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-xs font-mono text-slate-600 tracking-widest animate-pulse">
        Loading pipeline data…
      </span>
    </div>
  )
}

function RunBanner({
  intentCount,
  generationCount,
}: {
  intentCount: number
  generationCount: number
}) {
  return (
    <div className="border border-slate-800 rounded-lg px-5 py-4 flex items-center justify-between bg-slate-900/40">
      <div className="space-y-0.5">
        <p className="text-sm font-mono text-slate-200 font-medium">Bootstrap run complete</p>
        <p className="text-xs font-mono text-slate-500">
          Sentinel ingested <span className="text-slate-300">{intentCount} test intents</span> from
          the XLSX spec, matched them against observed API behavior, and generated{' '}
          <span className="text-slate-300">{generationCount} PHP test files</span> — each evaluated
          and gate-scored before landing in your test suite.
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-6">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">All stages passed</span>
      </div>
    </div>
  )
}

export default function BootstrapPanel() {
  const { intents, reconciliations, generations, evalScores, observations, loading } =
    useBootstrapData()

  if (loading) return <LoadingState />

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        <RunBanner intentCount={intents.length} generationCount={generations.length} />
        <StatRow
          intentCount={intents.length}
          observationCount={observations.length}
          generationCount={generations.length}
        />
        <PipelineFeed
          intents={intents}
          reconciliations={reconciliations}
          generations={generations}
        />
        <TestsTable
          generations={generations}
          evalScores={evalScores}
          onExpand={(id) => console.log('expand', id)}
        />
      </div>
    </div>
  )
}
