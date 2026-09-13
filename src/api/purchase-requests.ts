import { queryOptions } from '@tanstack/react-query'

import { apiRequest, postJson, putJson, toQueryString } from '@/api/client'
import type {
  CreatePurchaseRequestInput,
  Paginated,
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchaseRequestSummary,
} from '@/types'

export type PurchaseRequestSort = 'newest' | 'oldest'

export type PurchaseRequestFilters = {
  search?: string
  status?: PurchaseRequestStatus | ''
  warehouseId?: string
  sort?: PurchaseRequestSort
  page?: number
  pageSize?: number
}

export const purchaseRequestKeys = {
  all: ['purchase-requests'] as const,
  list: (filters: PurchaseRequestFilters) => ['purchase-requests', 'list', filters] as const,
  detail: (id: string) => ['purchase-requests', 'detail', id] as const,
}

export function purchaseRequestListQuery(filters: PurchaseRequestFilters) {
  return queryOptions({
    queryKey: purchaseRequestKeys.list(filters),
    queryFn: () =>
      apiRequest<Paginated<PurchaseRequestSummary>>(
        `/purchase-requests${toQueryString({ ...filters })}`,
      ),
  })
}

export function purchaseRequestQuery(id: string) {
  return queryOptions({
    queryKey: purchaseRequestKeys.detail(id),
    queryFn: () => apiRequest<PurchaseRequest>(`/purchase-requests/${id}`),
  })
}

export function createPurchaseRequest(input: CreatePurchaseRequestInput) {
  return postJson<PurchaseRequest>('/purchase-requests', input)
}

export function updatePurchaseRequest(id: string, input: CreatePurchaseRequestInput) {
  return putJson<PurchaseRequest>(`/purchase-requests/${id}`, input)
}

export function submitPurchaseRequest(id: string) {
  return postJson<PurchaseRequest>(`/purchase-requests/${id}/submit`)
}

export function approvePurchaseRequest(id: string) {
  return postJson<PurchaseRequest>(`/purchase-requests/${id}/approve`)
}

export function rejectPurchaseRequest(id: string, reason: string) {
  return postJson<PurchaseRequest>(`/purchase-requests/${id}/reject`, { reason })
}
