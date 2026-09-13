import {
  APPROVER_NAME,
  INITIAL_STOCK,
  products,
  REQUESTERS,
  suppliers,
  warehouses,
} from '@/mocks/seed'
import type {
  ActivityEntry,
  ActivityKind,
  CreatePurchaseRequestInput,
  GoodsReceipt,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  ProductRef,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderSummary,
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchaseRequestSummary,
  SupplierRef,
  WarehouseRef,
} from '@/types'

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type PurchaseRequestRecord = {
  id: string
  requestNumber: string
  warehouseId: string
  requestedBy: string
  status: PurchaseRequestStatus
  items: { id: string; productId: string; quantity: number }[]
  notes: string | null
  createdAt: string
  submittedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  purchaseOrderId: string | null
}

type PurchaseOrderRecord = {
  id: string
  orderNumber: string
  supplierId: string
  warehouseId: string
  status: PurchaseOrderStatus
  items: {
    id: string
    productId: string
    orderedQuantity: number
    receivedQuantity: number
  }[]
  purchaseRequestId: string | null
  createdAt: string
  expectedDate: string | null
}

type GoodsReceiptRecord = {
  id: string
  receiptNumber: string
  purchaseOrderId: string
  receivedBy: string
  receivedAt: string
  lines: { productId: string; quantity: number }[]
}

type StockRecord = {
  id: string
  productId: string
  warehouseId: string
  currentStock: number
}

type MovementRecord = {
  id: string
  stockId: string
  type: InventoryMovementType
  quantity: number
  reference: string
  occurredAt: string
}

type Database = {
  purchaseRequests: PurchaseRequestRecord[]
  purchaseOrders: PurchaseOrderRecord[]
  goodsReceipts: GoodsReceiptRecord[]
  stock: StockRecord[]
  movements: MovementRecord[]
  activity: ActivityEntry[]
  sequences: { pr: number; po: number; gr: number }
}

const HOUR = 60 * 60 * 1000

function emptyDatabase(): Database {
  return {
    purchaseRequests: [],
    purchaseOrders: [],
    goodsReceipts: [],
    stock: [],
    movements: [],
    activity: [],
    sequences: { pr: 0, po: 0, gr: 0 },
  }
}

let db: Database = emptyDatabase()
seed()

export function resetDb() {
  db = emptyDatabase()
  seed()
}

function pad(value: number, length: number) {
  return String(value).padStart(length, '0')
}

function nextNumber(kind: keyof Database['sequences'], prefix: string) {
  db.sequences[kind] += 1
  return `${prefix}-2026-${pad(db.sequences[kind], 4)}`
}

function findProduct(productId: string) {
  const product = products.find((entry) => entry.id === productId)
  if (!product) throw new ApiError(422, `Unknown product: ${productId}`)
  return product
}

function findWarehouse(warehouseId: string) {
  const warehouse = warehouses.find((entry) => entry.id === warehouseId)
  if (!warehouse) throw new ApiError(422, `Unknown warehouse: ${warehouseId}`)
  return warehouse
}

function toProductRef(productId: string): ProductRef {
  const { id, sku, name, unit } = findProduct(productId)
  return { id, sku, name, unit }
}

function toWarehouseRef(warehouseId: string): WarehouseRef {
  const { id, code, name } = findWarehouse(warehouseId)
  return { id, code, name }
}

function toSupplierRef(supplierId: string): SupplierRef {
  const supplier = suppliers.find((entry) => entry.id === supplierId)
  if (!supplier) throw new ApiError(422, `Unknown supplier: ${supplierId}`)
  return { id: supplier.id, name: supplier.name }
}

function logActivity(kind: ActivityKind, title: string, description: string, at: string) {
  db.activity.unshift({
    id: crypto.randomUUID(),
    kind,
    title,
    description,
    occurredAt: at,
  })
}

function stockRowFor(productId: string, warehouseId: string) {
  const row = db.stock.find(
    (entry) => entry.productId === productId && entry.warehouseId === warehouseId,
  )
  if (row) return row
  const created: StockRecord = {
    id: `stk-${warehouseId}-${productId}`,
    productId,
    warehouseId,
    currentStock: 0,
  }
  db.stock.push(created)
  return created
}

