import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { setMockFailureEnabled } from '@/mocks/failure'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/render'

async function summaryValue(label: string) {
  const summary = await screen.findByRole('region', { name: 'Procurement summary' })
  return within(summary).getByText(label).nextElementSibling?.textContent
}

describe('dashboard', () => {
  it('shows the procurement summary figures', async () => {
    renderApp()

    expect(await summaryValue('Total Purchase Requests')).toBe('48')
    expect(await summaryValue('Waiting for Approval')).toBe('8')
    expect(await summaryValue('Active Purchase Orders')).toBe('21')
    expect(await summaryValue('Partially Received Orders')).toBe('5')
  })

  it('asks an approver to review the requests waiting for approval', async () => {
    renderApp({ role: 'APPROVER' })

    expect(await screen.findByText('8 purchase requests need your attention.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review requests' })).toHaveAttribute(
      'href',
      expect.stringContaining('status=SUBMITTED'),
    )
    expect(screen.queryByRole('link', { name: 'Create Purchase Request' })).not.toBeInTheDocument()
  })

  it('lets a staff user create a request without the approval prompt', async () => {
    renderApp({ role: 'USER' })

    await screen.findByRole('region', { name: 'Procurement summary' })
    expect(screen.queryByText(/need your attention/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Purchase Request' })).toBeInTheDocument()
  })

  it('lists the five most recent purchase requests and the latest activity', async () => {
    renderApp()

    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent('PR-2026-0048')
    expect(await screen.findByRole('list', { name: 'Recent activity' })).toBeInTheDocument()
  })

  it('guides a staff user to create the first request when there are none', async () => {
    server.use(
      http.get('/api/purchase-requests', () =>
        HttpResponse.json({ data: [], meta: { page: 1, pageSize: 5, total: 0, totalPages: 1 } }),
      ),
    )
    renderApp({ role: 'USER' })

    const heading = await screen.findByText('No purchase requests yet')
    expect(
      within(heading.parentElement as HTMLElement).getByRole('link', {
        name: 'Create Purchase Request',
      }),
    ).toBeInTheDocument()
  })

  it('recovers the overview after a failed load when the user retries', async () => {
    setMockFailureEnabled(true)
    const { user } = renderApp()

    const heading = await screen.findByText('Unable to load the procurement overview')
    setMockFailureEnabled(false)
    await user.click(
      within(heading.parentElement as HTMLElement).getByRole('button', { name: 'Try Again' }),
    )

    expect(await summaryValue('Total Purchase Requests')).toBe('48')
  })
})
