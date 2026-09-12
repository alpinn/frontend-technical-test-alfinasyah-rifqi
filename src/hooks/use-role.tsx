import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { USERS } from '@/lib/users'
import type { CurrentUser, Role } from '@/types'

type RoleContextValue = {
  role: Role
  user: CurrentUser
  setRole: (role: Role) => void
  isApprover: boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({
  children,
  initialRole = 'USER',
}: {
  children: ReactNode
  initialRole?: Role
}) {
  const [role, setRoleState] = useState<Role>(initialRole)

  const setRole = useCallback((next: Role) => setRoleState(next), [])

  const value = useMemo<RoleContextValue>(
    () => ({ role, user: USERS[role], setRole, isApprover: role === 'APPROVER' }),
    [role, setRole],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useRole must be used inside a RoleProvider')
  return context
}
