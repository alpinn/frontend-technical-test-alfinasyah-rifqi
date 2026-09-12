import { queryOptions } from '@tanstack/react-query'

import { apiRequest, postJson, toQueryString } from '@/api/client'
import type {
  Paginated,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderSummary,
  ReceiveGoodsInput,
} from '@/types'

export type PurchaseOrderFilters = {
  search?: string
  status?: PurchaseOrderStatus | ''
  warehouseId?: string
  page?: number
  pageSize?: number
}

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  list: (filters: PurchaseOrderFilters) => ['purchase-orders', 'list', filters] as const,
  detail: (id: string) => ['purchase-orders', 'detail', id] as const,
}

export function purchaseOrderListQuery(filters: PurchaseOrderFilters) {
  return queryOptions({
    queryKey: purchaseOrderKeys.list(filters),
    queryFn: () =>
      apiRequest<Paginated<PurchaseOrderSummary>>(
        `/purchase-orders${toQueryString({ ...filters })}`,
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
