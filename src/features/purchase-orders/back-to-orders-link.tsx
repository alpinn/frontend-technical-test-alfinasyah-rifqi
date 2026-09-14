import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Icon } from '@/components/icon'

export function BackToOrdersLink() {
  return (
    <Link
      to="/purchase-orders"
      search={{ page: 1 }}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-dark-normal hover:text-dark-active"
    >
      <Icon icon={ArrowLeft} className="size-3.5" />
      Purchase Orders
    </Link>
  )
}
