import type { CurrentUser, Role } from '@/types'

export const USERS: Record<Role, CurrentUser> = {
  USER: {
    id: 'u-john',
    name: 'John Doe',
    jobTitle: 'Warehouse Staff',
    initials: 'JD',
    role: 'USER',
  },
  APPROVER: {
    id: 'u-alex',
    name: 'Alex Morgan',
    jobTitle: 'Procurement Manager',
    initials: 'AM',
    role: 'APPROVER',
  },
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Staff',
  APPROVER: 'Manager',
}
