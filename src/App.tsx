import { useState, useMemo } from 'react'
import { Header } from './components/layout/Header'
import { Navigation, type TabId } from './components/layout/Navigation'
import { FoundationVerificationView } from './components/shell/FoundationVerificationView'
import { Phase2PreviewView } from './components/shell/Phase2PreviewView'
import { getBaselineDataSet, SYSTEM_CUTOFF_DATE } from './data'
import { calculateExecutiveKPIs } from './utils/calculations'
import { Plane, ExternalLink } from 'lucide-react'

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('foundation')
  const [cutoffDate] = useState<string>(SYSTEM_CUTOFF_DATE)

  // Ingest baseline synthetic dataset
  const dataSet = useMemo(() => getBaselineDataSet(), [])

  // Derive executive KPIs using pure deterministic calculation engine
  const kpis = useMemo(() => {
    return calculateExecutiveKPIs(dataSet, cutoffDate)
  }, [dataSet, cutoffDate])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header cutoffDate={cutoffDate} />

      {/* Primary Section Navigation */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'foundation' ? (
          <FoundationVerificationView
            dataSet={dataSet}
            kpis={kpis}
            cutoffDate={cutoffDate}
          />
        ) : (
          <Phase2PreviewView
            tabId={activeTab}
            onGoToFoundation={() => setActiveTab('foundation')}
          />
        )}
      </main>

      {/* Industrial Operations Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-slate-300">AeroOps Control Tower</span>
            <span>&bull;</span>
            <span>Aerospace Manufacturing Decision Support System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Independent Portfolio Demonstration</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              Synthetic Data Notice
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 text-[10px] text-slate-400 text-center sm:text-left">
          Disclaimer: This application uses synthetic, fictional aerospace manufacturing data. It does not represent actual company data or an official product of Tata Advanced Systems Limited (TASL).
        </div>
      </footer>
    </div>
  )
}

export default App
