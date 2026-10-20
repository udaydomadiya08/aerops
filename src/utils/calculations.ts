/**
 * AeroOps Control Tower — Pure Business Calculation Engine
 * 
 * Deterministic mathematical routines for aerospace manufacturing metrics:
 * On-Time Delivery (OTD), Quality Defect Rates, Net Material Shortages,
 * Production Feasibility Risk, Budget Variances, and Supplier Risk Scoring.
 */

import type {
  Supplier,
  Component,
  PurchaseOrder,
  ProductionOrder,
  QualityRecord,
  BudgetRecord,
  OperationsDataSet,
} from '../types/domain'

import type {
  SupplierOTDResult,
  DefectRateResult,
  ComponentShortageResult,
  ProductionOrderRiskResult,
  BudgetVarianceResult,
  SupplierRiskAssessment,
  ExecutiveKPIs,
  RiskSeverity,
} from '../types/calculations'

/**
 * Calculates On-Time Delivery (OTD %) for a specific supplier.
 * 
 * Rules:
 * - Denominator: Due orders up to cutoffDate, or already delivered/delayed.
 * - Numerator: Orders delivered on or before expectedDeliveryDate.
 * - Orders not yet due are excluded from the denominator.
 * - Zero denominator safely returns 100.0% with hasEligibleData = false.
 */
export function calculateSupplierOTD(
  pos: PurchaseOrder[],
  supplierId: string,
  supplierName: string,
  cutoffDate: string
): SupplierOTDResult {
  const supplierPOs = pos.filter((po) => po.supplierId === supplierId)

  const eligibleOrders = supplierPOs.filter((po) => {
    if (po.status === 'cancelled') return false
    if (po.status === 'delivered' || po.status === 'delayed') return true
    return po.expectedDeliveryDate <= cutoffDate
  })

  const eligibleDueCount = eligibleOrders.length

  if (eligibleDueCount === 0) {
    return {
      supplierId,
      supplierName,
      eligibleDueOrders: 0,
      onTimeOrders: 0,
      otdPercentage: 100.0,
      hasEligibleData: false,
    }
  }

  const onTimeCount = eligibleOrders.filter((po) => {
    if (!po.actualDeliveryDate) return false
    return po.actualDeliveryDate <= po.expectedDeliveryDate
  }).length

  const otdPercentage = Number(((onTimeCount / eligibleDueCount) * 100).toFixed(1))

  return {
    supplierId,
    supplierName,
    eligibleDueOrders: eligibleDueCount,
    onTimeOrders: onTimeCount,
    otdPercentage,
    hasEligibleData: true,
  }
}

/**
 * Computes Fleet-wide On-Time Delivery across all suppliers.
 */
export function calculateFleetOTD(
  pos: PurchaseOrder[],
  cutoffDate: string
): { fleetOTDPercentage: number; totalDueOrders: number; totalOnTimeOrders: number } {
  const eligibleOrders = pos.filter((po) => {
    if (po.status === 'cancelled') return false
    if (po.status === 'delivered' || po.status === 'delayed') return true
    return po.expectedDeliveryDate <= cutoffDate
  })

  if (eligibleOrders.length === 0) {
    return { fleetOTDPercentage: 100.0, totalDueOrders: 0, totalOnTimeOrders: 0 }
  }

  const onTimeOrders = eligibleOrders.filter((po) => {
    if (!po.actualDeliveryDate) return false
    return po.actualDeliveryDate <= po.expectedDeliveryDate
  }).length

  const fleetOTDPercentage = Number(
    ((onTimeOrders / eligibleOrders.length) * 100).toFixed(1)
  )

  return {
    fleetOTDPercentage,
    totalDueOrders: eligibleOrders.length,
    totalOnTimeOrders: onTimeOrders,
  }
}

/**
 * Calculates Quality Defect Rate (%).
 * 
 * Formula: (Rejected Units / Inspected Units) * 100
 * Handles zero inspections cleanly without NaN.
 */
