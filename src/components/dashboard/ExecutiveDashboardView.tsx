import React from 'react'
import {
  Clock,
  AlertCircle,
  Percent,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from 'recharts'

import { KPICard } from '../common/KPICard'
import { Badge } from '../common/Badge'
import type {
  OperationsDataSet,
} from '../../types/domain'
import type {
  ExecutiveKPIs,
  ComponentShortageResult,
  ProductionOrderRiskResult,
  OperationalRecommendation,
} from '../../types/calculations'
import {
  formatCurrency,
  formatPercentage,
  formatDate,
} from '../../utils/formatting'
import {
  getOTDTrendData,
  getDefectCategoryData,
  getBudgetCategoryData,
} from '../../utils/calculations'
import type { TabId } from '../layout/Navigation'

interface ExecutiveDashboardViewProps {
  dataSet: OperationsDataSet
  kpis: ExecutiveKPIs
  shortages: ComponentShortageResult[]
  atRiskOrders: ProductionOrderRiskResult[]
  recommendations: OperationalRecommendation[]
  cutoffDate: string
  onNavigateTab: (tab: TabId) => void
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  dataSet,
  kpis,
  shortages,
  atRiskOrders,
  recommendations,
  cutoffDate,
  onNavigateTab,
}) => {
  const otdTrendData = React.useMemo(
    () => getOTDTrendData(dataSet.purchaseOrders, cutoffDate),
    [dataSet.purchaseOrders, cutoffDate]
  )

  const defectCategoryData = React.useMemo(
    () => getDefectCategoryData(dataSet.qualityRecords),
    [dataSet.qualityRecords]
  )

  const budgetCategoryData = React.useMemo(
    () => getBudgetCategoryData(dataSet.budgetRecords),
    [dataSet.budgetRecords]
  )

  const criticalShortages = shortages.filter((s) => s.isShortage)

  return (
    <div className="space-y-6">
      
      {/* 1. Executive Operations Header Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="info" size="sm">Aerospace Operations Command</Badge>
            <span className="text-xs text-slate-400">Monitoring 6 Work Centers &bull; 6 Suppliers</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Final Assembly Operations Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time synthesis of supplier delivery schedule adherence, stock availability, line-stop risks, and expenditure tolerances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('simulation')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Simulate Disruption</span>
          </button>
          <button
            onClick={() => onNavigateTab('recommendations')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <span>View All Actions ({recommendations.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Fleet On-Time Delivery"
          value={formatPercentage(kpis.fleetOTDPercentage)}
          subtext={`${kpis.totalDueOrders} purchase orders evaluated`}
          badgeText={kpis.fleetOTDPercentage >= 85 ? 'On Target' : 'Below 90% Target'}
          badgeVariant={kpis.fleetOTDPercentage >= 85 ? 'success' : 'warning'}
          status={kpis.fleetOTDPercentage >= 85 ? 'healthy' : 'watch'}
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          infoNote="OTD (%) = Eligible On-Time / Eligible Due Orders"
        />

        <KPICard
          title="Active Material Shortages"
          value={kpis.activeShortageCount}
          unit={`/ ${kpis.totalComponentsEvaluated} parts`}
          subtext={`${criticalShortages.reduce((sum, s) => sum + s.shortageValueUSD, 0) > 0 ? '$' + criticalShortages.reduce((sum, s) => sum + s.shortageValueUSD, 0).toLocaleString() + ' exposure' : 'Zero deficit'}`}
          badgeText={kpis.activeShortageCount > 0 ? 'Critical Shortage' : 'Stock Optimal'}
          badgeVariant={kpis.activeShortageCount > 0 ? 'danger' : 'success'}
          status={kpis.activeShortageCount > 0 ? 'critical' : 'healthy'}
          icon={<AlertCircle className="h-5 w-5 text-rose-400" />}
          infoNote="Net Shortage = max(0, Gross Req - (Free Stock + Valid POs))"
        />

        <KPICard
          title="At-Risk Assembly Orders"
          value={kpis.atRiskOrderCount}
          unit={`/ ${kpis.totalProductionOrders} lines`}
          subtext="Potential assembly delays identified"
          badgeText={kpis.atRiskOrderCount > 0 ? 'Action Required' : 'Lines Balanced'}
          badgeVariant={kpis.atRiskOrderCount > 0 ? 'warning' : 'success'}
          status={kpis.atRiskOrderCount > 0 ? 'watch' : 'healthy'}
          icon={<Percent className="h-5 w-5 text-amber-400" />}
          infoNote="Orders with component shortages or pacing lags"
        />

        <KPICard
          title="Procurement Budget Variance"
          value={formatCurrency(kpis.netBudgetVarianceUSD)}
          unit={`(${kpis.netBudgetVariancePercentage > 0 ? '+' : ''}${formatPercentage(kpis.netBudgetVariancePercentage)})`}
          subtext="Net variance vs approved Q3 plan"
          badgeText={kpis.netBudgetVarianceUSD > 0 ? 'Over Budget' : 'Within Budget'}
          badgeVariant={kpis.netBudgetVarianceUSD > 0 ? 'warning' : 'success'}
          status={kpis.netBudgetVarianceUSD > 0 ? 'watch' : 'healthy'}
          icon={kpis.netBudgetVarianceUSD > 0 ? <TrendingUp className="h-5 w-5 text-amber-400" /> : <TrendingDown className="h-5 w-5 text-emerald-400" />}
          infoNote="Actual Expenditure - Budget Amount"
        />
      </div>

      {/* 3. Operational Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Rolling OTD Trendline Chart */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Fleet On-Time Delivery Trend (Rolling 6 Weeks)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Contractual Target SLA: 90.0% &bull; Measures supplier dock date adherence
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">
              {formatPercentage(kpis.fleetOTDPercentage)} Current
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={otdTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                />
                <ReferenceLine y={90} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 90%', fill: '#10b981', fontSize: 10, position: 'right' }} />
                <Line
                  type="monotone"
                  dataKey="otdPercentage"
                  name="Fleet OTD %"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Defect Distribution */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                AS9100 Receiving Rejections by Defect Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical non-conforming units rejected during dock receiving inspections
              </p>
            </div>
            <Badge variant="warning" size="sm">
              {kpis.fleetDefectPercentage}% Rejection Rate
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectCategoryData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="defectType" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                />
                <Bar dataKey="count" name="Rejected Units" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Budget Variance Breakdown */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              Procurement & Subcontract Spend vs Budget Baseline ($ USD)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison across major aerospace commodity groups for Q3 2026
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Approved Budget: <strong>$1.77M</strong> &bull; Incurred: <strong>$1.83M</strong>
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetCategoryData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="budget" name="Approved Budget" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual Expenditure" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. At-Risk Production Order Queue */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              At-Risk Production Order Feasibility Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Work orders with component shortages, unstarted assembly delays, or pacing lags
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('production')}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <span>Full Feasibility View</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Work Order ID</th>
                <th className="px-5 py-3">Assembly Program</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Batch Progress</th>
                <th className="px-5 py-3">Need Milestone</th>
                <th className="px-5 py-3">Identified Risk Diagnostic</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {atRiskOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No active production orders are currently at risk.
                  </td>
                </tr>
              ) : (
                atRiskOrders.map((order) => {
                  return (
                    <tr key={order.orderId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-200">
                        {order.orderId}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-white">{order.assemblyName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{order.assemblyCode}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={order.priority === 'critical_aog' ? 'danger' : order.priority === 'high' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {order.priority === 'critical_aog' ? 'AOG CRITICAL' : order.priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(order.completedQuantity / order.plannedQuantity) * 100}%` }}
                            />
                          </div>
                          <span>{order.completedQuantity}/{order.plannedQuantity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-mono">
                        {formatDate(order.requiredCompletionDate)}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="space-y-1">
                          {order.riskReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-amber-400 text-[11px]">
                              <span className="shrink-0 font-bold">&bull;</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onNavigateTab('production')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition-colors"
                        >
                          Drill BOM
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

      {/* 6. Top Prioritized Recommendations Preview */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Top Operational Action Recommendations (Advisory)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explainable mitigations prioritized by line-stop severity and procurement lead-time
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('recommendations')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>View All ({recommendations.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.slice(0, 2).map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-white text-sm">{rec.title}</span>
                  <Badge variant={rec.priority === 'critical' ? 'danger' : 'warning'} size="sm">
                    {rec.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
                  <strong className="text-slate-300">Root Cause:</strong> {rec.rootCause}
                </p>
                <div className="p-2.5 rounded bg-blue-950/30 border border-blue-900/40 text-blue-300 text-[11px] leading-relaxed">
                  <strong>Action:</strong> {rec.suggestedAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
