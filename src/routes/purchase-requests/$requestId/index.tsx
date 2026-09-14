import { createFileRoute } from '@tanstack/react-router'

import { PurchaseRequestDetailPage } from '@/features/purchase-requests/purchase-request-detail-page'

export const Route = createFileRoute('/purchase-requests/$requestId/')({
  component: PurchaseRequestDetailPage,
})
