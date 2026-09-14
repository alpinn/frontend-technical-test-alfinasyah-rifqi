import { createFileRoute } from '@tanstack/react-router'

import { EditPurchaseRequestPage } from '@/features/purchase-requests/edit-purchase-request-page'

export const Route = createFileRoute('/purchase-requests/$requestId/edit')({
  component: EditPurchaseRequestPage,
})
