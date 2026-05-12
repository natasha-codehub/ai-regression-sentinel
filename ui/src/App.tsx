import { useState } from 'react'
import TopBar from './components/TopBar'
import BootstrapPanel from './panels/BootstrapPanel'
import SteadyStatePanel from './panels/SteadyStatePanel'
import TracePanel from './panels/TracePanel'
import type { TabId } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('bootstrap')
  const [resetKey, setResetKey] = useState(0)

  function handleReset() {
    setActiveTab('bootstrap')
    setResetKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} onReset={handleReset} />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'bootstrap' && <BootstrapPanel key={`bootstrap-${resetKey}`} />}
        {activeTab === 'steady-state' && <SteadyStatePanel key={`ss-${resetKey}`} />}
        {activeTab === 'trace' && <TracePanel key={`trace-${resetKey}`} />}
      </main>
    </div>
  )
}
