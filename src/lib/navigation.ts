import {
  Box,
  ChartNoAxesColumn,
  CircleCheck,
  FileText,
  House,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'

import type { Role } from '@/types'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles?: Role[]
}

export type NavGroup = {
  title?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Dashboard', icon: House },
      { to: '/purchase-requests', label: 'Purchase Requests', icon: FileText },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
      { to: '/inventory', label: 'Inventory', icon: Box },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/goods-receipt', label: 'Goods Receipt', icon: CircleCheck, roles: ['USER'] },
      { to: '/reports', label: 'Reports', icon: ChartNoAxesColumn },
    ],
  },
]

export const SETTINGS_ITEM: NavItem = { to: '/settings', label: 'Settings', icon: Settings }
