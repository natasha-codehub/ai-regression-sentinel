import { CheckCircle2 } from 'lucide-react'
import { useBootstrapData } from '../hooks/useBootstrapData'
import StatRow from '../components/bootstrap/StatRow'
import PipelineFeed from '../components/bootstrap/PipelineFeed'
import TestsTable from '../components/bootstrap/TestsTable'
import SignalSources from '../components/bootstrap/SignalSources'

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#64748B]">Loading pipeline data…</span>
      </div>
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
    <div className="rounded-xl bg-[#121827] border border-[#24324A] px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[#F8FAFC]">Bootstrap run complete</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Processed{' '}
            <span className="text-[#F8FAFC] font-medium">{intentCount} test intents</span> from
            XLSX spec and generated{' '}
            <span className="text-[#F8FAFC] font-medium">{generationCount} PHP test files</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-6 text-sm font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-4 py-2">
        <CheckCircle2 className="w-4 h-4" />
        All 4 stages passed
      </div>
    </div>
  )
}

interface Props {
  onNavigateTrace: (testId: string) => void
}

export default function BootstrapPanel({ onNavigateTrace }: Props) {
  const { intents, reconciliations, generations, evalScores, displayStats, loading } =
    useBootstrapData()

  if (loading) return <LoadingState />

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-7 space-y-6">
        {/* 1. Status banner */}
        <RunBanner intentCount={displayStats.intentCount} generationCount={displayStats.generationCount} />

        {/* 2. KPI metrics */}
        <StatRow
          intentCount={displayStats.intentCount}
          observationCount={displayStats.observationCount}
          generationCount={displayStats.generationCount}
        />

        {/* 3. Pipeline visualization */}
        <PipelineFeed
          intents={intents}
          reconciliations={reconciliations}
          generations={generations}
          evalCount={evalScores.length}
          displayIntentCount={displayStats.intentCount}
          displayGenerationCount={displayStats.generationCount}
        />

        {/* 4. Generated tests */}
        <TestsTable
          generations={generations}
          evalScores={evalScores}
          onExpand={onNavigateTrace}
        />

        {/* 5. Signal sources (capabilities) */}
        <SignalSources />
      </div>
    </div>
  )
}
