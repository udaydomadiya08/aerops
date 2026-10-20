import React, { useState, useMemo } from 'react'
import {
  SlidersHorizontal,
  RotateCcw,
  Plane,
  ShieldCheck,
  Layers,
} from 'lucide-react'

import { Badge } from '../common/Badge'
import type { OperationsDataSet } from '../../types/domain'
import type { ScenarioParameters } from '../../types/calculations'
import {
  simulateScenario,
  calculateExecutiveKPIs,
  calculateComponentShortage,
  assessProductionOrderRisk,
} from '../../utils/calculations'
import { formatCurrency, formatPercentage } from '../../utils/formatting'

interface ScenarioSimulatorViewProps {
  baselineDataSet: OperationsDataSet
  cutoffDate: string
}

const DEFAULT_SCENARIO_PARAMS: ScenarioParameters = {
  leadTimeDelayDays: 0,
  scrapSurgePercentage: 0,
  expediteDelayedPOs: false,
  alternateSourcingBuffer: false,
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({
  baselineDataSet,
  cutoffDate,
}) => {
  const [params, setParams] = useState<ScenarioParameters>(DEFAULT_SCENARIO_PARAMS)

  // Baseline KPIs
  const baselineKPIs = useMemo(() => {
    return calculateExecutiveKPIs(baselineDataSet, cutoffDate)
  }, [baselineDataSet, cutoffDate])

  // Simulated Dataset
  const simulatedDataSet = useMemo(() => {
    return simulateScenario(baselineDataSet, params, cutoffDate)
  }, [baselineDataSet, params, cutoffDate])

  // Simulated KPIs
  const simulatedKPIs = useMemo(() => {
    return calculateExecutiveKPIs(simulatedDataSet, cutoffDate)
  }, [simulatedDataSet, cutoffDate])

  // Compute impacted production orders in simulation
  const simulatedShortagesMap = useMemo(() => {
    const map = new Map()
    for (const comp of simulatedDataSet.components) {
      const s = calculateComponentShortage(
        comp,
        simulatedDataSet.purchaseOrders,
        simulatedDataSet.productionOrders,
        cutoffDate
      )
      map.set(comp.id, s)
    }
    return map
  }, [simulatedDataSet, cutoffDate])

  const simulatedAtRiskOrders = useMemo(() => {
    return simulatedDataSet.productionOrders.map((ord) =>
      assessProductionOrderRisk(ord, simulatedShortagesMap, cutoffDate)
    )
  }, [simulatedDataSet, simulatedShortagesMap, cutoffDate])

  const isModified =
    params.leadTimeDelayDays !== 0 ||
    params.scrapSurgePercentage !== 0 ||
    params.expediteDelayedPOs ||
    params.alternateSourcingBuffer

  const handleReset = () => {
    setParams(DEFAULT_SCENARIO_PARAMS)
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Reset Bar */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="info" size="sm" icon={<SlidersHorizontal className="h-3 w-3" />}>
                What-If Simulation Sandbox
              </Badge>
              <span className="text-xs text-slate-400">Non-Destructive In-Memory Execution</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive Supply Chain Disruption & Resilience Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate cascading lead-time slippage, receiving scrap spikes, expedited air freight, and secondary dual-sourcing relief.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isModified && (
              <Badge variant="warning" size="sm">
                Simulation Active
              </Badge>
            )}
            <button
              onClick={handleReset}
              disabled={!isModified}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isModified
                  ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800'
                  : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Baseline</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive Control Sliders & Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-4 border-t border-slate-800">
          
          {/* Slider 1: Lead Time Delay */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Supplier Lead-Time Slippage
              </span>
              <span className="text-xs font-mono font-bold text-blue-400">
                +{params.leadTimeDelayDays} days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={params.leadTimeDelayDays}
              onChange={(e) =>
                setParams({ ...params, leadTimeDelayDays: parseInt(e.target.value, 10) })
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Shifts expected dock delivery dates forward for all open POs.
            </p>
          </div>

          {/* Slider 2: Scrap Surge */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Quality / Scrap Surge
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                +{params.scrapSurgePercentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={params.scrapSurgePercentage}
              onChange={(e) =>
                setParams({ ...params, scrapSurgePercentage: parseInt(e.target.value, 10) })
              }
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Simulates elevated receiving rejections, decreasing usable stock.
            </p>
          </div>

          {/* Toggle 1: Expedite Delayed POs */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5 text-blue-400" />
                  Expedite Delayed POs
                </span>
                <input
                  type="checkbox"
                  checked={params.expediteDelayedPOs}
                  onChange={(e) =>
                    setParams({ ...params, expediteDelayedPOs: e.target.checked })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Simulates priority air freight delivery arriving by cut-off date ($12.5k surcharge).
              </p>
            </div>
            <Badge
              variant={params.expediteDelayedPOs ? 'success' : 'neutral'}
              size="sm"
              className="mt-2 self-start"
            >
              {params.expediteDelayedPOs ? 'Air Freight Enabled' : 'Standard Shipping'}
            </Badge>
          </div>

          {/* Toggle 2: Dual Sourcing Buffer */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Dual-Sourcing Relief
                </span>
                <input
                  type="checkbox"
                  checked={params.alternateSourcingBuffer}
                  onChange={(e) =>
                    setParams({ ...params, alternateSourcingBuffer: e.target.checked })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Activates secondary qualified vendors to inject emergency safety buffer.
              </p>
            </div>
            <Badge
              variant={params.alternateSourcingBuffer ? 'success' : 'neutral'}
              size="sm"
              className="mt-2 self-start"
            >
              {params.alternateSourcingBuffer ? 'Buffer Injected (+50%)' : 'Single Sourced'}
            </Badge>
          </div>

        </div>
      </div>

      {/* 3. Baseline vs Simulated Comparative Impact KPI Cards */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <span>Comparative Operational Impact (Baseline vs Simulation)</span>
          {isModified && <span className="text-blue-400 font-mono">(Live Recalculation)</span>}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fleet OTD */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Fleet On-Time Delivery
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {formatPercentage(simulatedKPIs.fleetOTDPercentage)}
                </span>
                <span className="text-xs text-slate-400 ml-1">Simulated</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Baseline: {formatPercentage(baselineKPIs.fleetOTDPercentage)}
              </span>
            </div>
            <div className="text-xs pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Delta Impact:</span>
              <span
                className={`font-mono font-semibold ${
                  simulatedKPIs.fleetOTDPercentage < baselineKPIs.fleetOTDPercentage
                    ? 'text-rose-400'
                    : simulatedKPIs.fleetOTDPercentage > baselineKPIs.fleetOTDPercentage
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {simulatedKPIs.fleetOTDPercentage - baselineKPIs.fleetOTDPercentage > 0 ? '+' : ''}
                {(simulatedKPIs.fleetOTDPercentage - baselineKPIs.fleetOTDPercentage).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Active Shortages */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Active Shortages
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {simulatedKPIs.activeShortageCount}
                </span>
                <span className="text-xs text-slate-400 ml-1">parts</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Baseline: {baselineKPIs.activeShortageCount}
              </span>
            </div>
            <div className="text-xs pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Delta Impact:</span>
              <span
                className={`font-mono font-semibold ${
                  simulatedKPIs.activeShortageCount > baselineKPIs.activeShortageCount
                    ? 'text-rose-400'
                    : simulatedKPIs.activeShortageCount < baselineKPIs.activeShortageCount
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {simulatedKPIs.activeShortageCount - baselineKPIs.activeShortageCount > 0 ? '+' : ''}
                {simulatedKPIs.activeShortageCount - baselineKPIs.activeShortageCount} parts
              </span>
            </div>
          </div>

          {/* At-Risk Production Orders */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              At-Risk Assembly Orders
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {simulatedKPIs.atRiskOrderCount}
                </span>
                <span className="text-xs text-slate-400 ml-1">orders</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Baseline: {baselineKPIs.atRiskOrderCount}
              </span>
            </div>
            <div className="text-xs pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Delta Impact:</span>
              <span
                className={`font-mono font-semibold ${
                  simulatedKPIs.atRiskOrderCount > baselineKPIs.atRiskOrderCount
                    ? 'text-rose-400'
                    : simulatedKPIs.atRiskOrderCount < baselineKPIs.atRiskOrderCount
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {simulatedKPIs.atRiskOrderCount - baselineKPIs.atRiskOrderCount > 0 ? '+' : ''}
                {simulatedKPIs.atRiskOrderCount - baselineKPIs.atRiskOrderCount} orders
              </span>
            </div>
          </div>

          {/* Budget Variance */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Net Budget Variance
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {formatCurrency(simulatedKPIs.netBudgetVarianceUSD)}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Baseline: {formatCurrency(baselineKPIs.netBudgetVarianceUSD)}
              </span>
            </div>
            <div className="text-xs pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Cost Delta:</span>
              <span
                className={`font-mono font-semibold ${
                  simulatedKPIs.netBudgetVarianceUSD > baselineKPIs.netBudgetVarianceUSD
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {simulatedKPIs.netBudgetVarianceUSD - baselineKPIs.netBudgetVarianceUSD > 0 ? '+' : ''}
                {formatCurrency(simulatedKPIs.netBudgetVarianceUSD - baselineKPIs.netBudgetVarianceUSD)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Downstream Production Impact Analysis */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Simulated Downstream Assembly Impact
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific aerostructure assembly lines transitioning into at-risk status under current scenario parameters
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            {simulatedAtRiskOrders.filter((o) => o.isAtRisk).length} Total Orders at Risk
          </Badge>
        </div>

        <div className="space-y-3">
          {simulatedAtRiskOrders.filter((o) => o.isAtRisk).map((ord) => (
            <div
              key={ord.orderId}
              className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{ord.orderId}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="font-semibold text-slate-200">{ord.assemblyName}</span>
                  <Badge variant={ord.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                    {ord.severity === 'critical' ? 'LINE-STOP RISK' : 'SCHEDULE RISK'}
                  </Badge>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 space-y-0.5">
                  {ord.riskReasons.map((r, i) => (
                    <div key={i} className="text-amber-400">&bull; {r}</div>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Planned Need Milestone</span>
                <div className="font-mono text-slate-300">{ord.requiredCompletionDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
