import { describe, expect, it } from 'vitest'

import { receivingProgress, remainingQuantity } from '@/lib/purchase-order'

describe('receiving progress', () => {
  it('works out what is still to arrive for an item', () => {
    expect(remainingQuantity({ orderedQuantity: 100, receivedQuantity: 60 })).toBe(40)
    expect(remainingQuantity({ orderedQuantity: 10, receivedQuantity: 12 })).toBe(0)
  })

  it('adds up the ordered and received quantities of an order', () => {
    expect(
      receivingProgress([
        { orderedQuantity: 100, receivedQuantity: 60 },
        { orderedQuantity: 50, receivedQuantity: 50 },
      ]),
    ).toEqual({ ordered: 150, received: 110, remaining: 40, percent: 73 })
  })

  it('treats an order with nothing ordered as not started', () => {
    expect(receivingProgress([])).toEqual({ ordered: 0, received: 0, remaining: 0, percent: 0 })
  })
})
