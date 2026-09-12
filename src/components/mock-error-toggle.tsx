import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  isMockFailureEnabled,
  setMockFailureEnabled,
  subscribeToMockFailure,
} from '@/mocks/failure'

export function MockErrorToggle() {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(isMockFailureEnabled)

  useEffect(() => {
    const unsubscribe = subscribeToMockFailure(setEnabled)
    return () => {
      unsubscribe()
    }
  }, [])

  if (!import.meta.env.DEV) return null

  return (
    <label className="mt-3 flex cursor-pointer items-center gap-2 px-2.5 text-2xs text-dark-light-active">
      <input
        type="checkbox"
        checked={enabled}
        className="size-3.5 accent-(--color-blue-normal)"
        onChange={(event) => {
          setMockFailureEnabled(event.target.checked)
          queryClient.invalidateQueries()
        }}
      />
      <span>Simulate API errors</span>
    </label>
  )
}