export function calculateDefectRate(
  inspectedUnits: number,
  rejectedUnits: number
): DefectRateResult {
  if (inspectedUnits <= 0) {
    return {
      inspectedUnits: 0,
      rejectedUnits: 0,
      defectPercentage: 0.0,
      hasInspections: false,
    }
  }

  const boundedRejected = Math.max(0, Math.min(rejectedUnits, inspectedUnits))
  const defectPercentage = Number(((boundedRejected / inspectedUnits) * 100).toFixed(2))

  return {
    inspectedUnits,
    rejectedUnits: boundedRejected,
    defectPercentage,
    hasInspections: true,
  }
}

/**
 * Computes Defect Rate across a list of Quality Inspection Records.
 */
export function aggregateQualityDefectRate(records: QualityRecord[]): DefectRateResult {
  let totalInspected = 0
  let totalRejected = 0

  for (const record of records) {
    totalInspected += record.inspectedQuantity
    totalRejected += record.rejectedQuantity
  }

  return calculateDefectRate(totalInspected, totalRejected)
}

/**
 * Calculates Net Shortage for a Component.
 * 
 * Rules:
 * - Free on-hand = max(0, onHand - allocated)
 * - Gross requirement = sum(plannedQty * qtyPerAssembly) for all active production orders
 * - Valid scheduled receipts = POs arriving on or before the component's required need date
 * - Receipts arriving AFTER the required date are NOT counted as valid supply
 * - Net shortage = max(0, grossRequirement - (freeOnHand + validScheduledReceipts))
 */
export function calculateComponentShortage(
  component: Component,
  pos: PurchaseOrder[],
  productionOrders: ProductionOrder[],
  cutoffDate: string
): ComponentShortageResult {
  const freeOnHand = Math.max(0, component.onHandQuantity - component.allocatedQuantity)

  // Find active production orders requiring this component
  const relevantProductionOrders = productionOrders.filter((order) => {
    if (order.status === 'completed' || order.status === 'on_hold') return false
    return order.billOfMaterials.some((bom) => bom.componentId === component.id)
  })

  let grossRequirement = 0
  const earliestNeedDates: string[] = []

  for (const order of relevantProductionOrders) {
    const bomItem = order.billOfMaterials.find((bom) => bom.componentId === component.id)
    if (bomItem) {
      grossRequirement += order.plannedQuantity * bomItem.quantityPerAssembly
      earliestNeedDates.push(order.plannedStartDate)
    }
  }

  // Need threshold: earliest production start date, or cutoff date
  const requirementTargetDate = earliestNeedDates.length > 0
    ? earliestNeedDates.sort()[0]
    : cutoffDate

  // Valid scheduled receipts must arrive ON OR BEFORE the target need date
  const componentPOs = pos.filter((po) => po.componentId === component.id)
  const validScheduledReceipts = componentPOs
    .filter((po) => {
      if (po.status === 'cancelled' || po.status === 'delivered') return false
      // Must arrive on or before requirement target date
      return po.expectedDeliveryDate <= requirementTargetDate
    })
    .reduce((sum, po) => sum + po.orderedQuantity, 0)

  const netShortage = Math.max(0, grossRequirement - (freeOnHand + validScheduledReceipts))
  const isShortage = netShortage > 0
  const isBelowSafetyStock = freeOnHand < component.safetyStock
  const shortageValueUSD = Number((netShortage * component.unitCostUSD).toFixed(2))

  return {
    componentId: component.id,
    componentName: component.name,
    unitOfMeasure: component.unitOfMeasure,
    onHandQuantity: component.onHandQuantity,
    allocatedQuantity: component.allocatedQuantity,
    freeOnHand,
    grossRequirement,
    validScheduledReceipts,
    netShortage,
    isShortage,
    isBelowSafetyStock,
    unitCostUSD: component.unitCostUSD,
    shortageValueUSD,
    impactedProductionOrderIds: relevantProductionOrders.map((o) => o.id),
  }
}

