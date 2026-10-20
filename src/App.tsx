import { useState, useMemo } from 'react'
import { Header } from './components/layout/Header'
import { Navigation, type TabId } from './components/layout/Navigation'
import { ExecutiveDashboardView } from './components/dashboard/ExecutiveDashboardView'
import { SupplierPerformanceView } from './components/suppliers/SupplierPerformanceView'
import { MaterialShortageView } from './components/inventory/MaterialShortageView'
import { ProductionFeasibilityView } from './components/production/ProductionFeasibilityView'
import { ScenarioSimulatorView } from './components/simulation/ScenarioSimulatorView'
import { ExplainableActionsView } from './components/recommendations/ExplainableActionsView'
import { FoundationVerificationView } from './components/shell/FoundationVerificationView'

import { getBaselineDataSet, SYSTEM_CUTOFF_DATE } from './data'
import {
  calculateExecutiveKPIs,
  calculateComponentShortage,
  assessProductionOrderRisk,
  assessSupplierRisk,
  calculateBudgetVariance,
  generateOperationalRecommendations,
} from './utils/calculations'
import { Plane, ExternalLink } from 'lucide-react'

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [cutoffDate] = useState<string>(SYSTEM_CUTOFF_DATE)
  const [resetKey, setResetKey] = useState<number>(0)

  // Ingest baseline synthetic dataset
  const dataSet = useMemo(() => {
    void resetKey
    return getBaselineDataSet()
  }, [resetKey])

  // Derive component shortages
  const shortages = useMemo(() => {
    return dataSet.components.map((comp) =>
      calculateComponentShortage(
        comp,
        dataSet.purchaseOrders,
        dataSet.productionOrders,
        cutoffDate
      )
    )
  }, [dataSet, cutoffDate])

  const shortagesMap = useMemo(() => {
    const map = new Map()
    for (const s of shortages) {
      map.set(s.componentId, s)
    }
    return map
  }, [shortages])

  // Derive production order feasibility & risks
  const atRiskOrders = useMemo(() => {
    return dataSet.productionOrders.map((ord) =>
      assessProductionOrderRisk(ord, shortagesMap, cutoffDate)
    )
  }, [dataSet, shortagesMap, cutoffDate])

  // Derive supplier risk assessments
  const supplierAssessments = useMemo(() => {
    return dataSet.suppliers.map((sup) =>
      assessSupplierRisk(sup, dataSet.purchaseOrders, cutoffDate)
    )
  }, [dataSet, cutoffDate])

  // Derive budget variances
  const budgetVariances = useMemo(() => {
    return dataSet.budgetRecords.map((b) => calculateBudgetVariance(b))
  }, [dataSet])

  // Derive executive KPIs
  const kpis = useMemo(() => {
    return calculateExecutiveKPIs(dataSet, cutoffDate)
  }, [dataSet, cutoffDate])

  // Derive explainable operational recommendations
  const recommendations = useMemo(() => {
    return generateOperationalRecommendations(
      dataSet,
      shortages,
      atRiskOrders,
      supplierAssessments,
      budgetVariances
    )
  }, [dataSet, shortages, atRiskOrders, supplierAssessments, budgetVariances])

  const handleResetData = () => {
    setResetKey((prev) => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header cutoffDate={cutoffDate} onResetData={handleResetData} />

      {/* Primary Section Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        shortageCount={kpis.activeShortageCount}
        atRiskOrderCount={kpis.atRiskOrderCount}
        actionCount={recommendations.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboardView
            dataSet={dataSet}
            kpis={kpis}
            shortages={shortages}
            atRiskOrders={atRiskOrders}
            recommendations={recommendations}
            cutoffDate={cutoffDate}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierPerformanceView
            suppliers={dataSet.suppliers}
            assessments={supplierAssessments}
            purchaseOrders={dataSet.purchaseOrders}
          />
        )}

        {activeTab === 'shortages' && (
          <MaterialShortageView
            components={dataSet.components}
            shortages={shortages}
            productionOrders={dataSet.productionOrders}
            cutoffDate={cutoffDate}
          />
        )}

        {activeTab === 'production' && (
          <ProductionFeasibilityView
            productionOrders={dataSet.productionOrders}
            atRiskAssessments={atRiskOrders}
            components={dataSet.components}
            shortages={shortages}
            cutoffDate={cutoffDate}
          />
        )}

        {activeTab === 'simulation' && (
          <ScenarioSimulatorView
            baselineDataSet={dataSet}
            cutoffDate={cutoffDate}
          />
        )}

        {activeTab === 'recommendations' && (
          <ExplainableActionsView
            recommendations={recommendations}
          />
        )}

        {activeTab === 'foundation' && (
          <FoundationVerificationView
            dataSet={dataSet}
            kpis={kpis}
            cutoffDate={cutoffDate}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 text-[10px] text-slate-500 text-center sm:text-left">
          Disclaimer: This application uses synthetic, fictional aerospace manufacturing data. It does not represent actual company data or an official product of Tata Advanced Systems Limited (TASL).
        </div>
      </footer>
    </div>
  )
}

export default App
