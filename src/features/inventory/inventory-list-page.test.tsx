import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setMockFailureEnabled } from '@/mocks/failure'
import { renderApp } from '@/test/render'

async function stockRows() {
  const table = await screen.findByRole('table')
  return within(table).getAllByRole('row').slice(1)
}

function currentRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

describe('inventory list', () => {
  it('shows the stock of each product per warehouse with the required columns', async () => {
    renderApp({ path: '/inventory' })

    const table = await screen.findByRole('table')
    for (const heading of ['Product', 'SKU', 'Warehouse', 'Current Stock', 'Unit']) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument()
    }
    const [first] = await stockRows()
    expect(first).toHaveTextContent('Conveyor Belt 3m')
    expect(first).toHaveTextContent('BLT-220')
    expect(first).toHaveTextContent('Jakarta Hub')
    expect(screen.getByText('Showing 1–10 of 40 inventory items')).toBeInTheDocument()
  })

  it('searches by SKU', async () => {
    const { user } = renderApp({ path: '/inventory' })
    await stockRows()

    await user.type(
      screen.getByRole('searchbox', { name: 'Search by product, SKU or warehouse' }),
      'OIL-001',
    )

    await waitFor(() => {
      const rows = currentRows()
      expect(rows).toHaveLength(4)
      for (const row of rows) expect(row).toHaveTextContent('Industrial Oil')
    })
  })

  it('filters by warehouse', async () => {
    const { user } = renderApp({ path: '/inventory' })
    await stockRows()

    await user.click(screen.getByRole('combobox', { name: 'Filter by warehouse' }))
    await user.click(await screen.findByRole('option', { name: 'Surabaya Depot' }))

    expect(await screen.findByText('Showing 1–10 of 10 inventory items')).toBeInTheDocument()
    for (const row of currentRows()) expect(row).toHaveTextContent('Surabaya Depot')
  })

  it('explains when nothing matches and restores all stock', async () => {
    const { user } = renderApp({ path: '/inventory?search=no-such-product' })

    expect(await screen.findByText('No stock matches these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all stock' }))

    expect(await stockRows()).toHaveLength(10)
  })

  it('opens the movement history of a stock item', async () => {
    const { user } = renderApp({ path: '/inventory?search=OIL-001' })
    await screen.findByText('Showing 1–4 of 4 inventory items')

    await user.click(
      within(screen.getByRole('table')).getByRole('link', {
        name: 'View stock history for Industrial Oil at Main Warehouse',
      }),
    )

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Industrial Oil' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Movement history' })).toBeInTheDocument()
  })

  it('shows an error with a retry that reloads the stock', async () => {
    setMockFailureEnabled(true)
    const { user } = renderApp({ path: '/inventory' })

    expect(await screen.findByText('Unable to load inventory')).toBeInTheDocument()
    setMockFailureEnabled(false)
    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(await stockRows()).toHaveLength(10)
  })
})
