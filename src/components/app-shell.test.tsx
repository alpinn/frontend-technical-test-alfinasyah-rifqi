import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderApp } from '@/test/render'

async function mainNav() {
  const regions = await screen.findAllByRole('navigation', { name: 'Main navigation' })
  return within(regions[0])
}

describe('application shell', () => {
  it('exposes the required procurement navigation', async () => {
    renderApp()

    const nav = await mainNav()
    for (const label of ['Dashboard', 'Purchase Requests', 'Purchase Orders', 'Inventory']) {
      expect(nav.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('offers goods receipt to a staff user', async () => {
    renderApp({ role: 'USER' })

    expect((await mainNav()).getByRole('link', { name: 'Goods Receipt' })).toBeInTheDocument()
  })

  it('hides goods receipt from an approver', async () => {
    renderApp({ role: 'APPROVER' })

    expect((await mainNav()).queryByRole('link', { name: 'Goods Receipt' })).not.toBeInTheDocument()
  })

  it('switches the active role from the top bar', async () => {
    const { user } = renderApp({ role: 'USER' })

    await user.click(await screen.findByRole('button', { name: /active role: staff/i }))
    await user.click(await screen.findByRole('menuitem', { name: /manager/i }))

    expect(screen.getByRole('button', { name: /active role: manager/i })).toBeInTheDocument()
    expect((await mainNav()).queryByRole('link', { name: 'Goods Receipt' })).not.toBeInTheDocument()
  })

  it('shows the page title for the active route', async () => {
    renderApp({ path: '/inventory' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Inventory' })).toBeInTheDocument()
  })
})
