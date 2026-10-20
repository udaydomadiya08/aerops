/**
 * AeroOps Control Tower — Domain Type Definitions
 * 
 * Strict TypeScript types for aerospace manufacturing operations:
 * Suppliers, Components/Inventory, Purchase Orders, Production Orders,
 * Quality Inspection Records, and Procurement Budgets.
 */

export type SupplierTier = 'Tier 1' | 'Tier 2'
export type SupplierStatus = 'active' | 'watch' | 'critical'

export interface Supplier {
  id: string
  name: string
  tier: SupplierTier
  category: string
  location: string
  suppliedComponentIds: string[]
  ordersPlaced: number
  ordersDeliveredOnTime: number
  totalUnitsReceived: number
  rejectedUnits: number
  leadTimeDaysAvg: number
  contractedLeadTimeDays: number
  status: SupplierStatus
}

export type ComponentCategory =
  | 'Structural'
  | 'Fasteners'
  | 'Avionics'
  | 'Composites'
  | 'Propulsion'

export type UnitOfMeasure = 'EA' | 'KG' | 'M' | 'SET'

export interface Component {
  id: string
  name: string
  category: ComponentCategory
  unitOfMeasure: UnitOfMeasure
  onHandQuantity: number
  allocatedQuantity: number
  reorderThreshold: number
  safetyStock: number
  leadTimeDays: number
  primarySupplierId: string
  secondarySupplierIds: string[]
  unitCostUSD: number
}

export type PurchaseOrderStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'cancelled'

export interface PurchaseOrder {
  id: string
  supplierId: string
  componentId: string
  orderedQuantity: number
  receivedQuantity: number
  orderDate: string // ISO 8601 YYYY-MM-DD
  expectedDeliveryDate: string // ISO 8601 YYYY-MM-DD
  actualDeliveryDate: string | null // ISO 8601 or null
  status: PurchaseOrderStatus
  expedited: boolean
}

export type ProductionOrderStatus =
  | 'scheduled'
  | 'in_progress'
  | 'delayed'
  | 'completed'
  | 'on_hold'

export type ProductionOrderPriority = 'standard' | 'high' | 'critical_aog'

export interface BOMItem {
  componentId: string
  quantityPerAssembly: number
}

export interface ProductionOrder {
  id: string
  assemblyCode: string
  assemblyName: string
  plannedQuantity: number
  completedQuantity: number
  plannedStartDate: string // ISO 8601 YYYY-MM-DD
  requiredCompletionDate: string // ISO 8601 YYYY-MM-DD
  billOfMaterials: BOMItem[]
  status: ProductionOrderStatus
  priority: ProductionOrderPriority
}

export type DefectType =
  | 'dimensional'
  | 'metallurgical'
  | 'surface_finish'
  | 'documentation'
  | 'none'

export type QualityDisposition = 'accepted' | 'rework' | 'scrap' | 'concession'

export interface QualityRecord {
  id: string
  referenceType: 'purchase_order' | 'production_order'
  referenceId: string
  componentId: string
  inspectedQuantity: number
  rejectedQuantity: number
  inspectionDate: string // ISO 8601 YYYY-MM-DD
  defectType: DefectType
  disposition: QualityDisposition
}

export interface BudgetRecord {
  id: string
  period: string // e.g. "2026-Q1"
  category: string
  budgetAmount: number
  actualExpenditure: number
}

export interface OperationsDataSet {
  suppliers: Supplier[]
  components: Component[]
  purchaseOrders: PurchaseOrder[]
  productionOrders: ProductionOrder[]
  qualityRecords: QualityRecord[]
  budgetRecords: BudgetRecord[]
}
