import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { setMockFailureEnabled } from '@/mocks/failure'
import { renderApp } from '@/test/render'

async function choose(user: UserEvent, combobox: string, option: RegExp) {
  await user.click(screen.getByRole('combobox', { name: combobox }))
  await user.click(await screen.findByRole('option', { name: option }))
}

async function setQuantity(user: UserEvent, label: string, value: string) {
  const input = screen.getByRole('spinbutton', { name: label })
  await user.clear(input)
  await user.type(input, value)
}

async function openCreateForm() {
  const rendered = renderApp({ role: 'USER', path: '/purchase-requests/new' })
  await screen.findByRole('combobox', { name: 'Warehouse' })
  return rendered
}

describe('create purchase request form', () => {
  it('requires a warehouse and at least one product', async () => {
    const { user } = await openCreateForm()

    await user.click(screen.getByRole('button', { name: 'Remove item 1' }))
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))

    expect(await screen.findByText('Warehouse is required.')).toBeInTheDocument()
    expect(screen.getByText('Add at least one product.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Create Purchase Request' }),
    ).toBeInTheDocument()
  })

  it('explains that the quantity must be greater than zero', async () => {
    const { user } = await openCreateForm()

    await choose(user, 'Warehouse', /Main Warehouse/)
    await choose(user, 'Product 1', /Industrial Oil/)
    await setQuantity(user, 'Quantity 1', '0')
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))

    expect(await screen.findByText('Quantity must be greater than 0.')).toBeInTheDocument()
  })

  it('does not let the same product be picked twice', async () => {
    const { user } = await openCreateForm()

    await choose(user, 'Product 1', /Industrial Oil/)
    await user.click(screen.getByRole('button', { name: 'Add Product' }))
    await user.click(screen.getByRole('combobox', { name: 'Product 2' }))

    expect(await screen.findByRole('option', { name: /Industrial Oil/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('saves a draft with several products and opens it', async () => {
    const { user } = await openCreateForm()

    await choose(user, 'Warehouse', /Jakarta Hub/)
    await choose(user, 'Product 1', /Industrial Oil/)
    await setQuantity(user, 'Quantity 1', '100')
    await user.click(screen.getByRole('button', { name: 'Add Product' }))
    await choose(user, 'Product 2', /Safety Gloves/)
    await setQuantity(user, 'Quantity 2', '20')
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'PR-2026-0049' }),
    ).toBeInTheDocument()
    const items = within(screen.getByRole('table'))
    expect(items.getByText('Industrial Oil')).toBeInTheDocument()
    expect(items.getByText('Safety Gloves')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit for Approval' })).toBeInTheDocument()
  })

  it('keeps what was entered and shows the error when saving fails', async () => {
    const { user } = await openCreateForm()

    await choose(user, 'Warehouse', /Main Warehouse/)
    await choose(user, 'Product 1', /Industrial Oil/)
    setMockFailureEnabled(true)
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))

    expect(await screen.findByText(/Simulated server error/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save as Draft' })).toBeEnabled()
    expect(screen.getByRole('combobox', { name: 'Product 1' })).toHaveTextContent('Industrial Oil')
  })

  it('asks before discarding unsaved changes', async () => {
    const { user } = await openCreateForm()
    await choose(user, 'Warehouse', /Main Warehouse/)

    const nav = within(screen.getAllByRole('navigation', { name: 'Main navigation' })[0])
    await user.click(nav.getByRole('link', { name: 'Dashboard' }))
    const dialog = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
    expect(
      screen.getByRole('heading', { level: 2, name: 'Create Purchase Request' }),
    ).toBeInTheDocument()

    await user.click(nav.getByRole('link', { name: 'Dashboard' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Discard changes' }),
    )
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Procurement Overview' }),
    ).toBeInTheDocument()
  })

  it('tells an approver that only staff create requests', async () => {
    renderApp({ role: 'APPROVER', path: '/purchase-requests/new' })

    expect(
      await screen.findByText('Only warehouse staff can create purchase requests'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save as Draft' })).not.toBeInTheDocument()
  })
})

describe('edit purchase request form', () => {
  it('saves a changed quantity on a draft', async () => {
    const { user } = renderApp({ role: 'USER', path: '/purchase-requests/pr-0046/edit' })
    await screen.findByRole('combobox', { name: 'Warehouse' })

    await setQuantity(user, 'Quantity 1', '999')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'PR-2026-0046' }),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('999')).toBeInTheDocument()
  })

  it('refuses to edit a request that is no longer a draft', async () => {
    renderApp({ role: 'USER', path: '/purchase-requests/pr-0048/edit' })

    expect(await screen.findByText('Only draft requests can be edited')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument()
  })
})
