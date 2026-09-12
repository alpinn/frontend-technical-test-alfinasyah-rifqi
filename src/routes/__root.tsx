import { createRootRoute, Outlet } from '@tanstack/react-router'
import { FileWarning } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" />
      <Card>
        <EmptyState
          icon={FileWarning}
          title="This page does not exist"
          description="Use the navigation to get back to a procurement workflow."
        />
      </Card>
    </>
  )
}