function applyMovement(
  productId: string,
  warehouseId: string,
  quantity: number,
  type: InventoryMovementType,
  reference: string,
  occurredAt: string,
) {
  const row = stockRowFor(productId, warehouseId)
  row.currentStock += quantity
  db.movements.push({
    id: `mov-${db.movements.length + 1}`,
    stockId: row.id,
    type,
    quantity,
    reference,
    occurredAt,
  })
}

function statusPlan(): PurchaseRequestStatus[] {
  const submitted = new Set([26, 29, 32, 35, 38, 41, 44, 47])
  const draft = new Set([30, 33, 36, 39, 42, 45])
  const rejected = new Set([31, 34, 37, 40, 43])

  return Array.from({ length: 48 }, (_, index) => {
    if (submitted.has(index)) return 'SUBMITTED'
    if (draft.has(index)) return 'DRAFT'
    if (rejected.has(index)) return 'REJECTED'
    return 'APPROVED'
  })
}

function orderStatusPlan(position: number): PurchaseOrderStatus {
  if (position < 6) return 'RECEIVED'
  if (position < 8) return 'CANCELLED'
  if (position < 13) return 'PARTIALLY_RECEIVED'
  return 'ORDERED'
}

function seedItemCount(index: number) {
  if (index === 47) return 4
  if (index === 46) return 2
  if (index === 45) return 6
  return 1 + (index % 4)
}

function seedWarehouseId(index: number) {
  if (index === 47 || index === 45) return 'wh-main'
  if (index === 46) return 'wh-jkt'
  return warehouses[index % warehouses.length].id
}

function seedRequester(index: number) {
  if (index === 47) return 'John Doe'
  if (index === 46) return 'Daniel Wong'
  if (index === 45) return 'Aditya Putra'
  return REQUESTERS[index % REQUESTERS.length]
}

function seedStock(now: number) {
  for (const [warehouseIndex, warehouse] of warehouses.entries()) {
    for (const [offset, product] of products.entries()) {
      const opening = Math.max(0, INITIAL_STOCK[product.id] - offset * 4 - warehouseIndex * 9)
      const row = stockRowFor(product.id, warehouse.id)
      row.currentStock = opening
      db.movements.push({
        id: `mov-open-${warehouse.id}-${product.id}`,
        stockId: row.id,
        type: 'ADJUSTMENT',
        quantity: opening,
        reference: 'Opening balance',
        occurredAt: new Date(now - 45 * 24 * HOUR).toISOString(),
      })
    }
  }
}

function seedPurchaseRequest(index: number, status: PurchaseRequestStatus, now: number) {
  const itemCount = seedItemCount(index)
  const items = Array.from({ length: itemCount }, (_, slot) => ({
    id: `pri-${index + 1}-${slot + 1}`,
    productId: products[(index * 3 + slot * 3) % products.length].id,
    quantity: 10 * (1 + ((index + slot) % 10)),
  }))
  const decidedAt = new Date(now - (47 - index) * 12 * HOUR).toISOString()

  const record: PurchaseRequestRecord = {
    id: `pr-${pad(index + 1, 4)}`,
    requestNumber: nextNumber('pr', 'PR'),
    warehouseId: seedWarehouseId(index),
    requestedBy: seedRequester(index),
    status,
    items,
    notes: null,
    createdAt: new Date(now - (47 - index) * 14 * HOUR).toISOString(),
    submittedAt: status === 'DRAFT' ? null : new Date(now - (47 - index) * 13 * HOUR).toISOString(),
    approvedBy: status === 'APPROVED' ? APPROVER_NAME : null,
    approvedAt: status === 'APPROVED' ? decidedAt : null,
    rejectedBy: status === 'REJECTED' ? APPROVER_NAME : null,
    rejectedAt: status === 'REJECTED' ? decidedAt : null,
    rejectionReason:
      status === 'REJECTED' ? 'Budget for this quarter has already been allocated.' : null,
    purchaseOrderId: null,
  }
  db.purchaseRequests.push(record)
  return record
}

