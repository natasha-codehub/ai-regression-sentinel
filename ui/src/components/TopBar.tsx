import type { TabId } from '../types'
import { TABS } from '../types'
import { Zap, RotateCcw } from 'lucide-react'

interface Props {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onReset: () => void
}

const TAB_ACCENT: Record<TabId, string> = {
  bootstrap: 'border-b-[#3B82F6] text-[#F8FAFC]',
  'steady-state': 'border-b-violet-500 text-[#F8FAFC]',
  trace: 'border-b-teal-500 text-[#F8FAFC]',
}

export default function TopBar({ activeTab, onTabChange, onReset }: Props) {
  return (
    <header className="flex items-stretch h-14 border-b border-[#24324A] shrink-0 px-6 bg-[#121827]">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 w-52 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-[#60A5FA]" />
        </div>
        <span className="font-semibold text-[#F8FAFC] text-sm tracking-tight">Sentinel</span>
        <span className="text-[10px] font-medium text-[#60A5FA] bg-blue-500/10 border border-blue-500/20 rounded-full px-1.5 py-0.5 leading-none">
          AI
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex items-stretch flex-1 justify-center gap-0.5">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'relative flex items-center gap-2 px-5 text-sm font-medium transition-all duration-150 border-b-2',
                isActive
                  ? TAB_ACCENT[tab.id as TabId]
                  : 'text-[#64748B] border-b-transparent hover:text-[#94A3B8]',
              ].join(' ')}
            >
              <span className="text-[11px] font-mono text-[#64748B] select-none">{tab.chapter}</span>
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center w-52 shrink-0 justify-end gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs text-[#64748B]">All systems</span>
          <span className="text-xs text-[#22C55E] font-medium">operational</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-[#64748B] border border-[#24324A] rounded-lg px-3 py-1.5 hover:text-[#94A3B8] hover:border-[#3B82F6]/40 transition-all duration-150"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </header>
  )
}
