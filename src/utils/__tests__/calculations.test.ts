import { describe, it, expect } from 'vitest'
import {
  calculateSupplierOTD,
  calculateFleetOTD,
  calculateDefectRate,
  calculateComponentShortage,
  assessProductionOrderRisk,
  calculateBudgetVariance,
  assessSupplierRisk,
  calculateExecutiveKPIs,
  simulateScenario,
  generateOperationalRecommendations,
  getOTDTrendData,
  getDefectCategoryData,
  getBudgetCategoryData,
  addDaysToDate,
} from '../calculations'

import type {
  Supplier,
  Component,
  PurchaseOrder,
  ProductionOrder,
  BudgetRecord,
} from '../../types/domain'

import { getBaselineDataSet, SYSTEM_CUTOFF_DATE } from '../../data'

describe('AeroOps Calculation Utilities', () => {
  describe('Supplier On-Time Delivery Rate (OTD %)', () => {
    const mockPOs: PurchaseOrder[] = [
      {
        id: 'PO-1',
        supplierId: 'SUP-TEST',
        componentId: 'CMP-1',
        orderedQuantity: 10,
        receivedQuantity: 10,
        orderDate: '2026-09-01',
        expectedDeliveryDate: '2026-09-15',
        actualDeliveryDate: '2026-09-14', // On-time
        status: 'delivered',
        expedited: false,
      },
      {
        id: 'PO-2',
        supplierId: 'SUP-TEST',
        componentId: 'CMP-1',
        orderedQuantity: 10,
        receivedQuantity: 10,
        orderDate: '2026-09-01',
        expectedDeliveryDate: '2026-09-20',
        actualDeliveryDate: '2026-09-25', // Late
        status: 'delivered',
        expedited: false,
      },
      {
        id: 'PO-3',
        supplierId: 'SUP-TEST',
        componentId: 'CMP-1',
        orderedQuantity: 10,
        receivedQuantity: 0,
        orderDate: '2026-10-01',
        expectedDeliveryDate: '2026-11-01', // Future, not yet due!
        actualDeliveryDate: null,
        status: 'in_transit',
        expedited: false,
      },
    ]

    it('calculates OTD correctly excluding orders not yet due', () => {
      const result = calculateSupplierOTD(mockPOs, 'SUP-TEST', 'Test Supplier', '2026-10-15')
      expect(result.eligibleDueOrders).toBe(2)
      expect(result.onTimeOrders).toBe(1)
      expect(result.otdPercentage).toBe(50.0)
      expect(result.hasEligibleData).toBe(true)
    })

    it('safely handles zero eligible orders without division by zero', () => {
      const result = calculateSupplierOTD([], 'SUP-EMPTY', 'Empty Supplier', '2026-10-15')
      expect(result.eligibleDueOrders).toBe(0)
      expect(result.onTimeOrders).toBe(0)
      expect(result.otdPercentage).toBe(100.0)
      expect(result.hasEligibleData).toBe(false)
    })

    it('excludes cancelled orders from denominator', () => {
      const posWithCancelled: PurchaseOrder[] = [
        ...mockPOs,
        {
          id: 'PO-4',
          supplierId: 'SUP-TEST',
          componentId: 'CMP-1',
          orderedQuantity: 5,
          receivedQuantity: 0,
          orderDate: '2026-09-01',
          expectedDeliveryDate: '2026-09-10',
          actualDeliveryDate: null,
          status: 'cancelled',
          expedited: false,
        },
      ]
      const result = calculateSupplierOTD(posWithCancelled, 'SUP-TEST', 'Test Supplier', '2026-10-15')
      expect(result.eligibleDueOrders).toBe(2)
    })

    it('calculates fleet-wide OTD correctly', () => {
      const fleetResult = calculateFleetOTD(mockPOs, '2026-10-15')
      expect(fleetResult.totalDueOrders).toBe(2)
      expect(fleetResult.totalOnTimeOrders).toBe(1)
      expect(fleetResult.fleetOTDPercentage).toBe(50.0)
    })
  })

  describe('Quality Defect Rate (%)', () => {
    it('calculates defect rate accurately', () => {
      const result = calculateDefectRate(500, 10)
      expect(result.inspectedUnits).toBe(500)
      expect(result.rejectedUnits).toBe(10)
      expect(result.defectPercentage).toBe(2.0)
      expect(result.hasInspections).toBe(true)
    })

    it('handles zero inspected units without returning NaN', () => {
      const result = calculateDefectRate(0, 0)
      expect(result.defectPercentage).toBe(0.0)
      expect(result.hasInspections).toBe(false)
    })

    it('bounds negative or oversized rejected units', () => {
      const negativeResult = calculateDefectRate(100, -5)
      expect(negativeResult.rejectedUnits).toBe(0)
      expect(negativeResult.defectPercentage).toBe(0.0)

      const overflowResult = calculateDefectRate(100, 150)
      expect(overflowResult.rejectedUnits).toBe(100)
      expect(overflowResult.defectPercentage).toBe(100.0)
    })
  })

  describe('Inventory Availability & Shortage Calculation', () => {
    const mockComponent: Component = {
      id: 'CMP-TIT-01',
      name: 'Titanium Bulkhead Ring',
      category: 'Structural',
      unitOfMeasure: 'EA',
      onHandQuantity: 30,
      allocatedQuantity: 20, // free on hand = 10
      reorderThreshold: 15,
      safetyStock: 12,
      leadTimeDays: 45,
      primarySupplierId: 'SUP-001',
      secondarySupplierIds: [],
      unitCostUSD: 5000,
    }

    const mockProdOrders: ProductionOrder[] = [
      {
        id: 'PRD-1',
        assemblyCode: 'ASY-1',
        assemblyName: 'Wing Assembly',
        plannedQuantity: 4,
        completedQuantity: 0,
        plannedStartDate: '2026-10-20',
        requiredCompletionDate: '2026-11-10',
        billOfMaterials: [{ componentId: 'CMP-TIT-01', quantityPerAssembly: 4 }], // requirement = 16
        status: 'scheduled',
        priority: 'high',
      },
    ]

    it('identifies shortage when free stock + valid receipts are insufficient', () => {
      const result = calculateComponentShortage(mockComponent, [], mockProdOrders, '2026-10-15')
      expect(result.freeOnHand).toBe(10)
      expect(result.grossRequirement).toBe(16)
      expect(result.validScheduledReceipts).toBe(0)
      expect(result.netShortage).toBe(6)
      expect(result.isShortage).toBe(true)
      expect(result.shortageValueUSD).toBe(30000)
      expect(result.isBelowSafetyStock).toBe(true)
    })

    it('credits scheduled receipts arriving on or before the required date', () => {
      const validPO: PurchaseOrder = {
        id: 'PO-ON-TIME',
        supplierId: 'SUP-001',
        componentId: 'CMP-TIT-01',
        orderedQuantity: 10,
        receivedQuantity: 0,
        orderDate: '2026-09-01',
        expectedDeliveryDate: '2026-10-18', // arrives before 2026-10-20 requirement date!
        actualDeliveryDate: null,
        status: 'in_transit',
        expedited: false,
      }

      const result = calculateComponentShortage(mockComponent, [validPO], mockProdOrders, '2026-10-15')
      expect(result.validScheduledReceipts).toBe(10)
      expect(result.netShortage).toBe(0)
      expect(result.isShortage).toBe(false)
    })

    it('strictly excludes scheduled receipts arriving after the required date', () => {
      const latePO: PurchaseOrder = {
        id: 'PO-LATE',
        supplierId: 'SUP-001',
        componentId: 'CMP-TIT-01',
        orderedQuantity: 10,
        receivedQuantity: 0,
        orderDate: '2026-09-01',
        expectedDeliveryDate: '2026-11-05', // arrives AFTER 2026-10-20 start date!
        actualDeliveryDate: null,
        status: 'in_transit',
        expedited: false,
      }

      const result = calculateComponentShortage(mockComponent, [latePO], mockProdOrders, '2026-10-15')
      expect(result.validScheduledReceipts).toBe(0)
      expect(result.netShortage).toBe(6)
      expect(result.isShortage).toBe(true)
    })
  })

  describe('Production Order Risk Assessment', () => {
    it('flags orders with material shortages and critical priority', () => {
      const order: ProductionOrder = {
        id: 'PRD-AOG',
        assemblyCode: 'ASY-JET',
        assemblyName: 'Main Gear Assembly',
        plannedQuantity: 2,
        completedQuantity: 0,
        plannedStartDate: '2026-10-10',
        requiredCompletionDate: '2026-10-25',
        billOfMaterials: [{ componentId: 'CMP-TIT-01', quantityPerAssembly: 2 }],
        status: 'in_progress',
        priority: 'critical_aog',
      }

      const shortagesMap = new Map()
      shortagesMap.set('CMP-TIT-01', {
        componentId: 'CMP-TIT-01',
        componentName: 'Titanium Bulkhead Ring',
        netShortage: 4,
        unitOfMeasure: 'EA',
        isShortage: true,
      })

      const assessment = assessProductionOrderRisk(order, shortagesMap, '2026-10-15')
      expect(assessment.isAtRisk).toBe(true)
      expect(assessment.severity).toBe('critical')
      expect(assessment.riskReasons.some((r) => r.includes('Material Shortage'))).toBe(true)
    })

    it('identifies schedule pacing lag when start date has passed with 0 progress', () => {
      const order: ProductionOrder = {
        id: 'PRD-LAG',
        assemblyCode: 'ASY-RACK',
        assemblyName: 'Avionics Rack',
        plannedQuantity: 4,
        completedQuantity: 0,
        plannedStartDate: '2026-10-01',
        requiredCompletionDate: '2026-10-20',
        billOfMaterials: [],
        status: 'in_progress',
        priority: 'standard',
      }

      const assessment = assessProductionOrderRisk(order, new Map(), '2026-10-15')
      expect(assessment.isAtRisk).toBe(true)
      expect(assessment.riskReasons.some((r) => r.includes('Pacing Lag'))).toBe(true)
    })
  })

  describe('Budget Variance Calculations', () => {
    it('calculates over-budget positive variance correctly', () => {
      const record: BudgetRecord = {
        id: 'BDG-1',
        period: '2026-Q3',
        category: 'Titanium Alloys',
        budgetAmount: 100000,
        actualExpenditure: 110000,
      }
      const result = calculateBudgetVariance(record)
      expect(result.varianceUSD).toBe(10000)
      expect(result.variancePercentage).toBe(10.0)
      expect(result.isOverBudget).toBe(true)
    })

    it('calculates under-budget negative variance correctly', () => {
      const record: BudgetRecord = {
        id: 'BDG-2',
        period: '2026-Q3',
        category: 'Fasteners',
        budgetAmount: 50000,
        actualExpenditure: 45000,
      }
      const result = calculateBudgetVariance(record)
      expect(result.varianceUSD).toBe(-5000)
      expect(result.variancePercentage).toBe(-10.0)
      expect(result.isOverBudget).toBe(false)
    })

    it('safely handles zero budget', () => {
      const record: BudgetRecord = {
        id: 'BDG-3',
        period: '2026-Q3',
        category: 'Emergency Tooling',
        budgetAmount: 0,
        actualExpenditure: 5000,
      }
      const result = calculateBudgetVariance(record)
      expect(result.varianceUSD).toBe(5000)
      expect(result.variancePercentage).toBe(100.0)
      expect(result.isOverBudget).toBe(true)
    })
  })

  describe('Supplier Risk Assessment (Heuristic)', () => {
    const poorSupplier: Supplier = {
      id: 'SUP-RISKY',
      name: 'Risky Supplier',
      tier: 'Tier 2',
      category: 'Machining',
      location: 'Coimbatore, India',
      suppliedComponentIds: [],
      ordersPlaced: 10,
      ordersDeliveredOnTime: 5,
      totalUnitsReceived: 1000,
      rejectedUnits: 50,
      leadTimeDaysAvg: 55,
      contractedLeadTimeDays: 35,
      status: 'watch',
    }

    const latePOs: PurchaseOrder[] = [
      {
        id: 'PO-R1',
        supplierId: 'SUP-RISKY',
        componentId: 'CMP-X',
        orderedQuantity: 10,
        receivedQuantity: 10,
        orderDate: '2026-08-01',
        expectedDeliveryDate: '2026-08-20',
        actualDeliveryDate: '2026-09-01',
        status: 'delivered',
        expedited: false,
      },
    ]

    it('scores poor performing supplier as critical risk with transparent factors', () => {
      const assessment = assessSupplierRisk(poorSupplier, latePOs, '2026-10-15')
      expect(assessment.riskScore).toBeGreaterThanOrEqual(55)
      expect(assessment.riskLevel).toBe('critical')
      expect(assessment.riskFactors.length).toBeGreaterThan(0)
    })
  })

  describe('What-If Scenario Simulation', () => {
    it('shifts delivery dates and keeps baseline dataset immutable', () => {
      const baseline = getBaselineDataSet()
      const originalDate = baseline.purchaseOrders[0].expectedDeliveryDate

      const simulated = simulateScenario(
        baseline,
        {
          leadTimeDelayDays: 10,
          scrapSurgePercentage: 0,
          expediteDelayedPOs: false,
          alternateSourcingBuffer: false,
        },
        SYSTEM_CUTOFF_DATE
      )

      // Baseline should NOT be mutated!
      expect(baseline.purchaseOrders[0].expectedDeliveryDate).toBe(originalDate)

      // Active / open POs in simulated dataset should be shifted
      const openSimPO = simulated.purchaseOrders.find((p) => p.status === 'in_transit' || p.status === 'delayed')
      if (openSimPO) {
        const correspondingBase = baseline.purchaseOrders.find((p) => p.id === openSimPO.id)!
        const expectedShifted = addDaysToDate(correspondingBase.expectedDeliveryDate, 10)
        expect(openSimPO.expectedDeliveryDate).toBe(expectedShifted)
      }
    })

    it('simulates scrap surge and reduces usable on-hand inventory', () => {
      const baseline = getBaselineDataSet()
      const originalStock = baseline.components[0].onHandQuantity

      const simulated = simulateScenario(
        baseline,
        {
          leadTimeDelayDays: 0,
          scrapSurgePercentage: 10,
          expediteDelayedPOs: false,
          alternateSourcingBuffer: false,
        },
        SYSTEM_CUTOFF_DATE
      )

      expect(simulated.components[0].onHandQuantity).toBeLessThan(originalStock)
      expect(baseline.components[0].onHandQuantity).toBe(originalStock)
    })

    it('simulates air freight expedite on delayed purchase orders', () => {
      const baseline = getBaselineDataSet()
      const delayedPO = baseline.purchaseOrders.find((p) => p.status === 'delayed')
      expect(delayedPO).toBeDefined()

      const simulated = simulateScenario(
        baseline,
        {
          leadTimeDelayDays: 0,
          scrapSurgePercentage: 0,
          expediteDelayedPOs: true,
          alternateSourcingBuffer: false,
        },
        SYSTEM_CUTOFF_DATE
      )

      const expeditedSimPO = simulated.purchaseOrders.find((p) => p.id === delayedPO!.id)!
      expect(expeditedSimPO.status).toBe('delivered')
      expect(expeditedSimPO.expedited).toBe(true)
      expect(expeditedSimPO.actualDeliveryDate).toBe(SYSTEM_CUTOFF_DATE)
    })

    it('injects dual-sourcing safety buffer for components with secondary vendors', () => {
      const baseline = getBaselineDataSet()
      const dualSourcedComp = baseline.components.find((c) => c.secondarySupplierIds.length > 0)!

      const simulated = simulateScenario(
        baseline,
        {
          leadTimeDelayDays: 0,
          scrapSurgePercentage: 0,
          expediteDelayedPOs: false,
          alternateSourcingBuffer: true,
        },
        SYSTEM_CUTOFF_DATE
      )

      const simComp = simulated.components.find((c) => c.id === dualSourcedComp.id)!
      expect(simComp.onHandQuantity).toBeGreaterThan(dualSourcedComp.onHandQuantity)
    })
  })

  describe('Operational Recommendation Generation', () => {
    it('generates prioritized, explainable recommendations from domain bottlenecks', () => {
      const baseline = getBaselineDataSet()
      const shortages = baseline.components.map((c) =>
        calculateComponentShortage(c, baseline.purchaseOrders, baseline.productionOrders, SYSTEM_CUTOFF_DATE)
      )
      const shortagesMap = new Map(shortages.map((s) => [s.componentId, s]))
      const atRiskOrders = baseline.productionOrders.map((o) =>
        assessProductionOrderRisk(o, shortagesMap, SYSTEM_CUTOFF_DATE)
      )
      const supplierAssessments = baseline.suppliers.map((s) =>
        assessSupplierRisk(s, baseline.purchaseOrders, SYSTEM_CUTOFF_DATE)
      )
      const budgetVariances = baseline.budgetRecords.map((b) => calculateBudgetVariance(b))

      const recs = generateOperationalRecommendations(
        baseline,
        shortages,
        atRiskOrders,
        supplierAssessments,
        budgetVariances
      )

      expect(recs.length).toBeGreaterThan(0)
      const criticalRec = recs.find((r) => r.priority === 'critical')
      expect(criticalRec).toBeDefined()
      expect(criticalRec?.rootCause).toBeTruthy()
      expect(criticalRec?.suggestedAction).toBeTruthy()
      expect(criticalRec?.actionable).toBe(true)
    })
  })

  describe('Chart Aggregation Utilities', () => {
    it('produces valid OTD trend points', () => {
      const baseline = getBaselineDataSet()
      const trend = getOTDTrendData(baseline.purchaseOrders, SYSTEM_CUTOFF_DATE)
      expect(trend.length).toBe(6)
      expect(trend[5].otdPercentage).toBeGreaterThan(0)
      expect(trend[0].target).toBe(90.0)
    })

    it('aggregates defect categories accurately', () => {
      const baseline = getBaselineDataSet()
      const defectPoints = getDefectCategoryData(baseline.qualityRecords)
      expect(defectPoints.length).toBeGreaterThan(0)
      const dimensional = defectPoints.find((d) => d.defectType === 'DIMENSIONAL')
      expect(dimensional).toBeDefined()
    })

    it('formats budget categories for visualization', () => {
      const baseline = getBaselineDataSet()
      const budgetPoints = getBudgetCategoryData(baseline.budgetRecords)
      expect(budgetPoints.length).toBe(baseline.budgetRecords.length)
      expect(budgetPoints[0].budget).toBeGreaterThan(0)
    })
  })

  describe('Baseline Synthetic Dataset Integration', () => {
    it('ingests baseline fixtures and computes executive KPIs without error', () => {
      const dataSet = getBaselineDataSet()
      expect(dataSet.suppliers.length).toBeGreaterThan(0)
      expect(dataSet.components.length).toBeGreaterThan(0)
      expect(dataSet.purchaseOrders.length).toBeGreaterThan(0)
      expect(dataSet.productionOrders.length).toBeGreaterThan(0)

      const kpis = calculateExecutiveKPIs(dataSet, SYSTEM_CUTOFF_DATE)
      expect(kpis.totalDueOrders).toBeGreaterThan(0)
      expect(kpis.totalComponentsEvaluated).toBe(dataSet.components.length)
      expect(kpis.totalProductionOrders).toBe(dataSet.productionOrders.length)
      expect(kpis.fleetOTDPercentage).toBeGreaterThan(0)
    })
  })
})
