import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'

export function CreatePurchaseRequestLink() {
  return (
    <Button asChild>
      <Link to="/purchase-requests/new">
        <Icon icon={Plus} />
        Create Purchase Request
      </Link>
    </Button>
  )
}
