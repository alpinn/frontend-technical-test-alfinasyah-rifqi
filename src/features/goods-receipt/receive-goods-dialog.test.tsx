import { screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  getPurchaseOrder,
  getStockRow,
  hydrateInventoryItem,
  hydratePurchaseOrder,
} from '@/mocks/db'
import { setMockFailureEnabled } from '@/mocks/failure'
import { renderApp } from '@/test/render'

async function openOrder(orderId: string, role: 'USER' | 'APPROVER' = 'USER') {
  const order = hydratePurchaseOrder(getPurchaseOrder(orderId))
  const rendered = renderApp({ role, path: `/purchase-orders/${orderId}` })
  await screen.findByRole('heading', { level: 2, name: order.orderNumber })
  return { ...rendered, order }
}

async function openReceiveDialog(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Receive Goods' }))
  return screen.findByRole('dialog', { name: /Receive Goods/ })
}

async function enterQuantity(user: UserEvent, dialog: HTMLElement, product: string, value: string) {
  const input = await within(dialog).findByRole('spinbutton', {
    name: `Receive Now for ${product}`,
  })
  await user.clear(input)
  await user.type(input, value)
}

describe('goods receipt', () => {
  it('is offered to staff for an order that is still waiting for goods', async () => {
    await openOrder('po-0029')

    expect(screen.getByRole('button', { name: 'Receive Goods' })).toBeInTheDocument()
  })

  it('is not offered to an approver', async () => {
    await openOrder('po-0029', 'APPROVER')

    expect(screen.queryByRole('button', { name: 'Receive Goods' })).not.toBeInTheDocument()
  })

  it('is not offered once an order is received or cancelled', async () => {
    const received = await openOrder('po-0001')
    expect(screen.queryByRole('button', { name: 'Receive Goods' })).not.toBeInTheDocument()
    received.unmount()

    await openOrder('po-0007')
    expect(screen.queryByRole('button', { name: 'Receive Goods' })).not.toBeInTheDocument()
  })

  it('shows the ordered, already received and remaining quantity of each product', async () => {
    const { user, order } = await openOrder('po-0009')
    const [item] = order.items

    const dialog = await openReceiveDialog(user)

    expect(await within(dialog).findByText(item.product.name)).toBeInTheDocument()
    expect(within(dialog).getByText('Ordered')).toBeInTheDocument()
    expect(within(dialog).getByText('Already Received')).toBeInTheDocument()
    expect(within(dialog).getByText('Remaining')).toBeInTheDocument()
    expect(within(dialog).getByText(String(item.orderedQuantity))).toBeInTheDocument()
    expect(within(dialog).getByText(String(item.receivedQuantity))).toBeInTheDocument()
    expect(
      within(dialog).getByText(String(item.orderedQuantity - item.receivedQuantity)),
    ).toBeInTheDocument()
  })

  it('cannot receive more than the remaining quantity', async () => {
    const { user, order } = await openOrder('po-0009')
    const [item] = order.items
    const remaining = item.orderedQuantity - item.receivedQuantity

    const dialog = await openReceiveDialog(user)
    await enterQuantity(user, dialog, item.product.name, String(remaining + 1))
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))

    expect(
      await within(dialog).findByText(`Cannot receive more than ${remaining} remaining.`),
    ).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Record Receipt' })).not.toBeInTheDocument()
  })

  it('asks for at least one product and rejects a quantity of zero', async () => {
    const { user, order } = await openOrder('po-0009')
    const [item] = order.items

    const dialog = await openReceiveDialog(user)
    await within(dialog).findByRole('spinbutton', { name: `Receive Now for ${item.product.name}` })
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))
    expect(
      await within(dialog).findByText('Enter a receive quantity for at least one product.'),
    ).toBeInTheDocument()

    await enterQuantity(user, dialog, item.product.name, '0')
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))
    expect(
      await within(dialog).findByText('Receive quantity must be greater than 0.'),
    ).toBeInTheDocument()
  })

  it('updates received, remaining and status without a reload after a receipt', async () => {
    const { user, order } = await openOrder('po-0029')
    const [first] = order.items

    const dialog = await openReceiveDialog(user)
    await enterQuantity(user, dialog, first.product.name, '10')
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))
    expect(await within(dialog).findByText('partially received')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Record Receipt' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Partially received.')).toBeInTheDocument()
    const [, firstRow] = within(screen.getByRole('table')).getAllByRole('row')
    const cells = within(firstRow).getAllByRole('cell')
    expect(cells[2]).toHaveTextContent('10')
    expect(cells[3]).toHaveTextContent(String(first.orderedQuantity - 10))
  })

  it('marks the order received and adds the goods to stock when everything remaining arrives', async () => {
    const { user, order } = await openOrder('po-0009')
    const [item] = order.items
    const remaining = item.orderedQuantity - item.receivedQuantity
    const stockId = `stk-${order.warehouse.id}-${item.product.id}`
    const stockBefore = hydrateInventoryItem(getStockRow(stockId)).currentStock

    const dialog = await openReceiveDialog(user)
    await enterQuantity(user, dialog, item.product.name, String(remaining))
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))
    expect(await within(dialog).findByText('fully received')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Record Receipt' }))

    expect(await screen.findByText('Fully received.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Receive Goods' })).not.toBeInTheDocument()
    expect(hydrateInventoryItem(getStockRow(stockId)).currentStock).toBe(stockBefore + remaining)
  })

  it('keeps the receipt open when recording it fails', async () => {
    const { user, order } = await openOrder('po-0029')
    const [first] = order.items

    const dialog = await openReceiveDialog(user)
    await enterQuantity(user, dialog, first.product.name, '5')
    await user.click(within(dialog).getByRole('button', { name: 'Review Receipt' }))
    const record = await within(dialog).findByRole('button', { name: 'Record Receipt' })
    setMockFailureEnabled(true)
    await user.click(record)

    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Record Receipt' })).toBeEnabled(),
    )
    expect(screen.getByText('Waiting for goods to arrive.')).toBeInTheDocument()
  })
})
