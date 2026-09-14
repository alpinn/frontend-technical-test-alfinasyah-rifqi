import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PurchaseOrderListPage } from '@/features/purchase-orders/purchase-order-list-page'

const searchSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z
    .enum(['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'])
    .optional()
    .catch(undefined),
  warehouseId: z.string().optional().catch(undefined),
  page: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/purchase-orders/')({
  validateSearch: searchSchema,
  component: PurchaseOrderListPage,
})
