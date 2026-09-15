import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { GoodsReceiptPage } from '@/features/goods-receipt/goods-receipt-page'

const searchSchema = z.object({
  search: z.string().optional().catch(undefined),
  warehouseId: z.string().optional().catch(undefined),
  page: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/goods-receipt/')({
  validateSearch: searchSchema,
  component: GoodsReceiptPage,
})
