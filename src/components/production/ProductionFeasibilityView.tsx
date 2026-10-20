import React, { useState, useMemo } from 'react'
import {
  Factory,
  Search,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react'

import { Badge } from '../common/Badge'
import type { ProductionOrder, Component } from '../../types/domain'
import type { ProductionOrderRiskResult, ComponentShortageResult } from '../../types/calculations'
import { formatDate } from '../../utils/formatting'

interface ProductionFeasibilityViewProps {
  productionOrders: ProductionOrder[]
  atRiskAssessments: ProductionOrderRiskResult[]
  components: Component[]
  shortages: ComponentShortageResult[]
  cutoffDate: string
}

export const ProductionFeasibilityView: React.FC<ProductionFeasibilityViewProps> = ({
  productionOrders,
  atRiskAssessments,
  components,
  shortages,
  cutoffDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  // Map of shortages by component ID for instant lookup
  const shortagesMap = useMemo(() => {
    const map = new Map<string, ComponentShortageResult>()
    for (const s of shortages) {
      map.set(s.componentId, s)
    }
    return map
  }, [shortages])

  // Combine order with risk result
  const combinedOrders = useMemo(() => {
    return productionOrders.map((ord) => {
      const risk = atRiskAssessments.find((r) => r.orderId === ord.id)
      return {
        ...ord,
        risk: risk || {
          orderId: ord.id,
          assemblyCode: ord.assemblyCode,
          assemblyName: ord.assemblyName,
          priority: ord.priority,
          status: ord.status,
          plannedStartDate: ord.plannedStartDate,
          requiredCompletionDate: ord.requiredCompletionDate,
          plannedQuantity: ord.plannedQuantity,
          completedQuantity: ord.completedQuantity,
          isAtRisk: false,
          severity: 'healthy' as const,
          riskReasons: [],
          shortageComponentIds: [],
        },
      }
    })
  }, [productionOrders, atRiskAssessments])

  // Filtering
  const filteredOrders = useMemo(() => {
    return combinedOrders.filter((ord) => {
      const matchesSearch =
        ord.assemblyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.assemblyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || ord.status === statusFilter

      const matchesPriority =
        priorityFilter === 'all' || ord.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [combinedOrders, searchTerm, statusFilter, priorityFilter])

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="warning" size="sm" icon={<Factory className="h-3 w-3" />}>
                Shop Floor Operations Planning
              </Badge>
              <span className="text-xs text-slate-400">Total Assembly Work Orders: {productionOrders.length}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Production Order Feasibility & BOM Readiness Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-echelon Bill of Materials (BOM) explosion verifying component dock readiness against planned assembly milestones.
            </p>
          </div>

          <div
            aria-label={`Current operational reporting cut-off date is ${cutoffDate}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300"
          >
            <Clock className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            <span>Active Reporting Cut-off: <strong className="font-mono text-white">{cutoffDate}</strong></span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              aria-label="Search production orders by ID or assembly name"
              placeholder="Search work order ID, fighter wing, radome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="prod-priority-filter" className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" aria-hidden="true" /> Priority:
            </label>
            <select
              id="prod-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical_aog">AOG Critical (Aircraft On Ground)</option>
              <option value="high">High Priority</option>
              <option value="standard">Standard Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="prod-status-filter" className="text-xs text-slate-400 shrink-0">Line Status:</label>
            <select
              id="prod-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="delayed">Delayed</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Distinction Guidance Alert */}
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-semibold text-white">Risk Classification Convention:</span>
          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
            The system clearly distinguishes between <strong>Confirmed Delays</strong> (orders marked delayed on the shop floor) and <strong>Potential Risks</strong> (scheduled orders where upstream component arrival dates or pacing lags indicate a future line-stop bottleneck).
          </p>
        </div>
      </div>

      {/* 3. Production Work Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <p className="text-xs">No production orders match the selected filters.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Clear Filter Criteria</span>
              </button>
            </div>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id
            const progressPct = Math.round((ord.completedQuantity / ord.plannedQuantity) * 100)

            return (
              <div
                key={ord.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  ord.risk.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-900/60'
                    : ord.risk.severity === 'moderate'
                    ? 'bg-amber-950/20 border-amber-900/60'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Header Summary Card */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">{ord.id}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-semibold text-slate-100">{ord.assemblyName}</span>
                      <Badge variant="neutral" size="sm">
                        {ord.assemblyCode}
                      </Badge>
                      <Badge
                        variant={
                          ord.priority === 'critical_aog'
                            ? 'danger'
                            : ord.priority === 'high'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {ord.priority === 'critical_aog' ? 'AOG CRITICAL' : ord.priority.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={
                          ord.status === 'delayed'
                            ? 'danger'
                            : ord.status === 'in_progress'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {ord.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>Planned Start: <strong className="font-mono text-slate-300">{formatDate(ord.plannedStartDate)}</strong></span>
                      <span>Target Delivery: <strong className="font-mono text-slate-300">{formatDate(ord.requiredCompletionDate)}</strong></span>
                      <span>BOM Components: <strong className="text-slate-200">{ord.billOfMaterials.length} required</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    {/* Batch Progress */}
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-1">
                        Batch: <span className="font-mono font-bold text-white">{ord.completedQuantity}/{ord.plannedQuantity}</span> ({progressPct}%)
                      </div>
                      <div className="w-28 h-2 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Assembly batch completion progress: ${progressPct}%`}>
                        <div
                          className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(ord.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`bom-panel-${ord.id}`}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} Bill of Materials drilldown for ${ord.id}`}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    >
                      <span>BOM Drilldown</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Risk Diagnostic Alert Box if At Risk */}
                {ord.risk.isAtRisk && (
                  <div className="px-5 pb-3">
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Feasibility Diagnostics ({ord.risk.severity === 'critical' ? 'Critical Line-Stop Risk' : 'Moderate Schedule Risk'}):</span>
                      </div>
                      <div className="space-y-0.5 text-slate-300 text-[11px] pl-5">
                        {ord.risk.riskReasons.map((reason, idx) => (
                          <div key={idx}>&bull; {reason}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsible BOM Table */}
                {isExpanded && (
                  <div id={`bom-panel-${ord.id}`} className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                        Bill of Materials (BOM) Component Explosion
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Batch Quantity: {ord.plannedQuantity} assemblies
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs" aria-label={`Bill of Materials for ${ord.id}`}>
                        <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px]">
                          <tr>
                            <th scope="col" className="px-4 py-2.5">Component ID</th>
                            <th scope="col" className="px-4 py-2.5">Part Name</th>
                            <th scope="col" className="px-4 py-2.5">Qty / Unit</th>
                            <th scope="col" className="px-4 py-2.5">Total Required</th>
                            <th scope="col" className="px-4 py-2.5">Free Unallocated Stock</th>
                            <th scope="col" className="px-4 py-2.5">Valid In-Time Receipts</th>
                            <th scope="col" className="px-4 py-2.5">Component Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-[11px]">
                          {ord.billOfMaterials.map((bom) => {
                            const comp = components.find((c) => c.id === bom.componentId)
                            const shortage = shortagesMap.get(bom.componentId)
                            const totalRequired = bom.quantityPerAssembly * ord.plannedQuantity
                            const isPartShort = shortage ? shortage.isShortage : false

                            return (
                              <tr key={bom.componentId} className="hover:bg-slate-900/50">
                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-200">
                                  {bom.componentId}
                                </td>
                                <td className="px-4 py-2.5 text-slate-300">
                                  {comp?.name || 'Unknown Part'}
                                </td>
                                <td className="px-4 py-2.5 font-mono">
                                  {bom.quantityPerAssembly} {comp?.unitOfMeasure}
                                </td>
                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-100">
                                  {totalRequired} {comp?.unitOfMeasure}
                                </td>
                                <td className="px-4 py-2.5 font-mono">
                                  <span className={shortage && shortage.freeOnHand === 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                    {shortage?.freeOnHand || 0} {comp?.unitOfMeasure}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-blue-400">
                                  +{shortage?.validScheduledReceipts || 0} {comp?.unitOfMeasure}
                                </td>
                                <td className="px-4 py-2.5">
                                  {isPartShort ? (
                                    <Badge variant="danger" size="sm">
                                      Deficit (-{shortage?.netShortage} {comp?.unitOfMeasure})
                                    </Badge>
                                  ) : (
                                    <Badge variant="success" size="sm">
                                      Ready / Covered
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
