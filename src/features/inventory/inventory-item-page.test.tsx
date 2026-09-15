import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  getPurchaseOrder,
  getStockRow,
  hydrateInventoryItem,
  hydratePurchaseOrder,
  receiveGoods,
} from '@/mocks/db'
import { renderApp } from '@/test/render'

describe('inventory item', () => {
  it('lists a goods receipt in the history with its receipt number', async () => {
    const order = hydratePurchaseOrder(getPurchaseOrder('po-0009'))
    const [item] = order.items
    const stockId = `stk-${order.warehouse.id}-${item.product.id}`
    const stockBefore = hydrateInventoryItem(getStockRow(stockId)).currentStock
    const { receipt } = receiveGoods(
      order.id,
      [{ productId: item.product.id, quantity: 12 }],
      'John Doe',
    )
    renderApp({ path: `/inventory/${stockId}` })

    const history = await screen.findByRole('list', { name: 'Movement history' })
    expect(within(history).getByText(new RegExp(receipt.receiptNumber))).toBeInTheDocument()
    expect(within(history).getByText(`+12 ${item.product.unit}`)).toBeInTheDocument()
    expect(screen.getByText((stockBefore + 12).toLocaleString('en-US'))).toBeInTheDocument()
  })

  it('shows the current stock and its movement history', async () => {
    const stock = hydrateInventoryItem(getStockRow('stk-wh-main-p-oil'))
    renderApp({ path: '/inventory/stk-wh-main-p-oil' })

    expect(
      await screen.findByRole('heading', { level: 2, name: stock.product.name }),
    ).toBeInTheDocument()
    expect(screen.getByText(`${stock.product.sku} · ${stock.warehouse.name}`)).toBeInTheDocument()
    expect(screen.getByText(stock.currentStock.toLocaleString('en-US'))).toBeInTheDocument()
    const history = await screen.findByRole('list', { name: 'Movement history' })
    expect(within(history).getByText(/Opening balance/)).toBeInTheDocument()
  })

  it('explains when a stock item does not exist', async () => {
    renderApp({ path: '/inventory/stk-missing' })

    expect(await screen.findByText('This stock item does not exist')).toBeInTheDocument()
  })
})
