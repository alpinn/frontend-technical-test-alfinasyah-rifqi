import { createFileRoute } from '@tanstack/react-router'

import { InventoryItemPage } from '@/features/inventory/inventory-item-page'

export const Route = createFileRoute('/inventory/$itemId')({
  component: InventoryItemPage,
})
