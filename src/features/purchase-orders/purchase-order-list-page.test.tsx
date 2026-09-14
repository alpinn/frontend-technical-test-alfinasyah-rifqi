import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setMockFailureEnabled } from '@/mocks/failure'
import { renderApp } from '@/test/render'

async function orderRows() {
  const table = await screen.findByRole('table')
  return within(table).getAllByRole('row').slice(1)
}

function currentRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

describe('purchase order list', () => {
  it('shows the required columns with the newest order first', async () => {
    renderApp({ path: '/purchase-orders' })

    const table = await screen.findByRole('table')
    for (const heading of ['PO Number', 'Supplier', 'Warehouse', 'Items', 'Created At', 'Status']) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument()
    }

    const [newest] = await orderRows()
    expect(newest).toHaveTextContent('PO-2026-0029')
    expect(newest).toHaveTextContent('Pacific Industrial Supply')
    expect(newest).toHaveTextContent('Jakarta Hub')
    expect(newest).toHaveTextContent('2 items')
    expect(newest).toHaveTextContent('Ordered')
  })

  it('filters by status', async () => {
    const { user } = renderApp({ path: '/purchase-orders' })
    await orderRows()

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }))
    await user.click(await screen.findByRole('option', { name: 'Partially Received' }))

    await waitFor(() => {
      const rows = currentRows()
      expect(rows).toHaveLength(5)
      for (const row of rows) expect(row).toHaveTextContent('Partially Received')
    })
  })

  it('searches by supplier', async () => {
    const { user } = renderApp({ path: '/purchase-orders' })
    await orderRows()

    await user.type(
      screen.getByRole('searchbox', { name: 'Search by order number, supplier or warehouse' }),
      'Garuda',
    )

    await waitFor(() => {
      const rows = currentRows()
      expect(rows).toHaveLength(7)
      for (const row of rows) expect(row).toHaveTextContent('Garuda Safety Equipment')
    })
  })

  it('explains when nothing matches and restores the full list', async () => {
    const { user } = renderApp({ path: '/purchase-orders?search=no-such-order' })

    expect(await screen.findByText('No purchase orders match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all orders' }))

    expect(await orderRows()).toHaveLength(10)
  })

  it('pages through the orders', async () => {
    const { user } = renderApp({ path: '/purchase-orders' })

    expect(await screen.findByText('Showing 1–10 of 29 purchase orders')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText('Showing 11–20 of 29 purchase orders')).toBeInTheDocument()
  })

  it('opens an order from the list', async () => {
    const { user } = renderApp({ path: '/purchase-orders' })
    await orderRows()

    await user.click(screen.getByRole('link', { name: 'View PO-2026-0029' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'PO-2026-0029' }),
    ).toBeInTheDocument()
  })

  it('shows an error with a retry that reloads the list', async () => {
    setMockFailureEnabled(true)
    const { user } = renderApp({ path: '/purchase-orders' })

    expect(await screen.findByText('Unable to load purchase orders')).toBeInTheDocument()
    setMockFailureEnabled(false)
    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(await orderRows()).toHaveLength(10)
  })
})
