import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

import { RoleProvider } from '@/hooks/use-role'
import { routeTree } from '@/routeTree.gen'
import type { Role } from '@/types'

function testQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactNode,
  { role = 'USER' as Role }: { role?: Role } = {},
) {
  const queryClient = testQueryClient()

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RoleProvider initialRole={role}>{ui}</RoleProvider>
      </QueryClientProvider>,
    ),
  }
}

export function renderApp({
  role = 'USER' as Role,
  path = '/',
}: { role?: Role; path?: string } = {}) {
  const queryClient = testQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  return {
    user: userEvent.setup(),
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RoleProvider initialRole={role}>
          <RouterProvider router={router} />
        </RoleProvider>
      </QueryClientProvider>,
    ),
  }
}
