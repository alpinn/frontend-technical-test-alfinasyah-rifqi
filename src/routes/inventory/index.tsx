import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

const searchSchema = z.object({
  search: z.string().optional(),
  warehouseId: z.string().optional(),
  page: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/inventory/')({
  validateSearch: searchSchema,
  component: InventoryPage,
})

function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Current stock on hand per product and warehouse."
      />
      <Card>
        <EmptyState
          title="No stock to show yet"
          description="Stock levels per product and warehouse will appear here."
        />
      </Card>
    </>
  )
}
