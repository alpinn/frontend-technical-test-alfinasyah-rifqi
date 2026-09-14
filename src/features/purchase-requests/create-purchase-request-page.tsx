import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

import { createPurchaseRequest, syncPurchaseRequestCaches } from '@/api/purchase-requests'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackToRequestsLink } from '@/features/purchase-requests/back-to-requests-link'
import { PurchaseRequestForm } from '@/features/purchase-requests/purchase-request-form'
import { useRole } from '@/hooks/use-role'

export function CreatePurchaseRequestPage() {
  const { role } = useRole()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const create = useMutation({ mutationFn: createPurchaseRequest })

  const header = (
    <PageHeader
      title="Create Purchase Request"
      description="Choose the receiving warehouse and the products you need. The request is saved as a draft so it can be reviewed before it is submitted."
      backLink={<BackToRequestsLink />}
    />
  )

  if (role !== 'USER') {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Lock}
            title="Only warehouse staff can create purchase requests"
            description="Switch to the staff role from the top bar to raise a request."
            action={
              <Link
                to="/purchase-requests"
                search={{ page: 1 }}
                className={buttonVariants({ variant: 'outline' })}
              >
                Back to purchase requests
              </Link>
            }
          />
        </Card>
      </>
    )
  }

  return (
    <>
      {header}
      <PurchaseRequestForm
        defaultValues={{ warehouseId: '', items: [{ productId: '', quantity: 1 }], notes: '' }}
        submitLabel="Save as Draft"
        pendingLabel="Saving..."
        save={create.mutateAsync}
        onSaved={(request) => {
          toast.success(`${request.requestNumber} saved as a draft.`)
          void syncPurchaseRequestCaches(queryClient, request)
          void navigate({ to: '/purchase-requests/$requestId', params: { requestId: request.id } })
        }}
        cancel={
          <Link
            to="/purchase-requests"
            search={{ page: 1 }}
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancel
          </Link>
        }
      />
    </>
  )
}
