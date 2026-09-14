import type { PurchaseOrderItem } from '@/types'

type Quantities = Pick<PurchaseOrderItem, 'orderedQuantity' | 'receivedQuantity'>

export function remainingQuantity(item: Quantities) {
  return Math.max(0, item.orderedQuantity - item.receivedQuantity)
}

export function receivingProgress(items: Quantities[]) {
  const ordered = items.reduce((total, item) => total + item.orderedQuantity, 0)
  const received = items.reduce((total, item) => total + item.receivedQuantity, 0)
  return {
    ordered,
    received,
    remaining: Math.max(0, ordered - received),
    percent: ordered === 0 ? 0 : Math.round((received / ordered) * 100),
  }
}
