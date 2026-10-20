/**
 * AeroOps Control Tower — Calculation Types
 * 
 * Data structures for operational metrics, risk assessments,
 * shortage calculations, and executive KPIs.
 */

export interface SupplierOTDResult {
  supplierId: string
  supplierName: string
  eligibleDueOrders: number
  onTimeOrders: number
  otdPercentage: number
  hasEligibleData: boolean
}

export interface DefectRateResult {
  inspectedUnits: number
  rejectedUnits: number
  defectPercentage: number
  hasInspections: boolean
}

export interface ComponentShortageResult {
  componentId: string
  componentName: string
  unitOfMeasure: string
  onHandQuantity: number
  allocatedQuantity: number
  freeOnHand: number
  grossRequirement: number
  validScheduledReceipts: number
  netShortage: number
  isShortage: boolean
  isBelowSafetyStock: boolean
  unitCostUSD: number
  shortageValueUSD: number
  impactedProductionOrderIds: string[]
}

export type RiskSeverity = 'healthy' | 'moderate' | 'critical'

export interface ProductionOrderRiskResult {
  orderId: string
  assemblyCode: string
  assemblyName: string
  priority: string
  status: string
  plannedStartDate: string
  requiredCompletionDate: string
  plannedQuantity: number
  completedQuantity: number
  isAtRisk: boolean
  severity: RiskSeverity
  riskReasons: string[]
  shortageComponentIds: string[]
}

export interface BudgetVarianceResult {
  id: string
  period: string
  category: string
  budgetAmount: number
  actualExpenditure: number
  varianceUSD: number
  variancePercentage: number
  isOverBudget: boolean
}

export interface SupplierRiskAssessment {
  supplierId: string
  supplierName: string
  tier: string
  otdPercentage: number
  defectPercentage: number
  leadTimeVarianceDays: number
  riskScore: number // 0 (best) to 100 (worst)
  riskLevel: 'low' | 'watch' | 'critical'
  riskFactors: string[]
}

export interface ExecutiveKPIs {
  fleetOTDPercentage: number
  totalDueOrders: number
  activeShortageCount: number
  totalComponentsEvaluated: number
  atRiskOrderCount: number
  totalProductionOrders: number
  fleetDefectPercentage: number
  totalInspectedUnits: number
  netBudgetVarianceUSD: number
  netBudgetVariancePercentage: number
}
