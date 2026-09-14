import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { approvePurchaseRequest } from '@/mocks/db'
import { setMockFailureEnabled } from '@/mocks/failure'
import { renderApp } from '@/test/render'

async function openRequest(path: string, role: 'USER' | 'APPROVER', number: string) {
  const rendered = renderApp({ role, path })
  await screen.findByRole('heading', { level: 2, name: number })
  return rendered
}

describe('purchase request detail', () => {
  it('shows the request, who raised it and every item', async () => {
    await openRequest('/purchase-requests/pr-0048', 'USER', 'PR-2026-0048')

    expect(screen.getByText('Requested by John Doe for Main Warehouse.')).toBeInTheDocument()
    const table = screen.getByRole('table')
    for (const heading of ['Product', 'SKU', 'Quantity', 'Unit']) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument()
    }
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(4)
  })

  it('lets staff submit a draft after confirming', async () => {
    const { user } = await openRequest('/purchase-requests/pr-0046', 'USER', 'PR-2026-0046')

    await user.click(screen.getByRole('button', { name: 'Submit for Approval' }))
    const dialog = await screen.findByRole('dialog', { name: 'Submit Purchase Request?' })
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Waiting for approval.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit for Approval' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('does not show approval actions to staff', async () => {
    await openRequest('/purchase-requests/pr-0048', 'USER', 'PR-2026-0048')

    expect(screen.getByText('Waiting for approval.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('lets an approver approve a submitted request, creating a purchase order', async () => {
    const { user } = await openRequest('/purchase-requests/pr-0048', 'APPROVER', 'PR-2026-0048')

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    const dialog = await screen.findByRole('dialog', { name: 'Approve Purchase Request?' })
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(await screen.findByText(/^Approved by Alex Morgan/)).toBeInTheDocument()
    expect(
      screen.getByText('Purchase order PO-2026-0030 was created from this request.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('requires a reason before an approver can reject', async () => {
    const { user } = await openRequest('/purchase-requests/pr-0048', 'APPROVER', 'PR-2026-0048')

    await user.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = await screen.findByRole('dialog', { name: 'Reject Purchase Request?' })
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }))
    expect(await within(dialog).findByText('Rejection reason is required.')).toBeInTheDocument()

    await user.type(
      within(dialog).getByRole('textbox', { name: 'Rejection reason' }),
      'Budget for this quarter is exhausted',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText(/^Rejected by Alex Morgan/)).toBeInTheDocument()
    expect(screen.getByText('Reason: Budget for this quarter is exhausted')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('keeps the confirmation open when approval fails', async () => {
    const { user } = await openRequest('/purchase-requests/pr-0048', 'APPROVER', 'PR-2026-0048')

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    const dialog = await screen.findByRole('dialog', { name: 'Approve Purchase Request?' })
    setMockFailureEnabled(true)
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Approve' })).toBeEnabled(),
    )
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('This request is waiting for your decision.')).toBeInTheDocument()
  })

  it('shows the current status when the request was decided elsewhere before rejecting', async () => {
    const { user } = await openRequest('/purchase-requests/pr-0048', 'APPROVER', 'PR-2026-0048')
    approvePurchaseRequest('pr-0048', 'Alex Morgan')

    await user.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = await screen.findByRole('dialog', { name: 'Reject Purchase Request?' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Rejection reason' }), 'Too late')
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText(/^Approved by Alex Morgan/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('offers no actions once a request has been decided', async () => {
    await openRequest('/purchase-requests/pr-0047', 'APPROVER', 'PR-2026-0047')

    expect(screen.getByText(/^Approved by Alex Morgan/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('does not let an approver edit or submit a draft', async () => {
    await openRequest('/purchase-requests/pr-0046', 'APPROVER', 'PR-2026-0046')

    expect(screen.getByText('This request is still a draft.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit for Approval' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('explains when a request does not exist', async () => {
    renderApp({ path: '/purchase-requests/pr-9999' })

    expect(await screen.findByText('This purchase request does not exist')).toBeInTheDocument()
  })
})
