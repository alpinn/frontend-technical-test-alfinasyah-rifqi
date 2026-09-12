import { setupWorker } from 'msw/browser'

import { handlers } from '@/mocks/handlers'

export const worker = setupWorker(...handlers)

export async function startMockApi() {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
