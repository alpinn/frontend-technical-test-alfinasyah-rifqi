import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { apiRequest, postJson, toQueryString } from '@/api/client'
import { dashboardQuery } from '@/api/dashboard'
import { inventoryKeys } from '@/api/inventory'
import type {
  Paginated,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderSummary,
  ReceiveGoodsInput,
} from '@/types'

export type PurchaseOrderFilters = {
  search?: string
  status?: PurchaseOrderStatus | PurchaseOrderStatus[] | ''
  warehouseId?: string
  page?: number
  pageSize?: number
}

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: ['purchase-orders', 'list'] as const,
  list: (filters: PurchaseOrderFilters) => ['purchase-orders', 'list', filters] as const,
  detail: (id: string) => ['purchase-orders', 'detail', id] as const,
}

export function purchaseOrderListQuery(filters: PurchaseOrderFilters) {
  const status = Array.isArray(filters.status) ? filters.status.join(',') : filters.status
  return queryOptions({
    queryKey: purchaseOrderKeys.list(filters),
    queryFn: () =>
      apiRequest<Paginated<PurchaseOrderSummary>>(
        `/purchase-orders${toQueryString({ ...filters, status })}`,
      ),
  })
}

export function purchaseOrderQuery(id: string) {
  return queryOptions({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => apiRequest<PurchaseOrder>(`/purchase-orders/${id}`),
  })
}

export function receiveGoods(purchaseOrderId: string, input: ReceiveGoodsInput) {
  return postJson<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}/receipts`, input)
}

export function syncPurchaseOrderCaches(queryClient: QueryClient, updated: PurchaseOrder) {
  queryClient.setQueryData(purchaseOrderKeys.detail(updated.id), updated)
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists }),
    queryClient.invalidateQueries({ queryKey: dashboardQuery.queryKey }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
  ])
}
