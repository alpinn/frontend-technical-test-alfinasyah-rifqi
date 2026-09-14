import { createFileRoute } from '@tanstack/react-router'

import { PurchaseOrderDetailPage } from '@/features/purchase-orders/purchase-order-detail-page'

export const Route = createFileRoute('/purchase-orders/$orderId/')({
  component: PurchaseOrderDetailPage,
})
