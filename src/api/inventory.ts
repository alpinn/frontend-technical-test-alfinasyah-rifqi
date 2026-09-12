import { queryOptions } from '@tanstack/react-query'

import { apiRequest, toQueryString } from '@/api/client'
import type { InventoryItem, InventoryMovement, Paginated } from '@/types'

export type InventoryFilters = {
  search?: string
  warehouseId?: string
  page?: number
  pageSize?: number
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (filters: InventoryFilters) => ['inventory', 'list', filters] as const,
  detail: (id: string) => ['inventory', 'detail', id] as const,
  movements: (id: string) => ['inventory', 'movements', id] as const,
}

export function inventoryListQuery(filters: InventoryFilters) {
  return queryOptions({
    queryKey: inventoryKeys.list(filters),
    queryFn: () =>
      apiRequest<Paginated<InventoryItem>>(`/inventory${toQueryString({ ...filters })}`),
  })
}

export function inventoryItemQuery(id: string) {
  return queryOptions({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => apiRequest<InventoryItem>(`/inventory/${id}`),
  })
}

export function inventoryMovementsQuery(id: string) {
  return queryOptions({
    queryKey: inventoryKeys.movements(id),
    queryFn: () => apiRequest<InventoryMovement[]>(`/inventory/${id}/movements`),
  })
}
