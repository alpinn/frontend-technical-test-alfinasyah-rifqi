import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PurchaseRequestListPage } from '@/features/purchase-requests/purchase-request-list-page'

const searchSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional().catch(undefined),
  warehouseId: z.string().optional().catch(undefined),
  sort: z.enum(['newest', 'oldest']).optional().catch(undefined),
  page: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/purchase-requests/')({
  validateSearch: searchSchema,
  component: PurchaseRequestListPage,
})
