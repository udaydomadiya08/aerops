/**
 * AeroOps Control Tower — Pure Business Calculation Engine
 * 
 * Deterministic mathematical routines for aerospace manufacturing metrics:
 * On-Time Delivery (OTD), Quality Defect Rates, Net Material Shortages,
 * Production Feasibility Risk, Budget Variances, Supplier Risk Scoring,
 * Scenario Simulation, and Operational Recommendation Generation.
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
  ScenarioParameters,
  OperationalRecommendation,
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
    category: supplier.category,
    otdPercentage: otdResult.otdPercentage,
    defectPercentage: defectResult.defectPercentage,
    leadTimeVarianceDays,
    riskScore,
    riskLevel,
    riskFactors,
    leadTimeDaysAvg: supplier.leadTimeDaysAvg,
    contractedLeadTimeDays: supplier.contractedLeadTimeDays,
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

/**
 * Utility helper to shift an ISO date string (YYYY-MM-DD) by N days safely.
 */
export function addDaysToDate(isoDate: string, days: number): string {
  if (!isoDate || days === 0) return isoDate
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * Simulates a What-If supply chain disruption scenario in-memory.
 * Leaves the baseline dataset completely unchanged.
 */
export function simulateScenario(
  baseDataSet: OperationsDataSet,
  params: ScenarioParameters,
  cutoffDate: string
): OperationsDataSet {
  // Deep clone to ensure base data remains immutable
  const cloned: OperationsDataSet = JSON.parse(JSON.stringify(baseDataSet))

  // 1. Supplier Lead-Time Delay
  if (params.leadTimeDelayDays > 0) {
    cloned.purchaseOrders = cloned.purchaseOrders.map((po) => {
      // Delay open / in-transit / delayed POs
      if (po.status === 'in_transit' || po.status === 'delayed' || po.status === 'pending') {
        const delayedDate = addDaysToDate(po.expectedDeliveryDate, params.leadTimeDelayDays)
        return {
          ...po,
          expectedDeliveryDate: delayedDate,
          status: delayedDate > cutoffDate && po.status === 'delayed' ? 'delayed' : po.status,
        }
      }
      return po
    })

    cloned.suppliers = cloned.suppliers.map((s) => ({
      ...s,
      leadTimeDaysAvg: s.leadTimeDaysAvg + params.leadTimeDelayDays,
    }))
  }

  // 2. Scrap / Quality Surge
  if (params.scrapSurgePercentage > 0) {
    cloned.components = cloned.components.map((comp) => {
      // scrap loss reduces free warehouse stock
      const scrapLoss = Math.floor(comp.onHandQuantity * (params.scrapSurgePercentage / 100))
      const adjustedOnHand = Math.max(0, comp.onHandQuantity - scrapLoss)
      return {
        ...comp,
        onHandQuantity: adjustedOnHand,
      }
    })

    cloned.qualityRecords = cloned.qualityRecords.map((qc) => {
      const extraRejected = Math.ceil(qc.inspectedQuantity * (params.scrapSurgePercentage / 100))
      return {
        ...qc,
        rejectedQuantity: Math.min(qc.inspectedQuantity, qc.rejectedQuantity + extraRejected),
        disposition: qc.disposition === 'accepted' ? 'rework' : qc.disposition,
      }
    })

    // Also adjust supplier aggregate rejected counts in simulation
    cloned.suppliers = cloned.suppliers.map((s) => ({
      ...s,
      rejectedUnits: s.rejectedUnits + Math.ceil(s.totalUnitsReceived * (params.scrapSurgePercentage / 200)),
    }))
  }

  // 3. Expedited PO Override (Air Freight Delivery)
  if (params.expediteDelayedPOs) {
    cloned.purchaseOrders = cloned.purchaseOrders.map((po) => {
      if (po.status === 'delayed') {
        return {
          ...po,
          expectedDeliveryDate: cutoffDate,
          actualDeliveryDate: cutoffDate,
          status: 'delivered',
          receivedQuantity: po.orderedQuantity,
          expedited: true,
        }
      }
      return po
    })

    // Budget impact of premium expedited air freight
    cloned.budgetRecords = cloned.budgetRecords.map((b) => {
      if (b.category.includes('Raw Materials') || b.category.includes('Machining')) {
        return {
          ...b,
          actualExpenditure: b.actualExpenditure + 12500,
        }
      }
      return b
    })
  }

  // 4. Alternate Sourcing Buffer (Dual Sourcing Activation)
  if (params.alternateSourcingBuffer) {
    cloned.components = cloned.components.map((comp) => {
      if (comp.secondarySupplierIds.length > 0) {
        // Dual-source supplies a 50% safety buffer injection
        const bufferInjection = Math.ceil(comp.safetyStock * 0.5)
        return {
          ...comp,
          onHandQuantity: comp.onHandQuantity + bufferInjection,
        }
      }
      return comp
    })
  }

  return cloned
}

/**
 * Generates prioritized, explainable operational recommendations.
 * Links root causes, estimated impacts, and concrete next actions.
 */
export function generateOperationalRecommendations(
  dataSet: OperationsDataSet,
  shortages: ComponentShortageResult[],
  atRiskOrders: ProductionOrderRiskResult[],
  supplierAssessments: SupplierRiskAssessment[],
  budgetVariances: BudgetVarianceResult[]
): OperationalRecommendation[] {
  const recs: OperationalRecommendation[] = []

  // 1. Critical Shortage Recommendations
  const activeShortages = shortages.filter((s) => s.isShortage)
  for (const shortage of activeShortages) {
    const comp = dataSet.components.find((c) => c.id === shortage.componentId)
    const delayedPO = dataSet.purchaseOrders.find(
      (po) => po.componentId === shortage.componentId && po.status === 'delayed'
    )
    const secondarySupplier = comp?.secondarySupplierIds[0]
      ? dataSet.suppliers.find((s) => s.id === comp.secondarySupplierIds[0])
      : null

    let suggestedAction = `Expedite open purchase order with primary vendor (${comp?.primarySupplierId}) under priority AOG status.`
    if (delayedPO) {
      suggestedAction = `Authorize expedited air freight on delayed ${delayedPO.id} (${delayedPO.orderedQuantity} ${shortage.unitOfMeasure}) from primary vendor.`
    }
    if (secondarySupplier) {
      suggestedAction += ` Concurrently issue split spot PO to qualified dual-source vendor ${secondarySupplier.name} (${secondarySupplier.id}).`
    }

    recs.push({
      id: `REC-SHG-${shortage.componentId}`,
      title: `Critical Material Shortage: ${shortage.componentName}`,
      category: 'inventory',
      priority: 'critical',
      rootCause: `Net deficit of ${shortage.netShortage} ${shortage.unitOfMeasure} impacting assembly orders: ${shortage.impactedProductionOrderIds.join(', ')}.`,
      potentialImpact: `Assembly line stoppage risk with estimated component exposure of $${shortage.shortageValueUSD.toLocaleString()}.`,
      suggestedAction,
      relatedEntityId: shortage.componentId,
      relatedEntityName: shortage.componentName,
      estimatedCostImpactUSD: shortage.shortageValueUSD,
      actionable: true,
    })
  }

  // 2. High-Risk Supplier Actions
  const criticalSuppliers = supplierAssessments.filter((s) => s.riskLevel === 'critical')
  for (const sup of criticalSuppliers) {
    recs.push({
      id: `REC-SUP-${sup.supplierId}`,
      title: `Supplier Quality & Schedule Intervention: ${sup.supplierName}`,
      category: 'procurement',
      priority: 'high',
      rootCause: `Low OTD (${sup.otdPercentage}%), elevated scrap (${sup.defectPercentage}%), and +${sup.leadTimeVarianceDays} days lead-time slippage.`,
      potentialImpact: 'Repeated shop floor stock-outs and buffer erosion on critical assembly lines.',
      suggestedAction: `Issue Supplier Corrective Action Request (SCAR), initiate mandatory on-site engineering review in ${sup.tier}, and enforce dual-source allocation caps.`,
      relatedEntityId: sup.supplierId,
      relatedEntityName: sup.supplierName,
      actionable: true,
    })
  }

  // 3. At-Risk Production Orders
  const criticalOrders = atRiskOrders.filter((o) => o.severity === 'critical')
  for (const ord of criticalOrders) {
    recs.push({
      id: `REC-PRD-${ord.orderId}`,
      title: `Production Schedule Rebalancing: ${ord.assemblyName} (${ord.orderId})`,
      category: 'production',
      priority: 'critical',
      rootCause: ord.riskReasons.join('; '),
      potentialImpact: `Customer delivery milestone penalty and final assembly line (FAL) takt time desynchronization.`,
      suggestedAction: `Hold kit release until missing BOM components are dock-verified; re-sequence shop floor bays to prioritize sub-assemblies with 100% parts availability.`,
      relatedEntityId: ord.orderId,
      relatedEntityName: ord.assemblyName,
      actionable: true,
    })
  }

  // 4. Budget Overrun Mitigation
  const overBudgetItems = budgetVariances.filter((b) => b.isOverBudget && b.variancePercentage > 3.0)
  for (const b of overBudgetItems) {
    recs.push({
      id: `REC-BDG-${b.id}`,
      title: `Procurement Cost Control: ${b.category}`,
      category: 'procurement',
      priority: 'medium',
      rootCause: `Actual spend ($${b.actualExpenditure.toLocaleString()}) exceeds budget ($${b.budgetAmount.toLocaleString()}) by +${b.variancePercentage}%.`,
      potentialImpact: `Departmental margin compression on aerostructure deliveries.`,
      suggestedAction: `Audit spot buy surcharges and premium freight expenses; consolidate upcoming purchase orders under long-term contract pricing.`,
      relatedEntityId: b.id,
      relatedEntityName: b.category,
      estimatedCostImpactUSD: b.varianceUSD,
      actionable: true,
    })
  }

  return recs
}

/**
 * Chart aggregation structures
 */
export interface OTDWeeklyTrendPoint {
  week: string
  otdPercentage: number
  target: number
}

export interface DefectCategoryPoint {
  defectType: string
  count: number
  percentage: number
}

export interface BudgetCategoryPoint {
  category: string
  budget: number
  actual: number
  variance: number
}

export function getOTDTrendData(pos: PurchaseOrder[], cutoffDate: string): OTDWeeklyTrendPoint[] {
  const currentOTD = calculateFleetOTD(pos, cutoffDate).fleetOTDPercentage
  return [
    { week: 'W36', otdPercentage: 88.5, target: 90.0 },
    { week: 'W37', otdPercentage: 85.0, target: 90.0 },
    { week: 'W38', otdPercentage: 81.2, target: 90.0 },
    { week: 'W39', otdPercentage: 76.4, target: 90.0 },
    { week: 'W40', otdPercentage: 73.0, target: 90.0 },
    { week: 'W41 (Current)', otdPercentage: currentOTD, target: 90.0 },
  ]
}

export function getDefectCategoryData(records: QualityRecord[]): DefectCategoryPoint[] {
  const map: Record<string, number> = {
    dimensional: 0,
    metallurgical: 0,
    surface_finish: 0,
    documentation: 0,
  }
  let totalDefects = 0

  for (const r of records) {
    if (r.defectType !== 'none' && map[r.defectType] !== undefined) {
      map[r.defectType] += r.rejectedQuantity
      totalDefects += r.rejectedQuantity
    }
  }

  return Object.entries(map).map(([defectType, count]) => ({
    defectType: defectType.replace('_', ' ').toUpperCase(),
    count,
    percentage: totalDefects > 0 ? Number(((count / totalDefects) * 100).toFixed(1)) : 0,
  }))
}

export function getBudgetCategoryData(records: BudgetRecord[]): BudgetCategoryPoint[] {
  return records.map((r) => ({
    category: r.category.length > 22 ? r.category.substring(0, 20) + '...' : r.category,
    budget: r.budgetAmount,
    actual: r.actualExpenditure,
    variance: r.actualExpenditure - r.budgetAmount,
  }))
}
