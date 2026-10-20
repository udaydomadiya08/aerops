import { describe, it, expect } from 'vitest'
import {
  calculateSupplierOTD,
  calculateFleetOTD,
  calculateDefectRate,
  calculateComponentShortage,
  assessProductionOrderRisk,
  calculateBudgetVariance,
  simulateScenario,
  addDaysToDate,
} from '../calculations'
import type {
  Component,
  PurchaseOrder,
  ProductionOrder,
  BudgetRecord,
} from '../../types/domain'
import { getBaselineDataSet, SYSTEM_CUTOFF_DATE } from '../../data'

describe('Edge Cases & Independent Numerical Validations', () => {
  describe('Supplier OTD & Eligibility Edge Cases', () => {
    it('handles exact boundary: PO due exactly on cutoff date is eligible', () => {
      const pos: PurchaseOrder[] = [
        {
          id: 'PO-EXACT-CUTOFF',
          supplierId: 'SUP-BOUND',
          componentId: 'CMP-1',
          orderedQuantity: 10,
          receivedQuantity: 10,
          orderDate: '2026-10-01',
          expectedDeliveryDate: '2026-10-15', // Same as cutoff
          actualDeliveryDate: '2026-10-15',
          status: 'delivered',
          expedited: false,
        },
      ]
      const result = calculateSupplierOTD(pos, 'SUP-BOUND', 'Boundary Supplier', '2026-10-15')
      expect(result.eligibleDueOrders).toBe(1)
      expect(result.onTimeOrders).toBe(1)
      expect(result.otdPercentage).toBe(100.0)
    })

    it('handles in-transit PO past expected date (overdue) as an eligible late order', () => {
      const pos: PurchaseOrder[] = [
        {
          id: 'PO-OVERDUE-TRANSIT',
          supplierId: 'SUP-LATE',
          componentId: 'CMP-1',
          orderedQuantity: 20,
          receivedQuantity: 0,
          orderDate: '2026-09-01',
          expectedDeliveryDate: '2026-10-10', // Due 5 days before cutoff!
          actualDeliveryDate: null,
          status: 'delayed',
          expedited: false,
        },
      ]
      const result = calculateSupplierOTD(pos, 'SUP-LATE', 'Late Supplier', '2026-10-15')
      expect(result.eligibleDueOrders).toBe(1)
      expect(result.onTimeOrders).toBe(0)
      expect(result.otdPercentage).toBe(0.0)
    })

    it('ignores orders for different suppliers when filtering by supplierId', () => {
      const pos: PurchaseOrder[] = [
        {
          id: 'PO-SUP1',
          supplierId: 'SUP-1',
          componentId: 'CMP-1',
          orderedQuantity: 10,
          receivedQuantity: 10,
          orderDate: '2026-09-01',
          expectedDeliveryDate: '2026-09-15',
          actualDeliveryDate: '2026-09-15',
          status: 'delivered',
          expedited: false,
        },
        {
          id: 'PO-SUP2',
          supplierId: 'SUP-2',
          componentId: 'CMP-1',
          orderedQuantity: 10,
          receivedQuantity: 0,
          orderDate: '2026-09-01',
          expectedDeliveryDate: '2026-09-15',
          actualDeliveryDate: null,
          status: 'delayed',
          expedited: false,
        },
      ]
      const result = calculateSupplierOTD(pos, 'SUP-1', 'Supplier 1', '2026-10-15')
      expect(result.eligibleDueOrders).toBe(1)
      expect(result.onTimeOrders).toBe(1)
      expect(result.otdPercentage).toBe(100.0)
    })

    it('calculates fleet OTD with empty PO array without throwing', () => {
      const result = calculateFleetOTD([], '2026-10-15')
      expect(result.totalDueOrders).toBe(0)
      expect(result.totalOnTimeOrders).toBe(0)
      expect(result.fleetOTDPercentage).toBe(100.0)
    })
  })

  describe('Defect Rates Edge Cases', () => {
    it('handles 0 inspected and 0 rejected without throwing NaN', () => {
      const result = calculateDefectRate(0, 0)
      expect(result.defectPercentage).toBe(0.0)
      expect(result.hasInspections).toBe(false)
    })

    it('handles 100% defect rate (all rejected)', () => {
      const result = calculateDefectRate(50, 50)
      expect(result.defectPercentage).toBe(100.0)
      expect(result.hasInspections).toBe(true)
    })

    it('handles negative inputs safely by clamping to zero', () => {
      const result = calculateDefectRate(-100, -10)
      expect(result.inspectedUnits).toBe(0)
      expect(result.rejectedUnits).toBe(0)
      expect(result.defectPercentage).toBe(0.0)
      expect(result.hasInspections).toBe(false)
    })

    it('clamps rejected units if greater than inspected units', () => {
      const result = calculateDefectRate(100, 250)
      expect(result.rejectedUnits).toBe(100)
      expect(result.defectPercentage).toBe(100.0)
    })
  })

  describe('Component Shortage & Need Date Temporal Validation', () => {
    const testComponent: Component = {
      id: 'CMP-TEST-EDGE',
      name: 'High Precision Sensor',
      category: 'Avionics',
      unitOfMeasure: 'EA',
      onHandQuantity: 5,
      allocatedQuantity: 3, // freeOnHand = 2
      reorderThreshold: 10,
      safetyStock: 8,
      leadTimeDays: 20,
      primarySupplierId: 'SUP-AV',
      secondarySupplierIds: [],
      unitCostUSD: 1200,
    }

    it('excludes completed and cancelled production orders from gross requirements', () => {
      const prodOrders: ProductionOrder[] = [
        {
          id: 'PRD-COMPLETED',
          assemblyCode: 'ASY-1',
          assemblyName: 'Finished Assembly',
          plannedQuantity: 10,
          completedQuantity: 10,
          plannedStartDate: '2026-10-01',
          requiredCompletionDate: '2026-10-10',
          billOfMaterials: [{ componentId: 'CMP-TEST-EDGE', quantityPerAssembly: 5 }],
          status: 'completed',
          priority: 'standard',
        },
        {
          id: 'PRD-CANCELLED',
          assemblyCode: 'ASY-2',
          assemblyName: 'Cancelled Order',
          plannedQuantity: 10,
          completedQuantity: 0,
          plannedStartDate: '2026-10-01',
          requiredCompletionDate: '2026-10-10',
          billOfMaterials: [{ componentId: 'CMP-TEST-EDGE', quantityPerAssembly: 5 }],
          status: 'cancelled',
          priority: 'standard',
        },
      ]

      const shortage = calculateComponentShortage(testComponent, [], prodOrders, '2026-10-15')
      expect(shortage.grossRequirement).toBe(0)
      expect(shortage.netShortage).toBe(0)
      expect(shortage.isShortage).toBe(false)
    })

    it('properly accumulates gross requirements across multiple active production orders', () => {
      const prodOrders: ProductionOrder[] = [
        {
          id: 'PRD-ACT-1',
          assemblyCode: 'ASY-1',
          assemblyName: 'Assembly 1',
          plannedQuantity: 2,
          completedQuantity: 0,
          plannedStartDate: '2026-10-20',
          requiredCompletionDate: '2026-11-01',
          billOfMaterials: [{ componentId: 'CMP-TEST-EDGE', quantityPerAssembly: 3 }], // 6 needed
          status: 'scheduled',
          priority: 'standard',
        },
        {
          id: 'PRD-ACT-2',
          assemblyCode: 'ASY-2',
          assemblyName: 'Assembly 2',
          plannedQuantity: 1,
          completedQuantity: 0,
          plannedStartDate: '2026-10-25',
          requiredCompletionDate: '2026-11-05',
          billOfMaterials: [{ componentId: 'CMP-TEST-EDGE', quantityPerAssembly: 4 }], // 4 needed
          status: 'in_progress',
          priority: 'high',
        },
      ]

      // freeOnHand is 2. Gross req is 6 + 4 = 10.
      // Earliest need date is 2026-10-20.
      const shortage = calculateComponentShortage(testComponent, [], prodOrders, '2026-10-15')
      expect(shortage.grossRequirement).toBe(10)
      expect(shortage.freeOnHand).toBe(2)
      expect(shortage.netShortage).toBe(8)
      expect(shortage.shortageValueUSD).toBe(8 * 1200)
      expect(shortage.earliestNeedDate).toBe('2026-10-20')
    })

    it('credits receipt arriving on the EXACT DAY of production start', () => {
      const prodOrders: ProductionOrder[] = [
        {
          id: 'PRD-ACT-1',
          assemblyCode: 'ASY-1',
          assemblyName: 'Assembly 1',
          plannedQuantity: 1,
          completedQuantity: 0,
          plannedStartDate: '2026-10-20',
          requiredCompletionDate: '2026-11-01',
          billOfMaterials: [{ componentId: 'CMP-TEST-EDGE', quantityPerAssembly: 10 }], // 10 needed
          status: 'scheduled',
          priority: 'standard',
        },
      ]

      const poArrivingSameDay: PurchaseOrder = {
        id: 'PO-SAME-DAY',
        supplierId: 'SUP-AV',
        componentId: 'CMP-TEST-EDGE',
        orderedQuantity: 8,
        receivedQuantity: 0,
        orderDate: '2026-09-01',
        expectedDeliveryDate: '2026-10-20', // Same day as plannedStartDate
        actualDeliveryDate: null,
        status: 'in_transit',
        expedited: false,
      }

      const shortage = calculateComponentShortage(testComponent, [poArrivingSameDay], prodOrders, '2026-10-15')
      // freeOnHand = 2, validReceipt = 8. Total available = 10. Gross req = 10.
      expect(shortage.validScheduledReceipts).toBe(8)
      expect(shortage.netShortage).toBe(0)
      expect(shortage.isShortage).toBe(false)
    })

    it('disqualifies receipt arriving ONE DAY AFTER production start', () => {
      const prodOrders: ProductionOrder[] = [
        {
          id: 'PRD-ACT-1',
          assemblyCode: 'ASY-1',
          assemblyName: 'Assembly 1',
          plannedQuantity: 1,
          completedQuantity: 0,
          plannedStartDate: '2026-10-20',
          requiredCompletionDate: '2026-11-01',
          billOfMaterials: [{ componentId: 'CMP-TEST-EDGE', quantityPerAssembly: 10 }], // 10 needed
          status: 'scheduled',
          priority: 'standard',
        },
      ]

      const poArrivingOneDayLate: PurchaseOrder = {
        id: 'PO-ONE-DAY-LATE',
        supplierId: 'SUP-AV',
        componentId: 'CMP-TEST-EDGE',
        orderedQuantity: 8,
        receivedQuantity: 0,
        orderDate: '2026-09-01',
        expectedDeliveryDate: '2026-10-21', // 1 day after need date!
        actualDeliveryDate: null,
        status: 'in_transit',
        expedited: false,
      }

      const shortage = calculateComponentShortage(testComponent, [poArrivingOneDayLate], prodOrders, '2026-10-15')
      expect(shortage.validScheduledReceipts).toBe(0)
      expect(shortage.netShortage).toBe(8)
      expect(shortage.isShortage).toBe(true)
    })

    it('handles negative or allocated > onHand gracefully', () => {
      const corruptedComponent: Component = {
        ...testComponent,
        onHandQuantity: 5,
        allocatedQuantity: 15, // Allocated > on-hand!
      }
      const shortage = calculateComponentShortage(corruptedComponent, [], [], '2026-10-15')
      expect(shortage.freeOnHand).toBe(0) // Clamped to zero
      expect(shortage.isBelowSafetyStock).toBe(true)
    })
  })

  describe('Production Order Risk Edge Cases', () => {
    it('does NOT flag pacing lag if order is 100% completed even if past start date', () => {
      const completedOrder: ProductionOrder = {
        id: 'PRD-COMP-PANE',
        assemblyCode: 'ASY-CAB',
        assemblyName: 'Cabin Panel',
        plannedQuantity: 5,
        completedQuantity: 5,
        plannedStartDate: '2026-10-01',
        requiredCompletionDate: '2026-10-14',
        billOfMaterials: [],
        status: 'completed',
        priority: 'standard',
      }
      const assessment = assessProductionOrderRisk(completedOrder, new Map(), '2026-10-15')
      expect(assessment.isAtRisk).toBe(false)
      expect(assessment.severity).toBe('healthy')
      expect(assessment.riskReasons.length).toBe(0)
    })

    it('flags past-due unfinished order with critical severity', () => {
      const pastDueOrder: ProductionOrder = {
        id: 'PRD-PAST-DUE',
        assemblyCode: 'ASY-CAB',
        assemblyName: 'Cabin Panel',
        plannedQuantity: 10,
        completedQuantity: 2,
        plannedStartDate: '2026-09-01',
        requiredCompletionDate: '2026-10-10', // 5 days past cutoff!
        billOfMaterials: [],
        status: 'in_progress',
        priority: 'high',
      }
      const assessment = assessProductionOrderRisk(pastDueOrder, new Map(), '2026-10-15')
      expect(assessment.isAtRisk).toBe(true)
      expect(assessment.severity).toBe('critical')
      expect(assessment.riskReasons.some((r) => r.includes('Passed required date'))).toBe(true)
    })
  })

  describe('Budget Variance Zero-Denominator & Negative Exposure', () => {
    it('zero budget with zero actual expenditure returns 0% variance and not over-budget', () => {
      const record: BudgetRecord = {
        id: 'BDG-ZERO-BOTH',
        period: '2026-Q3',
        category: 'Miscellaneous',
        budgetAmount: 0,
        actualExpenditure: 0,
      }
      const result = calculateBudgetVariance(record)
      expect(result.varianceUSD).toBe(0)
      expect(result.variancePercentage).toBe(0.0)
      expect(result.isOverBudget).toBe(false)
    })

    it('zero budget with positive expenditure returns +100% variance and over-budget', () => {
      const record: BudgetRecord = {
        id: 'BDG-UNBUDGETED',
        period: '2026-Q3',
        category: 'Spot Freight',
        budgetAmount: 0,
        actualExpenditure: 12500,
      }
      const result = calculateBudgetVariance(record)
      expect(result.varianceUSD).toBe(12500)
      expect(result.variancePercentage).toBe(100.0)
      expect(result.isOverBudget).toBe(true)
    })

    it('handles exact zero variance (budget = actual)', () => {
      const record: BudgetRecord = {
        id: 'BDG-EXACT',
        period: '2026-Q3',
        category: 'Precision Hardware',
        budgetAmount: 40000,
        actualExpenditure: 40000,
      }
      const result = calculateBudgetVariance(record)
      expect(result.varianceUSD).toBe(0)
      expect(result.variancePercentage).toBe(0.0)
      expect(result.isOverBudget).toBe(false)
    })
  })

  describe('What-If Simulation Boundary & Repeatability', () => {
    it('handles 0% changes as a true identity operation (values equal baseline)', () => {
      const baseline = getBaselineDataSet()
      const simulated = simulateScenario(
        baseline,
        {
          leadTimeDelayDays: 0,
          scrapSurgePercentage: 0,
          expediteDelayedPOs: false,
          alternateSourcingBuffer: false,
        },
        SYSTEM_CUTOFF_DATE
      )

      expect(simulated.components.length).toBe(baseline.components.length)
      expect(simulated.purchaseOrders.length).toBe(baseline.purchaseOrders.length)
      expect(simulated.components[0].onHandQuantity).toBe(baseline.components[0].onHandQuantity)
      expect(simulated.purchaseOrders[0].expectedDeliveryDate).toBe(baseline.purchaseOrders[0].expectedDeliveryDate)
    })

    it('preserves deep immutability when simulateScenario is called repeatedly in succession', () => {
      const baseline = getBaselineDataSet()
      const originalFirstOnHand = baseline.components[0].onHandQuantity
      const originalFirstPODate = baseline.purchaseOrders[0].expectedDeliveryDate

      // Run multiple severe simulations sequentially
      simulateScenario(baseline, { leadTimeDelayDays: 30, scrapSurgePercentage: 25, expediteDelayedPOs: true, alternateSourcingBuffer: true }, SYSTEM_CUTOFF_DATE)
      simulateScenario(baseline, { leadTimeDelayDays: 14, scrapSurgePercentage: 15, expediteDelayedPOs: false, alternateSourcingBuffer: false }, SYSTEM_CUTOFF_DATE)
      simulateScenario(baseline, { leadTimeDelayDays: 60, scrapSurgePercentage: 50, expediteDelayedPOs: true, alternateSourcingBuffer: false }, SYSTEM_CUTOFF_DATE)

      // Verify baseline untouched
      expect(baseline.components[0].onHandQuantity).toBe(originalFirstOnHand)
      expect(baseline.purchaseOrders[0].expectedDeliveryDate).toBe(originalFirstPODate)
    })

    it('clamps 100% scrap surge so on-hand does not drop below zero', () => {
      const baseline = getBaselineDataSet()
      const simulated = simulateScenario(
        baseline,
        {
          leadTimeDelayDays: 0,
          scrapSurgePercentage: 100, // Maximum scrap
          expediteDelayedPOs: false,
          alternateSourcingBuffer: false,
        },
        SYSTEM_CUTOFF_DATE
      )

      for (const comp of simulated.components) {
        expect(comp.onHandQuantity).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Date Arithmetic Utility addDaysToDate', () => {
    it('accurately crosses month boundaries including leap years', () => {
      // 2028 is a leap year; Feb has 29 days
      const leapResult = addDaysToDate('2028-02-28', 2)
      expect(leapResult).toBe('2028-03-01')

      // Standard month roll-forward
      const monthRoll = addDaysToDate('2026-10-25', 10)
      expect(monthRoll).toBe('2026-11-04')

      // Year roll-forward
      const yearRoll = addDaysToDate('2026-12-25', 10)
      expect(yearRoll).toBe('2027-01-04')
    })
  })
})
