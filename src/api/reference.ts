import { queryOptions } from '@tanstack/react-query'

import { apiRequest } from '@/api/client'
import type { Product, Supplier, Warehouse } from '@/types'

export const warehousesQuery = queryOptions({
  queryKey: ['warehouses'],
  queryFn: () => apiRequest<Warehouse[]>('/warehouses'),
  staleTime: Infinity,
})

export const productsQuery = queryOptions({
  queryKey: ['products'],
  queryFn: () => apiRequest<Product[]>('/products'),
  staleTime: Infinity,
})

export const suppliersQuery = queryOptions({
  queryKey: ['suppliers'],
  queryFn: () => apiRequest<Supplier[]>('/suppliers'),
  staleTime: Infinity,
})
