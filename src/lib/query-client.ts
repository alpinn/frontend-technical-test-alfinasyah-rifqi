import { QueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@/api/client'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiRequestError && error.status < 500) return false
          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
