import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

const searchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
  warehouseId: z.string().optional(),
  page: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/purchase-requests/')({
  validateSearch: searchSchema,
  component: PurchaseRequestListPage,
})

function PurchaseRequestListPage() {
  return (
    <>
      <PageHeader
        title="Purchase Requests"
        description="Every stock request raised across the warehouses, with its approval status."
      />
      <Card>
        <EmptyState
          title="No purchase requests to show yet"
          description="Search, status filters and the request table will appear here."
        />
      </Card>
    </>
  )
}
