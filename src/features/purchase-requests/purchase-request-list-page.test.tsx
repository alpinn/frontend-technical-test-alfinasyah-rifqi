import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setMockFailureEnabled } from '@/mocks/failure'
import { renderApp } from '@/test/render'

async function requestRows() {
  const table = await screen.findByRole('table')
  return within(table).getAllByRole('row').slice(1)
}

function currentRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

describe('purchase request list', () => {
  it('shows the required columns with the newest request first', async () => {
    renderApp({ path: '/purchase-requests' })

    const table = await screen.findByRole('table')
    for (const heading of ['Request Number', 'Requested By', 'Warehouse', 'Items', 'Status']) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument()
    }
    expect(within(table).getByRole('columnheader', { name: /created at/i })).toBeInTheDocument()

    const [newest] = await requestRows()
    expect(newest).toHaveTextContent('PR-2026-0048')
    expect(newest).toHaveTextContent('John Doe')
    expect(newest).toHaveTextContent('Main Warehouse')
    expect(newest).toHaveTextContent('4 items')
    expect(newest).toHaveTextContent('Submitted')
  })

  it('filters by status', async () => {
    const { user } = renderApp({ path: '/purchase-requests' })
    await requestRows()

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }))
    await user.click(await screen.findByRole('option', { name: 'Rejected' }))

    await waitFor(() => {
      const rows = currentRows()
      expect(rows).toHaveLength(5)
      for (const row of rows) expect(row).toHaveTextContent('Rejected')
    })
  })

  it('searches by request number', async () => {
    const { user } = renderApp({ path: '/purchase-requests' })
    await requestRows()

    await user.type(
      screen.getByRole('searchbox', { name: 'Search by request number, requester or warehouse' }),
      'PR-2026-0047',
    )

    await waitFor(() => {
      const rows = currentRows()
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Daniel Wong')
    })
  })

  it('explains when nothing matches and restores the full list', async () => {
    const { user } = renderApp({ path: '/purchase-requests?search=no-such-request' })

    expect(await screen.findByText('No purchase requests match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all requests' }))

    expect(await requestRows()).toHaveLength(10)
  })

  it('pages through the results', async () => {
    const { user } = renderApp({ path: '/purchase-requests' })

    expect(await screen.findByText('Showing 1–10 of 48 purchase requests')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText('Showing 11–20 of 48 purchase requests')).toBeInTheDocument()
  })

  it('can list the oldest requests first', async () => {
    const { user } = renderApp({ path: '/purchase-requests' })
    await requestRows()

    await user.click(screen.getByRole('button', { name: /created at/i }))

    await waitFor(() => expect(currentRows()[0]).toHaveTextContent('PR-2026-0001'))
  })

  it('offers request creation to staff', async () => {
    renderApp({ role: 'USER', path: '/purchase-requests' })

    expect(await screen.findByRole('link', { name: 'Create Purchase Request' })).toBeInTheDocument()
  })

  it('does not offer request creation to an approver', async () => {
    renderApp({ role: 'APPROVER', path: '/purchase-requests' })
    await requestRows()

    expect(screen.queryByRole('link', { name: 'Create Purchase Request' })).not.toBeInTheDocument()
  })

  it('shows an error with a retry that reloads the list', async () => {
    setMockFailureEnabled(true)
    const { user } = renderApp({ path: '/purchase-requests' })

    expect(await screen.findByText('Unable to load purchase requests')).toBeInTheDocument()
    setMockFailureEnabled(false)
    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(await requestRows()).toHaveLength(10)
  })
})
