import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/purchase-requests/new')({
  component: NewPurchaseRequestPage,
})

function NewPurchaseRequestPage() {
  return (
    <>
      <PageHeader
        title="Create Purchase Request"
        description="Choose the receiving warehouse and the products you need."
      />
      <Card>
        <EmptyState
          title="No request form to show yet"
          description="Warehouse, product and quantity fields will appear here."
        />
      </Card>
    </>
  )
}
