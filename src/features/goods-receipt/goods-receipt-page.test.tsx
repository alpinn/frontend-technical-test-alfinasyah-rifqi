import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getPurchaseOrder, hydratePurchaseOrder } from '@/mocks/db'
import { renderApp } from '@/test/render'

describe('goods receipt page', () => {
  it('lists only the orders that are still waiting for goods', async () => {
    renderApp({ path: '/goods-receipt' })

    expect(
      await screen.findByText('Showing 1–10 of 21 orders waiting for goods'),
    ).toBeInTheDocument()
    for (const row of within(screen.getByRole('table')).getAllByRole('row').slice(1)) {
      expect(row.textContent).toMatch(/Ordered|Partially Received/)
    }
  })

  it('records a delivery from the list and drops the order once it is fully received', async () => {
    const order = hydratePurchaseOrder(getPurchaseOrder('po-0009'))
    const [item] = order.items
    const remaining = item.orderedQuantity - item.receivedQuantity
    const { user } = renderApp({ path: `/goods-receipt?search=${order.orderNumber}` })

    const table = await screen.findByRole('table')
    await user.click(
      within(table).getByRole('button', { name: `Receive goods for ${order.orderNumber}` }),
    )
    const dialog = await screen.findByRole('dialog', { name: /Receive Goods/ })
    await user.type(
      await within(dialog).findByRole('spinbutton', {
        name: `Receive Now for ${item.product.name}`,
      }),
      String(remaining),
    )
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Record Receipt' }))

    expect(await screen.findByText('No orders match these filters')).toBeInTheDocument()
  })

  it('tells an approver that recording deliveries is a staff task', async () => {
    renderApp({ role: 'APPROVER', path: '/goods-receipt' })

    expect(
      await screen.findByText('Goods receipt is recorded by warehouse staff'),
    ).toBeInTheDocument()
  })
})