function seedPurchaseOrder(
  record: PurchaseRequestRecord,
  index: number,
  position: number,
  now: number,
) {
  const orderStatus = orderStatusPlan(position)
  const order: PurchaseOrderRecord = {
    id: `po-${pad(position + 1, 4)}`,
    orderNumber: nextNumber('po', 'PO'),
    supplierId: suppliers[position % suppliers.length].id,
    warehouseId: record.warehouseId,
    status: orderStatus === 'CANCELLED' ? 'CANCELLED' : 'ORDERED',
    items: record.items.map((item, slot) => ({
      id: `poi-${position + 1}-${slot + 1}`,
      productId: item.productId,
      orderedQuantity: item.quantity,
      receivedQuantity: 0,
    })),
    purchaseRequestId: record.id,
    createdAt: new Date(now - (47 - index) * 11 * HOUR).toISOString(),
    expectedDate: new Date(now + (position % 9) * 24 * HOUR).toISOString(),
  }
  record.purchaseOrderId = order.id
  db.purchaseOrders.push(order)

  if (orderStatus !== 'RECEIVED' && orderStatus !== 'PARTIALLY_RECEIVED') return

  const ratio = orderStatus === 'RECEIVED' ? 1 : 0.6
  receiveGoods(
    order.id,
    order.items.map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Math.floor(item.orderedQuantity * ratio)),
    })),
    record.requestedBy,
    new Date(now - (47 - index) * 10 * HOUR).toISOString(),
  )
}

function seed() {
  const now = Date.now()
  seedStock(now)

  let approvedPosition = 0
  for (const [index, status] of statusPlan().entries()) {
    const record = seedPurchaseRequest(index, status, now)
    if (status !== 'APPROVED') continue
    seedPurchaseOrder(record, index, approvedPosition, now)
    approvedPosition += 1
  }

  seedActivity()
}

function requestActivity(record: PurchaseRequestRecord) {
  if (record.status === 'SUBMITTED' && record.submittedAt) {
    logActivity(
      'PR_SUBMITTED',
      `${record.requestNumber} submitted`,
      `Raised by ${record.requestedBy} for ${findWarehouse(record.warehouseId).name}.`,
      record.submittedAt,
    )
  }
  if (record.status === 'APPROVED' && record.approvedAt) {
    logActivity(
      'PR_APPROVED',
      `${record.requestNumber} approved`,
      `Approved by ${record.approvedBy}.`,
      record.approvedAt,
    )
  }
  if (record.status === 'REJECTED' && record.rejectedAt) {
    logActivity(
      'PR_REJECTED',
      `${record.requestNumber} rejected`,
      `Rejected by ${record.rejectedBy}.`,
      record.rejectedAt,
    )
  }
}

