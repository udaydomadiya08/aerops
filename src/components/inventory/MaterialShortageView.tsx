import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  Info,
  Calendar,
  RotateCcw,
} from 'lucide-react'

import { Badge } from '../common/Badge'
import { KPICard } from '../common/KPICard'
import type { Component, ProductionOrder } from '../../types/domain'
import type { ComponentShortageResult } from '../../types/calculations'
import { formatCurrency, formatQuantity } from '../../utils/formatting'

interface MaterialShortageViewProps {
  components: Component[]
  shortages: ComponentShortageResult[]
  productionOrders: ProductionOrder[]
  cutoffDate: string
}

type ShortageFilter = 'all' | 'shortage_only' | 'safety_stock_only'

export const MaterialShortageView: React.FC<MaterialShortageViewProps> = ({
  components,
  shortages,
  productionOrders,
  cutoffDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [shortageFilter, setShortageFilter] = useState<ShortageFilter>('all')

  // Summary Metrics
  const activeShortages = shortages.filter((s) => s.isShortage)
  const safetyStockDeficits = shortages.filter((s) => s.isBelowSafetyStock)
  const totalFinancialExposure = activeShortages.reduce(
    (sum, s) => sum + s.shortageValueUSD,
    0
  )

  // Filtering
  const filteredShortages = useMemo(() => {
    return shortages.filter((s) => {
      const comp = components.find((c) => c.id === s.componentId)

      const matchesSearch =
        s.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.componentId.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        categoryFilter === 'all' || comp?.category === categoryFilter

      const matchesShortage =
        shortageFilter === 'all'
          ? true
          : shortageFilter === 'shortage_only'
          ? s.isShortage
          : s.isBelowSafetyStock

      return matchesSearch && matchesCategory && matchesShortage
    })
  }, [shortages, components, searchTerm, categoryFilter, shortageFilter])

  const handleResetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setShortageFilter('all')
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="danger" size="sm" icon={<AlertTriangle className="h-3 w-3" />}>
                BOM Material Readiness
              </Badge>
              <span className="text-xs text-slate-400">Inventory Allocation & Supply Gap Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Material Shortage & Gross-to-Net Inventory Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculates genuine uncommitted stock deducting active work-order reservations. Evaluates scheduled PO receipt validity against production need dates.
            </p>
          </div>

          <div
            aria-label={`Current operational reporting cut-off date is ${cutoffDate}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span>Cut-off Date: <strong className="font-mono text-white">{cutoffDate}</strong></span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              aria-label="Search components by ID or description"
              placeholder="Search component ID, titanium, bolts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="material-cat-filter" className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" aria-hidden="true" /> Category:
            </label>
            <select
              id="material-cat-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Commodity Groups</option>
              <option value="Structural">Structural & Forgings</option>
              <option value="Fasteners">Precision Fasteners</option>
              <option value="Composites">Composites & Pre-Preg</option>
              <option value="Avionics">Avionics & Harnessing</option>
              <option value="Propulsion">Propulsion & Hydraulics</option>
            </select>
          </div>

          {/* Shortage Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="material-state-filter" className="text-xs text-slate-400 shrink-0">Inventory State:</label>
            <select
              id="material-state-filter"
              value={shortageFilter}
              onChange={(e) => setShortageFilter(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Parts ({shortages.length})</option>
              <option value="shortage_only">Critical Shortages Only ({activeShortages.length})</option>
              <option value="safety_stock_only">Below Safety Buffer ({safetyStockDeficits.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Critical Component Shortages"
          value={activeShortages.length}
          unit="parts"
          subtext="Immediate line-stop exposure"
          badgeText={activeShortages.length > 0 ? 'Critical' : 'All Clear'}
          badgeVariant={activeShortages.length > 0 ? 'danger' : 'success'}
          status={activeShortages.length > 0 ? 'critical' : 'healthy'}
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
          infoNote="Net Shortage > 0 after accounting for valid receipts"
        />

        <KPICard
          title="Component Shortage Value Exposure"
          value={formatCurrency(totalFinancialExposure)}
          subtext="Uncovered material value"
          badgeText={totalFinancialExposure > 0 ? 'Procurement Deficit' : 'Optimal'}
          badgeVariant={totalFinancialExposure > 0 ? 'warning' : 'success'}
          status={totalFinancialExposure > 0 ? 'watch' : 'healthy'}
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
          infoNote="Net Shortage Qty × Unit Cost (USD)"
        />

        <KPICard
          title="Below Safety Stock Buffer"
          value={safetyStockDeficits.length}
          unit={`/ ${components.length} parts`}
          subtext="Vulnerable to demand spikes"
          badgeText={safetyStockDeficits.length > 0 ? 'Buffer Depleted' : 'Adequate'}
          badgeVariant={safetyStockDeficits.length > 0 ? 'warning' : 'success'}
          status={safetyStockDeficits.length > 0 ? 'watch' : 'healthy'}
          icon={<Package className="h-5 w-5 text-blue-400" />}
          infoNote="Free On-Hand < Safety Stock parameter"
        />

        <KPICard
          title="Assembly Orders Impacted"
          value={Array.from(new Set(activeShortages.flatMap((s) => s.impactedProductionOrderIds))).length}
          unit={`/ ${productionOrders.length} lines`}
          subtext="Affected aerostructure lines"
          badgeText="Work Orders Flagged"
          badgeVariant="neutral"
          status="watch"
          icon={<Layers className="h-5 w-5 text-slate-300" />}
          infoNote="Work orders awaiting these deficient components"
        />
      </div>

      {/* 3. Shortage Mathematical Rule Notice */}
      <div className="rounded-lg bg-blue-950/20 border border-blue-900/40 p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <span className="font-semibold text-white">Aerospace Scheduled Receipt Rule Applied:</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            In aerospace manufacturing, a purchase order arriving on Oct 25th cannot satisfy a shop-floor assembly need date of Oct 10th. 
            The calculation engine strictly excludes purchase orders whose expected delivery date falls <em>after</em> the assembly need date from valid supply.
          </p>
        </div>
      </div>

      {/* 4. Detailed Component Shortage Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="Component Shortage & Inventory Table">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-5 py-3">Part Details</th>
                <th scope="col" className="px-5 py-3">Physical On-Hand</th>
                <th scope="col" className="px-5 py-3">Allocated to WIP</th>
                <th scope="col" className="px-5 py-3">Net Free Stock</th>
                <th scope="col" className="px-5 py-3">Gross BOM Req</th>
                <th scope="col" className="px-5 py-3">Valid Scheduled POs</th>
                <th scope="col" className="px-5 py-3">Net Shortage</th>
                <th scope="col" className="px-5 py-3">Financial Deficit</th>
                <th scope="col" className="px-5 py-3">Impacted Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredShortages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <p className="text-xs">No components match the selected filter criteria.</p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span>Clear Filter Criteria</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShortages.map((s) => {
                  const comp = components.find((c) => c.id === s.componentId)

                  return (
                    <tr
                      key={s.componentId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        s.isShortage ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Part Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{s.componentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {s.componentId} &bull; {comp?.category} &bull; ${comp?.unitCostUSD.toLocaleString()}/{s.unitOfMeasure}
                        </div>
                      </td>

                      {/* On-Hand */}
                      <td className="px-5 py-3.5 font-mono text-slate-200">
                        {formatQuantity(s.onHandQuantity, s.unitOfMeasure)}
                      </td>

                      {/* Allocated */}
                      <td className="px-5 py-3.5 font-mono text-amber-400">
                        {formatQuantity(s.allocatedQuantity, s.unitOfMeasure)}
                      </td>

                      {/* Free On-Hand */}
                      <td className="px-5 py-3.5 font-mono font-semibold">
                        <span className={s.freeOnHand === 0 ? 'text-rose-400' : 'text-slate-100'}>
                          {formatQuantity(s.freeOnHand, s.unitOfMeasure)}
                        </span>
                        {s.isBelowSafetyStock && (
                          <div className="text-[10px] text-amber-400 font-sans">
                            &lt; Safety Buffer ({comp?.safetyStock})
                          </div>
                        )}
                      </td>

                      {/* Gross BOM Req */}
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {formatQuantity(s.grossRequirement, s.unitOfMeasure)}
                      </td>

                      {/* Valid Scheduled Receipts */}
                      <td className="px-5 py-3.5 font-mono">
                        <span className="text-blue-400">
                          +{formatQuantity(s.validScheduledReceipts, s.unitOfMeasure)}
                        </span>
                      </td>

                      {/* Net Shortage */}
                      <td className="px-5 py-3.5 font-mono font-bold">
                        {s.isShortage ? (
                          <Badge variant="danger" size="sm">
                            -{formatQuantity(s.netShortage, s.unitOfMeasure)}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Balanced
                          </Badge>
                        )}
                      </td>

                      {/* Financial Deficit */}
                      <td className="px-5 py-3.5 font-mono">
                        {s.shortageValueUSD > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            {formatCurrency(s.shortageValueUSD)}
                          </span>
                        ) : (
                          <span className="text-slate-500">$0</span>
                        )}
                      </td>

                      {/* Impacted Orders */}
                      <td className="px-5 py-3.5">
                        {s.impactedProductionOrderIds.length === 0 ? (
                          <span className="text-slate-500 text-[11px]">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {s.impactedProductionOrderIds.map((orderId) => (
                              <span
                                key={orderId}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700"
                              >
                                {orderId}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
