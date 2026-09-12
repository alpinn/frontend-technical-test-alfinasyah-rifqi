import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

const searchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  warehouseId: z.string().optional(),
  page: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/purchase-orders/')({
  validateSearch: searchSchema,
  component: PurchaseOrderListPage,
})

function PurchaseOrderListPage() {
  return (
    <>
      <PageHeader
        title="Purchase Orders"
        description="Orders raised from approved requests, and how much of each has been received."
      />
      <Card>
        <EmptyState
          title="No purchase orders to show yet"
          description="Search, status filters and receiving progress will appear here."
        />
      </Card>
    </>
  )
}
