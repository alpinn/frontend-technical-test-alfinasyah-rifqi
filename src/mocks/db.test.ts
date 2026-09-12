import { describe, expect, it } from 'vitest'

import {
  ApiError,
  approvePurchaseRequest,
  countsByStatus,
  createPurchaseRequest,
  getPurchaseOrder,
  listPurchaseOrders,
  listPurchaseRequests,
  listStock,
  receiveGoods,
  rejectPurchaseRequest,
  submitPurchaseRequest,
} from '@/mocks/db'

function firstRequestWithStatus(status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED') {
  const record = listPurchaseRequests().find((entry) => entry.status === status)
  if (!record) throw new Error(`No seeded purchase request with status ${status}`)
  return record
}

function firstOrderWithStatus(status: 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED') {
  const record = listPurchaseOrders().find((entry) => entry.status === status)
  if (!record) throw new Error(`No seeded purchase order with status ${status}`)
  return record
}

function stockFor(productId: string, warehouseId: string) {
  const row = listStock().find(
    (entry) => entry.productId === productId && entry.warehouseId === warehouseId,
  )
  if (!row) throw new Error('Stock row not found')
  return row.currentStock
}

describe('purchase request rules', () => {
  it('rejects a request that has no items', () => {
    expect(() =>
      createPurchaseRequest({ warehouseId: 'wh-main', items: [] }, 'John Doe'),
    ).toThrowError(ApiError)
  })

  it('rejects the same product added twice', () => {
    try {
      createPurchaseRequest(
        {
          warehouseId: 'wh-main',
          items: [
            { productId: 'p-oil', quantity: 10 },
            { productId: 'p-oil', quantity: 5 },
          ],
        },
        'John Doe',
      )
      expect.unreachable('duplicate product should be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).fieldErrors).toMatchObject({
        'items.1.productId': 'Product has already been added.',
      })
    }
  })

  it('rejects a quantity that is not greater than zero', () => {
    try {
      createPurchaseRequest(
        { warehouseId: 'wh-main', items: [{ productId: 'p-oil', quantity: 0 }] },
        'John Doe',
      )
      expect.unreachable('zero quantity should be rejected')
    } catch (error) {
      expect((error as ApiError).fieldErrors).toMatchObject({
        'items.0.quantity': 'Quantity must be greater than 0.',
      })
    }
  })

  it('moves a draft through submit and approval, creating a purchase order', () => {
    const created = createPurchaseRequest(
      { warehouseId: 'wh-main', items: [{ productId: 'p-oil', quantity: 25 }] },
      'John Doe',
    )
    expect(created.status).toBe('DRAFT')

    expect(submitPurchaseRequest(created.id).status).toBe('SUBMITTED')

    const approved = approvePurchaseRequest(created.id, 'Alex Morgan')
    expect(approved.status).toBe('APPROVED')
    expect(approved.approvedBy).toBe('Alex Morgan')
    expect(approved.purchaseOrderId).not.toBeNull()

    const order = getPurchaseOrder(approved.purchaseOrderId!)
    expect(order.status).toBe('ORDERED')
    expect(order.items).toEqual([
      expect.objectContaining({ productId: 'p-oil', orderedQuantity: 25, receivedQuantity: 0 }),
    ])
  })

  it('only approves a request that is currently submitted', () => {
    const draft = firstRequestWithStatus('DRAFT')
    expect(() => approvePurchaseRequest(draft.id, 'Alex Morgan')).toThrowError(ApiError)

    const approved = firstRequestWithStatus('APPROVED')
    expect(() => approvePurchaseRequest(approved.id, 'Alex Morgan')).toThrowError(ApiError)
  })

  it('requires a reason to reject', () => {
    const submitted = firstRequestWithStatus('SUBMITTED')
    expect(() => rejectPurchaseRequest(submitted.id, '   ', 'Alex Morgan')).toThrowError(ApiError)

    const rejected = rejectPurchaseRequest(submitted.id, 'Duplicate of PR-2026-0031', 'Alex Morgan')
    expect(rejected.status).toBe('REJECTED')
    expect(rejected.rejectionReason).toBe('Duplicate of PR-2026-0031')
  })
})

describe('goods receipt rules', () => {
  it('cannot receive more than the remaining quantity', () => {
    const order = firstOrderWithStatus('ORDERED')
    const item = order.items[0]

    try {
      receiveGoods(
        order.id,
        [{ productId: item.productId, quantity: item.orderedQuantity + 1 }],
        'John Doe',
      )
      expect.unreachable('over-receiving should be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).fieldErrors?.[item.productId]).toContain(
        'Cannot receive more than',
      )
    }
  })

  it('cannot receive a quantity of zero', () => {
    const order = firstOrderWithStatus('ORDERED')
    expect(() =>
      receiveGoods(order.id, [{ productId: order.items[0].productId, quantity: 0 }], 'John Doe'),
    ).toThrowError(ApiError)
  })

  it('moves an ordered purchase order to partially received and then received', () => {
    const order = firstOrderWithStatus('ORDERED')
    const item = order.items[0]
    const stockBefore = stockFor(item.productId, order.warehouseId)

    const partial = receiveGoods(order.id, [{ productId: item.productId, quantity: 1 }], 'John Doe')
    expect(partial.order.status).toBe('PARTIALLY_RECEIVED')
    expect(stockFor(item.productId, order.warehouseId)).toBe(stockBefore + 1)

    const remainingLines = partial.order.items.map((entry) => ({
      productId: entry.productId,
      quantity: entry.orderedQuantity - entry.receivedQuantity,
    }))
    const complete = receiveGoods(order.id, remainingLines, 'John Doe')

    expect(complete.order.status).toBe('RECEIVED')
    for (const entry of complete.order.items) {
      expect(entry.receivedQuantity).toBe(entry.orderedQuantity)
    }
  })

  it('refuses to receive against an order that is already received', () => {
    const order = firstOrderWithStatus('RECEIVED')
    expect(() =>
      receiveGoods(order.id, [{ productId: order.items[0].productId, quantity: 1 }], 'John Doe'),
    ).toThrowError(ApiError)
  })
})

describe('dashboard counts', () => {
  it('derives counts from the seeded workflow state', () => {
    const counts = countsByStatus()

    expect(counts.totalPurchaseRequests).toBe(48)
    expect(counts.waitingForApproval).toBe(8)
    expect(counts.activePurchaseOrders).toBe(21)
    expect(counts.partiallyReceivedOrders).toBe(5)
  })

  it('increments waiting for approval when a draft is submitted', () => {
    const before = countsByStatus().waitingForApproval
    submitPurchaseRequest(firstRequestWithStatus('DRAFT').id)
    expect(countsByStatus().waitingForApproval).toBe(before + 1)
  })
})
