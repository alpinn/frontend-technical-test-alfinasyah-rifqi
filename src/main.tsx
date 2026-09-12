import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Toaster } from '@/components/ui/sonner'
import { RoleProvider } from '@/hooks/use-role'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

import './index.css'

const queryClient = createQueryClient()
const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const { startMockApi } = await import('@/mocks/browser')
await startMockApi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <RouterProvider router={router} />
        <Toaster />
      </RoleProvider>
    </QueryClientProvider>
  </StrictMode>,
)
