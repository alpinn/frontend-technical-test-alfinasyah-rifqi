export type Role = 'USER' | 'APPROVER'

export type CurrentUser = {
  id: string
  name: string
  jobTitle: string
  initials: string
  role: Role
}

export type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type PurchaseOrderStatus =
  'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'

export type InventoryMovementType = 'PURCHASE_RECEIPT' | 'ADJUSTMENT'

export type Warehouse = {
  id: string
  code: string
  name: string
  city: string
}

export type Product = {
  id: string
  sku: string
  name: string
  unit: string
  category: string
}

export type Supplier = {
  id: string
  name: string
}

export type ProductRef = Pick<Product, 'id' | 'sku' | 'name' | 'unit'>
export type WarehouseRef = Pick<Warehouse, 'id' | 'code' | 'name'>
export type SupplierRef = Pick<Supplier, 'id' | 'name'>

export type PurchaseRequestItem = {
  id: string
  product: ProductRef
  quantity: number
}

export type PurchaseRequestSummary = {
  id: string
  requestNumber: string
  warehouse: WarehouseRef
  requestedBy: string
  status: PurchaseRequestStatus
  totalItems: number
  createdAt: string
}

export type PurchaseRequest = PurchaseRequestSummary & {
  items: PurchaseRequestItem[]
  notes: string | null
  submittedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  purchaseOrderId: string | null
  purchaseOrderNumber: string | null
}

export type PurchaseOrderItem = {
  id: string
  product: ProductRef
  orderedQuantity: number
  receivedQuantity: number
}

export type PurchaseOrderSummary = {
  id: string
  orderNumber: string
  supplier: SupplierRef
  warehouse: WarehouseRef
  status: PurchaseOrderStatus
  totalItems: number
  createdAt: string
}

export type PurchaseOrder = PurchaseOrderSummary & {
  items: PurchaseOrderItem[]
  purchaseRequestId: string | null
  purchaseRequestNumber: string | null
  expectedDate: string | null
  receipts: GoodsReceipt[]
}

export type GoodsReceiptLine = {
  product: ProductRef
  quantity: number
}

export type GoodsReceipt = {
  id: string
  receiptNumber: string
  purchaseOrderId: string
  purchaseOrderNumber: string
  receivedBy: string
  receivedAt: string
  lines: GoodsReceiptLine[]
}

export type InventoryItem = {
  id: string
  product: ProductRef
  warehouse: WarehouseRef
  currentStock: number
}

export type InventoryMovement = {
  id: string
  type: InventoryMovementType
  quantity: number
  reference: string
  occurredAt: string
}

export type ActivityKind =
  'PR_SUBMITTED' | 'PR_APPROVED' | 'PR_REJECTED' | 'PO_CREATED' | 'GOODS_RECEIVED'

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  title: string
  description: string
  occurredAt: string
}

export type DashboardSummary = {
  totalPurchaseRequests: number
  waitingForApproval: number
  activePurchaseOrders: number
  partiallyReceivedOrders: number
  createdThisMonth: number
  expectedThisWeek: number
  recentActivity: ActivityEntry[]
}

export type PageMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  meta: PageMeta
}

export type ApiErrorBody = {
  message: string
  fieldErrors?: Record<string, string>
}

export type CreatePurchaseRequestInput = {
  warehouseId: string
  notes?: string
  items: { productId: string; quantity: number }[]
}

export type ReceiveGoodsInput = {
  lines: { productId: string; quantity: number }[]
}