function seedActivity() {
  db.activity = []
  db.purchaseRequests.slice(-14).forEach(requestActivity)

  for (const order of db.purchaseOrders.slice(-6)) {
    logActivity(
      'PO_CREATED',
      `${order.orderNumber} ordered`,
      `Sent to ${toSupplierRef(order.supplierId).name}.`,
      order.createdAt,
    )
  }

  for (const receipt of db.goodsReceipts.slice(-6)) {
    const order = db.purchaseOrders.find((entry) => entry.id === receipt.purchaseOrderId)
    const received = receipt.lines.reduce((total, line) => total + line.quantity, 0)
    const ordered =
      order?.items.reduce((total, item) => total + item.orderedQuantity, 0) ?? received
    logActivity(
      'GOODS_RECEIVED',
      `${receipt.receiptNumber} received`,
      `${received} of ${ordered} units received for ${order?.orderNumber ?? 'order'}.`,
      receipt.receivedAt,
    )
  }

  db.activity.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function hydratePurchaseRequestSummary(
  record: PurchaseRequestRecord,
): PurchaseRequestSummary {
  return {
    id: record.id,
    requestNumber: record.requestNumber,
    warehouse: toWarehouseRef(record.warehouseId),
    requestedBy: record.requestedBy,
    status: record.status,
    totalItems: record.items.length,
    createdAt: record.createdAt,
  }
}

export function hydratePurchaseRequest(record: PurchaseRequestRecord): PurchaseRequest {
  const order = db.purchaseOrders.find((entry) => entry.id === record.purchaseOrderId)
  return {
    ...hydratePurchaseRequestSummary(record),
    items: record.items.map((item) => ({
      id: item.id,
      product: toProductRef(item.productId),
      quantity: item.quantity,
    })),
    notes: record.notes,
    submittedAt: record.submittedAt,
    approvedBy: record.approvedBy,
    approvedAt: record.approvedAt,
    rejectedBy: record.rejectedBy,
    rejectedAt: record.rejectedAt,
    rejectionReason: record.rejectionReason,
    purchaseOrderId: record.purchaseOrderId,
    purchaseOrderNumber: order?.orderNumber ?? null,
  }
}

export function hydratePurchaseOrderSummary(record: PurchaseOrderRecord): PurchaseOrderSummary {
  return {
    id: record.id,
    orderNumber: record.orderNumber,
    supplier: toSupplierRef(record.supplierId),
    warehouse: toWarehouseRef(record.warehouseId),
    status: record.status,
    totalItems: record.items.length,
    createdAt: record.createdAt,
  }
}

function hydrateGoodsReceipt(record: GoodsReceiptRecord): GoodsReceipt {
  const order = db.purchaseOrders.find((entry) => entry.id === record.purchaseOrderId)
  return {
    id: record.id,
    receiptNumber: record.receiptNumber,
    purchaseOrderId: record.purchaseOrderId,
    purchaseOrderNumber: order?.orderNumber ?? '',
    receivedBy: record.receivedBy,
    receivedAt: record.receivedAt,
    lines: record.lines.map((line) => ({
      product: toProductRef(line.productId),
      quantity: line.quantity,
    })),
  }
}

export function hydratePurchaseOrder(record: PurchaseOrderRecord): PurchaseOrder {
  const request = db.purchaseRequests.find((entry) => entry.id === record.purchaseRequestId)
  return {
    ...hydratePurchaseOrderSummary(record),
    items: record.items.map((item) => ({
      id: item.id,
      product: toProductRef(item.productId),
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
    })),
    purchaseRequestId: record.purchaseRequestId,
    purchaseRequestNumber: request?.requestNumber ?? null,
    expectedDate: record.expectedDate,
    receipts: db.goodsReceipts
      .filter((entry) => entry.purchaseOrderId === record.id)
      .map(hydrateGoodsReceipt)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
  }
}

export function hydrateInventoryItem(record: StockRecord): InventoryItem {
  return {
    id: record.id,
    product: toProductRef(record.productId),
    warehouse: toWarehouseRef(record.warehouseId),
    currentStock: record.currentStock,
  }
}

export function listPurchaseRequests() {
  return [...db.purchaseRequests].sort((a, b) => b.requestNumber.localeCompare(a.requestNumber))
}

export function getPurchaseRequest(id: string) {
  const record = db.purchaseRequests.find((entry) => entry.id === id)
  if (!record) throw new ApiError(404, 'Purchase request not found.')
  return record
}

export function listPurchaseOrders() {
  return [...db.purchaseOrders].sort((a, b) => b.orderNumber.localeCompare(a.orderNumber))
}

export function getPurchaseOrder(id: string) {
  const record = db.purchaseOrders.find((entry) => entry.id === id)
  if (!record) throw new ApiError(404, 'Purchase order not found.')
  return record
}

export function listStock() {
  return [...db.stock].sort((a, b) => a.productId.localeCompare(b.productId))
}

export function getStockRow(id: string) {
  const record = db.stock.find((entry) => entry.id === id)
  if (!record) throw new ApiError(404, 'Inventory item not found.')
  return record
}

export function listMovements(stockId: string): InventoryMovement[] {
  return db.movements
    .filter((entry) => entry.stockId === stockId)
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      quantity: entry.quantity,
      reference: entry.reference,
      occurredAt: entry.occurredAt,
    }))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function listActivity() {
  return db.activity
}

function isActiveOrder(order: PurchaseOrderRecord) {
  return order.status === 'ORDERED' || order.status === 'PARTIALLY_RECEIVED'
}

