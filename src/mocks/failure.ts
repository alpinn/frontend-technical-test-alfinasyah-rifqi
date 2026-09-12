let failing = import.meta.env.VITE_MOCK_ERRORS === 'true'

const listeners = new Set<(value: boolean) => void>()

export function isMockFailureEnabled() {
  return failing
}

export function setMockFailureEnabled(value: boolean) {
  failing = value
  for (const listener of listeners) listener(value)
}

export function subscribeToMockFailure(listener: (value: boolean) => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
