import { setupWorker } from 'msw/browser'

import { handlers } from '@/mocks/handlers'

export const worker = setupWorker(...handlers)

function keepMockingActive() {
  const activate = () => navigator.serviceWorker.controller?.postMessage('MOCK_ACTIVATE')

  window.setInterval(activate, 2000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') activate()
  })
}

export async function startMockApi() {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
  keepMockingActive()
}