export function countsByStatus(now = new Date()) {
  const oneWeekAhead = now.getTime() + 7 * 24 * HOUR

  return {
    totalPurchaseRequests: db.purchaseRequests.length,
    createdThisMonth: db.purchaseRequests.filter((entry) => {
      const created = new Date(entry.createdAt)
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    }).length,
    waitingForApproval: db.purchaseRequests.filter((entry) => entry.status === 'SUBMITTED').length,
    activePurchaseOrders: db.purchaseOrders.filter(isActiveOrder).length,
    expectedThisWeek: db.purchaseOrders.filter(
      (entry) =>
        isActiveOrder(entry) &&
        entry.expectedDate !== null &&
        new Date(entry.expectedDate).getTime() <= oneWeekAhead,
    ).length,
    partiallyReceivedOrders: db.purchaseOrders.filter(
      (entry) => entry.status === 'PARTIALLY_RECEIVED',
    ).length,
  }
}

function assertValidItems(input: CreatePurchaseRequestInput) {
  const fieldErrors: Record<string, string> = {}
  if (!input.warehouseId) fieldErrors.warehouseId = 'Warehouse is required.'
  if (!input.items?.length) fieldErrors.items = 'Add at least one product.'

  const seen = new Set<string>()
  input.items?.forEach((item, index) => {
    if (!item.productId) fieldErrors[`items.${index}.productId`] = 'Product is required.'
    if (seen.has(item.productId)) {
      fieldErrors[`items.${index}.productId`] = 'Product has already been added.'
    }
    seen.add(item.productId)
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      fieldErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0.'
    }
  })

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError(422, 'Purchase request is not valid.', fieldErrors)
  }
}

export function createPurchaseRequest(input: CreatePurchaseRequestInput, requestedBy: string) {
  assertValidItems(input)
  findWarehouse(input.warehouseId)

  const id = `pr-new-${db.purchaseRequests.length + 1}`
  const record: PurchaseRequestRecord = {
    id,
    requestNumber: nextNumber('pr', 'PR'),
    warehouseId: input.warehouseId,
    requestedBy,
    status: 'DRAFT',
    items: input.items.map((item, slot) => ({
      id: `${id}-item-${slot + 1}`,
      productId: findProduct(item.productId).id,
      quantity: item.quantity,
    })),
    notes: input.notes?.trim() ? input.notes.trim() : null,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    purchaseOrderId: null,
  }
  db.purchaseRequests.push(record)
  return record
}

export function updatePurchaseRequest(id: string, input: CreatePurchaseRequestInput) {
  const record = getPurchaseRequest(id)
  if (record.status !== 'DRAFT') {
    throw new ApiError(409, 'Only a draft purchase request can be edited.')
  }
  assertValidItems(input)
  findWarehouse(input.warehouseId)

  record.warehouseId = input.warehouseId
  record.notes = input.notes?.trim() ? input.notes.trim() : null
  record.items = input.items.map((item, slot) => ({
    id: `${record.id}-item-${slot + 1}`,
    productId: findProduct(item.productId).id,
    quantity: item.quantity,
  }))
  return record
}

export function submitPurchaseRequest(id: string) {
  const record = getPurchaseRequest(id)
  if (record.status !== 'DRAFT') {
    throw new ApiError(409, 'Only a draft purchase request can be submitted.')
  }
  if (record.items.length === 0) {
    throw new ApiError(422, 'Add at least one product before submitting.', {
      items: 'Add at least one product.',
    })
  }
  record.status = 'SUBMITTED'
  record.submittedAt = new Date().toISOString()
  logActivity(
    'PR_SUBMITTED',
    `${record.requestNumber} submitted`,
    `Raised by ${record.requestedBy} for ${findWarehouse(record.warehouseId).name}.`,
    record.submittedAt,
  )
  return record
}

