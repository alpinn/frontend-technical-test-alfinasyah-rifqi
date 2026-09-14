import { createFileRoute } from '@tanstack/react-router'

import { CreatePurchaseRequestPage } from '@/features/purchase-requests/create-purchase-request-page'

export const Route = createFileRoute('/purchase-requests/new')({
  component: CreatePurchaseRequestPage,
})
