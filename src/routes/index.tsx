import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Procurement Overview"
        description="Track purchase requests, orders, receiving progress, and procurement activity."
      />
      <Card>
        <EmptyState
          title="No overview to show yet"
          description="Summary cards and recent procurement activity will appear here."
        />
      </Card>
    </>
  )
}
