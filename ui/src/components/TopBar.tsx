import type { TabId } from '../types'
import { TABS } from '../types'

interface Props {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onReset: () => void
}

export default function TopBar({ activeTab, onTabChange, onReset }: Props) {
  return (
    <header className="flex items-stretch h-12 border-b border-slate-800 shrink-0 px-5">
      {/* Wordmark */}
      <div className="flex items-center w-48 shrink-0">
        <span className="font-mono font-semibold text-sm tracking-widest text-slate-100 select-none">
          SENTINEL
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex items-stretch flex-1 justify-center gap-1">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'relative flex items-center gap-2 px-4 text-sm font-medium transition-colors duration-150',
                'border-b-2',
                isActive
                  ? 'text-slate-100 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200',
              ].join(' ')}
            >
              <span className="text-xs font-mono text-slate-600 select-none">
                {tab.chapter}
              </span>
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Reset Demo */}
      <div className="flex items-center w-48 shrink-0 justify-end">
        <button
          onClick={onReset}
          className="text-xs text-slate-400 border border-slate-700 rounded px-3 py-1.5 hover:text-slate-200 hover:border-slate-500 transition-colors duration-150 font-mono"
        >
          Reset Demo
        </button>
      </div>
    </header>
  )
}
