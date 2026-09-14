import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getPurchaseOrder, hydratePurchaseOrder } from '@/mocks/db'
import { renderApp } from '@/test/render'

async function openOrder(orderId: string) {
  const order = hydratePurchaseOrder(getPurchaseOrder(orderId))
  const rendered = renderApp({ path: `/purchase-orders/${orderId}` })
  await screen.findByRole('heading', { level: 2, name: order.orderNumber })
  return { ...rendered, order }
}

function totals(order: ReturnType<typeof hydratePurchaseOrder>) {
  const ordered = order.items.reduce((total, item) => total + item.orderedQuantity, 0)
  const received = order.items.reduce((total, item) => total + item.receivedQuantity, 0)
  return { ordered, received }
}

describe('purchase order detail', () => {
  it('shows the supplier, warehouse and the ordered, received and remaining quantity of each product', async () => {
    const { order } = await openOrder('po-0009')

    expect(
      screen.getByText(`Ordered from ${order.supplier.name} for ${order.warehouse.name}.`),
    ).toBeInTheDocument()
    const table = screen.getByRole('table')
    for (const heading of ['Product', 'Ordered', 'Received', 'Remaining', 'Progress']) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument()
    }

    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(order.items.length)
    order.items.forEach((item, index) => {
      const cells = within(rows[index]).getAllByRole('cell')
      expect(cells[0]).toHaveTextContent(item.product.name)
      expect(cells[1]).toHaveTextContent(String(item.orderedQuantity))
      expect(cells[2]).toHaveTextContent(String(item.receivedQuantity))
      expect(cells[3]).toHaveTextContent(String(item.orderedQuantity - item.receivedQuantity))
    })
  })

  it('makes the receiving progress of a partially received order easy to read', async () => {
    const { order } = await openOrder('po-0009')
    const { ordered, received } = totals(order)

    expect(order.status).toBe('PARTIALLY_RECEIVED')
    expect(screen.getByText('Partially received.')).toBeInTheDocument()
    expect(
      screen.getByText(
        `${received} of ${ordered} units received. ${ordered - received} still to arrive.`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Overall receiving progress' })).toHaveAttribute(
      'aria-valuenow',
      String(Math.round((received / ordered) * 100)),
    )
  })

  it('lists the goods receipts recorded against a received order', async () => {
    const { order } = await openOrder('po-0001')

    expect(screen.getByText('Fully received.')).toBeInTheDocument()
    const receipts = screen.getByRole('list', { name: 'Goods receipts' })
    expect(within(receipts).getAllByRole('listitem')).toHaveLength(order.receipts.length)
    expect(within(receipts).getByText(order.receipts[0].receiptNumber)).toBeInTheDocument()
  })

  it('explains that nothing has arrived yet for a new order', async () => {
    await openOrder('po-0029')

    expect(screen.getByText('Waiting for goods to arrive.')).toBeInTheDocument()
    expect(screen.getByText('No goods received yet')).toBeInTheDocument()
  })

  it('explains a cancelled order', async () => {
    await openOrder('po-0007')

    expect(screen.getByText('This order was cancelled.')).toBeInTheDocument()
  })

  it('links to the purchase request it was created from', async () => {
    const { user, order } = await openOrder('po-0009')

    await user.click(screen.getByRole('link', { name: order.purchaseRequestNumber ?? '' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: order.purchaseRequestNumber ?? '' }),
    ).toBeInTheDocument()
  })

  it('is reachable from the approved purchase request that created it', async () => {
    const { user } = renderApp({ path: '/purchase-requests/pr-0047' })

    await user.click(await screen.findByRole('link', { name: 'PO-2026-0029' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'PO-2026-0029' }),
    ).toBeInTheDocument()
  })

  it('explains when an order does not exist', async () => {
    renderApp({ path: '/purchase-orders/po-9999' })

    expect(await screen.findByText('This purchase order does not exist')).toBeInTheDocument()
  })
})