export function approvePurchaseRequest(id: string, approvedBy: string) {
  const record = getPurchaseRequest(id)
  if (record.status !== 'SUBMITTED') {
    throw new ApiError(409, 'Only a submitted purchase request can be approved.')
  }
  const at = new Date().toISOString()
  record.status = 'APPROVED'
  record.approvedBy = approvedBy
  record.approvedAt = at

  const order: PurchaseOrderRecord = {
    id: `po-from-${record.id}`,
    orderNumber: nextNumber('po', 'PO'),
    supplierId: suppliers[db.purchaseOrders.length % suppliers.length].id,
    warehouseId: record.warehouseId,
    status: 'ORDERED',
    items: record.items.map((item, slot) => ({
      id: `po-from-${record.id}-item-${slot + 1}`,
      productId: item.productId,
      orderedQuantity: item.quantity,
      receivedQuantity: 0,
    })),
    purchaseRequestId: record.id,
    createdAt: at,
    expectedDate: new Date(Date.now() + 7 * 24 * HOUR).toISOString(),
  }
  db.purchaseOrders.push(order)
  record.purchaseOrderId = order.id

  logActivity('PR_APPROVED', `${record.requestNumber} approved`, `Approved by ${approvedBy}.`, at)
  logActivity(
    'PO_CREATED',
    `${order.orderNumber} ordered`,
    `Sent to ${toSupplierRef(order.supplierId).name}.`,
    at,
  )
  return record
}

export function rejectPurchaseRequest(id: string, reason: string, rejectedBy: string) {
  const record = getPurchaseRequest(id)
  if (record.status !== 'SUBMITTED') {
    throw new ApiError(409, 'Only a submitted purchase request can be rejected.')
  }
  if (!reason.trim()) {
    throw new ApiError(422, 'Rejection reason is required.', {
      reason: 'Rejection reason is required.',
    })
  }
  const at = new Date().toISOString()
  record.status = 'REJECTED'
  record.rejectedBy = rejectedBy
  record.rejectedAt = at
  record.rejectionReason = reason.trim()
  logActivity('PR_REJECTED', `${record.requestNumber} rejected`, `Rejected by ${rejectedBy}.`, at)
  return record
}

export function receiveGoods(
  purchaseOrderId: string,
  lines: { productId: string; quantity: number }[],
  receivedBy: string,
  receivedAt = new Date().toISOString(),
) {
  const order = getPurchaseOrder(purchaseOrderId)
  if (order.status !== 'ORDERED' && order.status !== 'PARTIALLY_RECEIVED') {
    throw new ApiError(409, 'Goods can only be received for an ordered purchase order.')
  }

  const meaningful = lines.filter((line) => line.quantity > 0)
  if (meaningful.length === 0) {
    throw new ApiError(422, 'Enter a receive quantity for at least one product.', {
      lines: 'Enter a receive quantity for at least one product.',
    })
  }

  const fieldErrors: Record<string, string> = {}
  for (const line of meaningful) {
    const item = order.items.find((entry) => entry.productId === line.productId)
    if (!item) {
      fieldErrors[line.productId] = 'Product is not part of this purchase order.'
      continue
    }
    const remaining = item.orderedQuantity - item.receivedQuantity
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      fieldErrors[line.productId] = 'Receive quantity must be greater than 0.'
    } else if (line.quantity > remaining) {
      fieldErrors[line.productId] = `Cannot receive more than ${remaining} remaining.`
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError(422, 'Goods receipt is not valid.', fieldErrors)
  }

  const receipt: GoodsReceiptRecord = {
    id: `gr-${db.goodsReceipts.length + 1}`,
    receiptNumber: nextNumber('gr', 'GR'),
    purchaseOrderId: order.id,
    receivedBy,
    receivedAt,
    lines: meaningful,
  }
  db.goodsReceipts.push(receipt)

  for (const line of meaningful) {
    const item = order.items.find((entry) => entry.productId === line.productId)
    if (!item) continue
    item.receivedQuantity += line.quantity
    applyMovement(
      line.productId,
      order.warehouseId,
      line.quantity,
      'PURCHASE_RECEIPT',
      receipt.receiptNumber,
      receivedAt,
    )
  }

  const fullyReceived = order.items.every((item) => item.receivedQuantity >= item.orderedQuantity)
  order.status = fullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED'

  const received = meaningful.reduce((total, line) => total + line.quantity, 0)
  const ordered = order.items.reduce((total, item) => total + item.orderedQuantity, 0)
  logActivity(
    'GOODS_RECEIVED',
    `${receipt.receiptNumber} received`,
    `${received} of ${ordered} units received for ${order.orderNumber}.`,
    receivedAt,
  )

  return { order, receipt }
}
