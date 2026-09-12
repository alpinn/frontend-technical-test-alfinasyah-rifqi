import { queryOptions } from '@tanstack/react-query'

import { apiRequest } from '@/api/client'
import type { DashboardSummary } from '@/types'

export const dashboardQuery = queryOptions({
  queryKey: ['dashboard'],
  queryFn: () => apiRequest<DashboardSummary>('/dashboard'),
})
