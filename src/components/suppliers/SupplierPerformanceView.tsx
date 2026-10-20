import React, { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  FileQuestion,
} from 'lucide-react'

import { Badge } from '../common/Badge'
import type { Supplier, PurchaseOrder } from '../../types/domain'
import type { SupplierRiskAssessment } from '../../types/calculations'
import { formatPercentage } from '../../utils/formatting'

interface SupplierPerformanceViewProps {
  suppliers: Supplier[]
  assessments: SupplierRiskAssessment[]
  purchaseOrders: PurchaseOrder[]
}

type SortField = 'name' | 'tier' | 'otd' | 'defect' | 'leadTime' | 'riskScore'
type SortOrder = 'asc' | 'desc'

export const SupplierPerformanceView: React.FC<SupplierPerformanceViewProps> = ({
  suppliers,
  assessments,
  purchaseOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'Tier 1' | 'Tier 2'>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'watch' | 'critical'>('all')
  const [sortField, setSortField] = useState<SortField>('riskScore')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [showFormulaModal, setShowFormulaModal] = useState(false)

  // Combined supplier record with computed assessment
  const combinedSuppliers = useMemo(() => {
    return suppliers.map((sup) => {
      const assessment = assessments.find((a) => a.supplierId === sup.id)
      return {
        ...sup,
        assessment: assessment || {
          supplierId: sup.id,
          supplierName: sup.name,
          tier: sup.tier,
          category: sup.category,
          otdPercentage: 100,
          defectPercentage: 0,
          leadTimeVarianceDays: 0,
          riskScore: 0,
          riskLevel: 'low' as const,
          riskFactors: [],
          leadTimeDaysAvg: sup.leadTimeDaysAvg,
          contractedLeadTimeDays: sup.contractedLeadTimeDays,
        },
      }
    })
  }, [suppliers, assessments])

  // Filtering
  const filteredSuppliers = useMemo(() => {
    return combinedSuppliers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTier = tierFilter === 'all' || s.tier === tierFilter
      const matchesRisk = riskFilter === 'all' || s.assessment.riskLevel === riskFilter

      return matchesSearch && matchesTier && matchesRisk
    })
  }, [combinedSuppliers, searchTerm, tierFilter, riskFilter])

  // Sorting
  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'tier':
          comparison = a.tier.localeCompare(b.tier)
          break
        case 'otd':
          comparison = a.assessment.otdPercentage - b.assessment.otdPercentage
          break
        case 'defect':
          comparison = a.assessment.defectPercentage - b.assessment.defectPercentage
          break
        case 'leadTime':
          comparison = a.leadTimeDaysAvg - b.leadTimeDaysAvg
          break
        case 'riskScore':
          comparison = a.assessment.riskScore - b.assessment.riskScore
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredSuppliers, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(field === 'riskScore' || field === 'defect' ? 'desc' : 'asc')
    }
  }

  const selectedSupplier = combinedSuppliers.find((s) => s.id === selectedSupplierId)
  const selectedSupplierPOs = purchaseOrders.filter((po) => po.supplierId === selectedSupplierId)

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Filter Controls */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="info" size="sm" icon={<Users className="h-3 w-3" />}>
                Procurement & Quality Engineering
              </Badge>
              <span className="text-xs text-slate-400">Total Suppliers Monitored: {suppliers.length}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Supplier Performance & Risk Scorecard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional evaluation of delivery reliability, quality escape rates, and lead-time stability.
            </p>
          </div>

          <button
            onClick={() => setShowFormulaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors shrink-0"
          >
            <Info className="h-3.5 w-3.5 text-blue-400" />
            <span>Formula & Weightings Breakdown</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search vendor name, commodity, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Tier:
            </span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Tiers (Tier 1 & Tier 2)</option>
              <option value="Tier 1">Tier 1 Strategic Suppliers</option>
              <option value="Tier 2">Tier 2 Component Vendors</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk (Compliant)</option>
              <option value="watch">Watch / Moderate Risk</option>
              <option value="critical">Critical Risk (Action Required)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Supplier Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supplier Company</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tier')}
                  className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tier</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('otd')}
                  className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>On-Time Delivery</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('defect')}
                  className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Defect Rate</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('leadTime')}
                  className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lead Time (Avg vs SLA)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('riskScore')}
                  className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Composite Risk</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sortedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No suppliers match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                sortedSuppliers.map((sup) => {
                  const isCritical = sup.assessment.riskLevel === 'critical'
                  const isWatch = sup.assessment.riskLevel === 'watch'

                  return (
                    <tr
                      key={sup.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{sup.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {sup.category} &bull; <span className="font-mono">{sup.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="neutral" size="sm">
                          {sup.tier}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              sup.assessment.otdPercentage >= 90
                                ? 'text-emerald-400'
                                : sup.assessment.otdPercentage >= 80
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatPercentage(sup.assessment.otdPercentage)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({sup.ordersDeliveredOnTime}/{sup.ordersPlaced} POs)
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <span
                          className={`${
                            sup.assessment.defectPercentage <= 1.0
                              ? 'text-emerald-400'
                              : sup.assessment.defectPercentage <= 2.5
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatPercentage(sup.assessment.defectPercentage, 2)}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {sup.rejectedUnits} / {sup.totalUnitsReceived.toLocaleString()} units
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-200">{sup.leadTimeDaysAvg}d</span>
                          <span className="text-slate-500">vs {sup.contractedLeadTimeDays}d SLA</span>
                        </div>
                        {sup.assessment.leadTimeVarianceDays > 0 ? (
                          <span className="text-[10px] text-rose-400 font-medium">
                            +{sup.assessment.leadTimeVarianceDays} days late
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            On schedule
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCritical ? 'bg-rose-500' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, sup.assessment.riskScore)}%` }}
                            />
                          </div>
                          <Badge
                            variant={isCritical ? 'danger' : isWatch ? 'warning' : 'success'}
                            size="sm"
                          >
                            {sup.assessment.riskScore}/100
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedSupplierId(sup.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Supplier PO Inspection Modal / Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedSupplier.name}</h3>
                  <Badge variant="neutral" size="sm">{selectedSupplier.tier}</Badge>
                  <Badge
                    variant={
                      selectedSupplier.assessment.riskLevel === 'critical'
                        ? 'danger'
                        : selectedSupplier.assessment.riskLevel === 'watch'
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                  >
                    {selectedSupplier.assessment.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedSupplier.category} &bull; Location: {selectedSupplier.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Diagnostic tags */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-slate-300">Operational Risk Diagnostics:</span>
              {selectedSupplier.assessment.riskFactors.length === 0 ? (
                <div className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Vendor compliant with all delivery SLAs and AS9100 quality standards.</span>
                </div>
              ) : (
                selectedSupplier.assessment.riskFactors.map((f, i) => (
                  <div key={i} className="text-amber-400 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))
              )}
            </div>

            {/* Associated POs */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Active & Recent Purchase Orders ({selectedSupplierPOs.length})
              </h4>
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-mono text-[10px]">
                    <tr>
                      <th className="px-3 py-2">PO ID</th>
                      <th className="px-3 py-2">Part</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Due Date</th>
                      <th className="px-3 py-2">Dock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-[11px]">
                    {selectedSupplierPOs.map((po) => (
                      <tr key={po.id}>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-200">{po.id}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{po.componentId}</td>
                        <td className="px-3 py-2 font-mono">{po.orderedQuantity}</td>
                        <td className="px-3 py-2 font-mono text-slate-300">{po.expectedDeliveryDate}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={po.status === 'delivered' ? 'success' : po.status === 'delayed' ? 'danger' : 'neutral'}
                            size="sm"
                          >
                            {po.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Formula Explanation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-blue-400" />
                  Supplier Risk Score Mathematical Grounding
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Documented transparent weights; no unexplainable black-box machine learning algorithms.
                </p>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-blue-400 font-mono">
                  Risk Score = (0.45 × S_OTD) + (0.35 × S_Defect) + (0.20 × S_LeadTime)
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <p>
                  <strong>1. On-Time Delivery Factor (45% Weight):</strong> Schedule slippage risks halting assembly lines.
                  <br />
                  <code className="text-slate-400">S_OTD = max(0, min(100, 100 - OTD %))</code>
                </p>
                <p>
                  <strong>2. Defect Factor (35% Weight):</strong> Quality escapes require scrap, rework, and MRB review.
                  <br />
                  <code className="text-slate-400">S_Defect = min(100, Defect Rate % × 20)</code> (e.g. 5% defect rate = 100 risk)
                </p>
                <p>
                  <strong>3. Lead Time Slippage Factor (20% Weight):</strong> Chronic cycle time extensions force safety stock ballooning.
                  <br />
                  <code className="text-slate-400">S_LeadTime = min(100, (Actual Lead Time - Contracted SLA) × 5)</code>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <strong>Thresholds:</strong> Low Risk: &lt;25 | Watch List: 25 to 54 | Critical Risk: &ge;55.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