/**
 * Assesses operational feasibility and schedule risk for a Production Order.
 * Explains underlying causes (material shortage, delayed schedule, start lag).
 */
export function assessProductionOrderRisk(
  order: ProductionOrder,
  shortagesMap: Map<string, ComponentShortageResult>,
  cutoffDate: string
): ProductionOrderRiskResult {
  const riskReasons: string[] = []
  const shortageComponentIds: string[] = []

  // 1. Material Shortage Check
  for (const bomItem of order.billOfMaterials) {
    const shortageInfo = shortagesMap.get(bomItem.componentId)
    if (shortageInfo && shortageInfo.isShortage) {
      shortageComponentIds.push(bomItem.componentId)
      riskReasons.push(
        `Material Shortage: ${shortageInfo.componentName} (${shortageInfo.netShortage} ${shortageInfo.unitOfMeasure} deficit)`
      )
    }
  }

  // 2. Schedule and Pacing Checks
  if (order.status === 'delayed') {
    riskReasons.push('Order flagged as delayed on shop floor schedule')
  }

  if (cutoffDate > order.plannedStartDate && order.completedQuantity === 0 && order.status !== 'completed') {
    riskReasons.push(
      `Pacing Lag: Planned start date (${order.plannedStartDate}) elapsed with 0/${order.plannedQuantity} units finished`
    )
  }

  if (cutoffDate > order.requiredCompletionDate && order.completedQuantity < order.plannedQuantity) {
    riskReasons.push(`Milestone overdue: Passed required date (${order.requiredCompletionDate})`)
  }

  const isAtRisk = riskReasons.length > 0

  // 3. Severity Determination
  let severity: RiskSeverity = 'healthy'
  if (isAtRisk) {
    if (
      order.priority === 'critical_aog' ||
      shortageComponentIds.length > 0 ||
      order.status === 'delayed'
    ) {
      severity = 'critical'
    } else {
      severity = 'moderate'
    }
  }

  return {
    orderId: order.id,
    assemblyCode: order.assemblyCode,
    assemblyName: order.assemblyName,
    priority: order.priority,
    status: order.status,
    plannedStartDate: order.plannedStartDate,
    requiredCompletionDate: order.requiredCompletionDate,
    plannedQuantity: order.plannedQuantity,
    completedQuantity: order.completedQuantity,
    isAtRisk,
    severity,
    riskReasons,
    shortageComponentIds,
  }
}

/**
 * Calculates budget variance.
 * Positive variance indicates spending is above budget (unfavorable).
 */
export function calculateBudgetVariance(record: BudgetRecord): BudgetVarianceResult {
  const varianceUSD = Number((record.actualExpenditure - record.budgetAmount).toFixed(2))

  let variancePercentage = 0
  if (record.budgetAmount > 0) {
    variancePercentage = Number(((varianceUSD / record.budgetAmount) * 100).toFixed(2))
  } else if (record.actualExpenditure > 0) {
    variancePercentage = 100.0
  }

  return {
    id: record.id,
    period: record.period,
    category: record.category,
    budgetAmount: record.budgetAmount,
    actualExpenditure: record.actualExpenditure,
    varianceUSD,
    variancePercentage,
    isOverBudget: varianceUSD > 0,
  }
}

/**
 * Evaluates Supplier Composite Risk Score (Heuristic 0-100).
 * Weights:
 * - OTD Factor (45%)
 * - Quality Defect Factor (35%)
 * - Lead Time Slippage Factor (20%)
 */
