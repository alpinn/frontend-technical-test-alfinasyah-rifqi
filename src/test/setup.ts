import '@testing-library/jest-dom/vitest'

import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { resetDb } from '@/mocks/db'
import { setMockFailureEnabled } from '@/mocks/failure'
import { server } from '@/mocks/server'

configure({ asyncUtilTimeout: 4000 })

beforeAll(() => {
  window.scrollTo = () => {}
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  setMockFailureEnabled(false)
  resetDb()
})

afterAll(() => server.close())
