import { useCountUp } from '../../hooks/useCountUp'
import { FileSpreadsheet, Activity, FlaskConical } from 'lucide-react'

type StatConfig = {
  label: string
  description: string
  icon: React.ElementType
  iconBg: string
  iconBorder: string
  iconColor: string
}

const CONFIGS: StatConfig[] = [
  {
    label: 'XLSX rows ingested',
    description: 'Test intents extracted from spec',
    icon: FileSpreadsheet,
    iconBg: 'bg-[#3B82F6]/10',
    iconBorder: 'border-[#3B82F6]/20',
    iconColor: 'text-[#60A5FA]',
  },
  {
    label: 'Behaviors observed',
    description: 'API interactions captured',
    icon: Activity,
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    label: 'Tests generated',
    description: 'PHP test files written',
    icon: FlaskConical,
    iconBg: 'bg-[#22C55E]/10',
    iconBorder: 'border-[#22C55E]/20',
    iconColor: 'text-[#22C55E]',
  },
]

function StatCard({
  label,
  description,
  value,
  icon: Icon,
  iconBg,
  iconBorder,
  iconColor,
}: StatConfig & { value: number }) {
  const displayed = useCountUp(value)

  return (
    <div className="rounded-xl bg-[#121827] border border-[#24324A] p-5 flex flex-col gap-4 hover:border-[#3B82F6]/30 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-lg ${iconBg} border ${iconBorder} flex items-center justify-center`}
        >
          <Icon className={iconColor} size={17} />
        </div>
        <span className="text-xs font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-2.5 py-1">
          +{value} this run
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold text-[#F8FAFC] tabular-nums leading-none">{displayed}</p>
        <p className="text-sm font-medium text-[#94A3B8] mt-2">{label}</p>
        <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
      </div>
    </div>
  )
}

interface StatRowProps {
  intentCount: number
  observationCount: number
  generationCount: number
}

export default function StatRow({ intentCount, observationCount, generationCount }: StatRowProps) {
  const values = [intentCount, observationCount, generationCount]
  return (
    <div className="grid grid-cols-3 gap-4">
      {CONFIGS.map((config, i) => (
        <StatCard key={config.label} {...config} value={values[i]} />
      ))}
    </div>
  )
}