export function assessSupplierRisk(
  supplier: Supplier,
  pos: PurchaseOrder[],
  cutoffDate: string
): SupplierRiskAssessment {
  const otdResult = calculateSupplierOTD(pos, supplier.id, supplier.name, cutoffDate)
  const defectResult = calculateDefectRate(supplier.totalUnitsReceived, supplier.rejectedUnits)

  const leadTimeVarianceDays = Math.max(
    0,
    supplier.leadTimeDaysAvg - supplier.contractedLeadTimeDays
  )

  // Sub-scores 0 to 100 (higher = worse risk)
  const sOTD = Math.max(0, Math.min(100, 100 - otdResult.otdPercentage))
  const sDefect = Math.min(100, defectResult.defectPercentage * 20) // 5% defect rate = 100 risk
  const sLeadTime = Math.min(100, leadTimeVarianceDays * 5) // 20 days lead time slip = 100 risk

  const riskScore = Math.round(0.45 * sOTD + 0.35 * sDefect + 0.2 * sLeadTime)

  const riskFactors: string[] = []
  if (otdResult.otdPercentage < 85) {
    riskFactors.push(`Sub-par OTD: ${otdResult.otdPercentage}% delivery compliance`)
  }
  if (defectResult.defectPercentage > 1.5) {
    riskFactors.push(`Elevated Scrap/Defect: ${defectResult.defectPercentage}% rejection rate`)
  }
  if (leadTimeVarianceDays > 5) {
    riskFactors.push(`Lead time delay: +${leadTimeVarianceDays} days over contracted cycle`)
  }

  let riskLevel: 'low' | 'watch' | 'critical' = 'low'
  if (riskScore >= 55) {
    riskLevel = 'critical'
  } else if (riskScore >= 25) {
    riskLevel = 'watch'
  }

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    tier: supplier.tier,
    otdPercentage: otdResult.otdPercentage,
    defectPercentage: defectResult.defectPercentage,
    leadTimeVarianceDays,
    riskScore,
    riskLevel,
    riskFactors,
  }
}

/**
 * Calculates Executive Operations KPIs across the entire dataset.
 */
export function calculateExecutiveKPIs(
  dataSet: OperationsDataSet,
  cutoffDate: string
): ExecutiveKPIs {
  const fleetOTD = calculateFleetOTD(dataSet.purchaseOrders, cutoffDate)

  // Compute shortages
  const shortagesMap = new Map<string, ComponentShortageResult>()
  let activeShortages = 0

  for (const comp of dataSet.components) {
    const shortage = calculateComponentShortage(
      comp,
      dataSet.purchaseOrders,
      dataSet.productionOrders,
      cutoffDate
    )
    shortagesMap.set(comp.id, shortage)
    if (shortage.isShortage) {
      activeShortages++
    }
  }

  // Assess production orders
  let atRiskOrders = 0
  for (const order of dataSet.productionOrders) {
    const assessment = assessProductionOrderRisk(order, shortagesMap, cutoffDate)
    if (assessment.isAtRisk) {
      atRiskOrders++
    }
  }

  // Defect rate
  const qualitySummary = aggregateQualityDefectRate(dataSet.qualityRecords)

  // Budget variance
  let totalBudget = 0
  let totalActual = 0
  for (const b of dataSet.budgetRecords) {
    totalBudget += b.budgetAmount
    totalActual += b.actualExpenditure
  }

  const netBudgetVarianceUSD = Number((totalActual - totalBudget).toFixed(2))
  const netBudgetVariancePercentage = totalBudget > 0
    ? Number(((netBudgetVarianceUSD / totalBudget) * 100).toFixed(2))
    : 0

  return {
    fleetOTDPercentage: fleetOTD.fleetOTDPercentage,
    totalDueOrders: fleetOTD.totalDueOrders,
    activeShortageCount: activeShortages,
    totalComponentsEvaluated: dataSet.components.length,
    atRiskOrderCount: atRiskOrders,
    totalProductionOrders: dataSet.productionOrders.length,
    fleetDefectPercentage: qualitySummary.defectPercentage,
    totalInspectedUnits: qualitySummary.inspectedUnits,
    netBudgetVarianceUSD,
    netBudgetVariancePercentage,
  }
}
