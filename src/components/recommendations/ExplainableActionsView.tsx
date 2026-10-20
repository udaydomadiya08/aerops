import React, { useState } from 'react'
import {
  ShieldAlert,
  Filter,
  ClipboardCheck,
  Check,
  RotateCcw,
} from 'lucide-react'

import { Badge } from '../common/Badge'
import type { OperationalRecommendation } from '../../types/calculations'
import { formatCurrency } from '../../utils/formatting'

interface ExplainableActionsViewProps {
  recommendations: OperationalRecommendation[]
}

export const ExplainableActionsView: React.FC<ExplainableActionsViewProps> = ({
  recommendations,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set())

  const toggleAcknowledge = (id: string) => {
    const next = new Set(acknowledgedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setAcknowledgedIds(next)
  }

  const filteredRecs = recommendations.filter((r) => {
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter
    return matchesCategory && matchesPriority
  })

  const handleResetFilters = () => {
    setCategoryFilter('all')
    setPriorityFilter('all')
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="info" size="sm" icon={<ShieldAlert className="h-3 w-3" />}>
                Operations Decision Support
              </Badge>
              <span className="text-xs text-slate-400">
                {recommendations.length} Prioritized Advisory Recommendations
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Explainable Operational Action Advisor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contextual mitigation proposals generated from underlying supplier, shortage, and schedule bottlenecks. Advisory only; requires management approval.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Acknowledged: <strong>{acknowledgedIds.size} / {recommendations.length}</strong></span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="action-domain-filter" className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" aria-hidden="true" /> Commodity Domain:
            </label>
            <select
              id="action-domain-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Domains (Inventory, Procurement, Production)</option>
              <option value="inventory">Inventory & Shortages</option>
              <option value="procurement">Procurement & Supplier SLAs</option>
              <option value="production">Production Work Order Scheduling</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="action-priority-filter" className="text-xs text-slate-400 shrink-0">Priority Severity:</label>
            <select
              id="action-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical (Line-Stop Exposure)</option>
              <option value="high">High (Quality / SLA Breach)</option>
              <option value="medium">Medium (Budget Overrun)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Recommendations List */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <p className="text-xs">No operational recommendations match the selected filters.</p>
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
          filteredRecs.map((rec) => {
            const isAck = acknowledgedIds.has(rec.id)

            return (
              <div
                key={rec.id}
                className={`rounded-xl border p-5 transition-all duration-200 ${
                  isAck
                    ? 'bg-slate-950/50 border-slate-800 opacity-70'
                    : rec.priority === 'critical'
                    ? 'bg-rose-950/20 border-rose-900/60'
                    : rec.priority === 'high'
                    ? 'bg-amber-950/20 border-amber-900/60'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-400">{rec.id}</span>
                      <span className="text-slate-500">&bull;</span>
                      <h3 className="text-sm font-bold text-white">{rec.title}</h3>
                      <Badge
                        variant={rec.priority === 'critical' ? 'danger' : rec.priority === 'high' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {rec.category.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-pressed={isAck}
                    aria-label={`Mark recommendation ${rec.id} as ${isAck ? 'pending review' : 'acknowledged'}`}
                    onClick={() => toggleAcknowledge(rec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                      isAck
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isAck ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    <span>{isAck ? 'Action In Review' : 'Acknowledge Action'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-3">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Underlying Cause (Observed Data)
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rec.rootCause}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Potential Downstream Impact
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rec.potentialImpact}</p>
                  </div>
                </div>

                {/* Suggested Action Box */}
                <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-blue-400 uppercase font-bold block mb-0.5">
                      Recommended Practical Management Action:
                    </span>
                    <p className="text-blue-100 font-medium leading-relaxed">
                      {rec.suggestedAction}
                    </p>
                  </div>

                  {rec.estimatedCostImpactUSD && rec.estimatedCostImpactUSD > 0 && (
                    <div className="shrink-0 text-right sm:pl-4 sm:border-l border-blue-900/60">
                      <span className="text-[10px] text-slate-400 uppercase">Financial Exposure</span>
                      <div className="font-mono font-bold text-amber-400">
                        {formatCurrency(rec.estimatedCostImpactUSD)}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
