import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/purchase-requests/$requestId')({
  component: PurchaseRequestDetailPage,
})

function PurchaseRequestDetailPage() {
  return (
    <>
      <PageHeader
        title="Purchase Request"
        description="Request details, requested items and approval status."
      />
      <Card>
        <EmptyState
          title="No request details to show yet"
          description="Items, requester and approval actions will appear here."
        />
      </Card>
    </>
  )
}
