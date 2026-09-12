import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/goods-receipt/')({
  component: GoodsReceiptPage,
})

function GoodsReceiptPage() {
  return (
    <>
      <PageHeader
        title="Goods Receipt"
        description="Record the goods arriving against an ordered purchase order."
      />
      <Card>
        <EmptyState
          title="Nothing to receive yet"
          description="Orders that are ready to receive will appear here."
        />
      </Card>
    </>
  )
}
