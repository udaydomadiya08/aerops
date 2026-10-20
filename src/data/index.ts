/**
 * AeroOps Control Tower — Baseline Synthetic Datasets
 * 
 * Provides typed, immutable access to synthetic aerospace fixtures.
 */

import suppliersData from './suppliers.json'
import componentsData from './components.json'
import purchaseOrdersData from './purchaseOrders.json'
import productionOrdersData from './productionOrders.json'
import qualityRecordsData from './qualityRecords.json'
import budgetRecordsData from './budgetRecords.json'

import type {
  Supplier,
  Component,
  PurchaseOrder,
  ProductionOrder,
  QualityRecord,
  BudgetRecord,
  OperationsDataSet,
} from '../types/domain'

export const baselineSuppliers: Supplier[] = suppliersData as Supplier[]
export const baselineComponents: Component[] = componentsData as Component[]
export const baselinePurchaseOrders: PurchaseOrder[] = purchaseOrdersData as PurchaseOrder[]
export const baselineProductionOrders: ProductionOrder[] = productionOrdersData as ProductionOrder[]
export const baselineQualityRecords: QualityRecord[] = qualityRecordsData as QualityRecord[]
export const baselineBudgetRecords: BudgetRecord[] = budgetRecordsData as BudgetRecord[]

export const getBaselineDataSet = (): OperationsDataSet => ({
  suppliers: [...baselineSuppliers],
  components: [...baselineComponents],
  purchaseOrders: [...baselinePurchaseOrders],
  productionOrders: [...baselineProductionOrders],
  qualityRecords: [...baselineQualityRecords],
  budgetRecords: [...baselineBudgetRecords],
})

export const SYSTEM_CUTOFF_DATE = '2026-10-15'
