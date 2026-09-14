import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, FileWarning, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/client'
import {
  purchaseRequestQuery,
  syncPurchaseRequestCaches,
  updatePurchaseRequest,
} from '@/api/purchase-requests'
import { Icon } from '@/components/icon'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackToRequestsLink } from '@/features/purchase-requests/back-to-requests-link'
import { PurchaseRequestForm } from '@/features/purchase-requests/purchase-request-form'
import { useRole } from '@/hooks/use-role'
import { statusLabel } from '@/lib/status'
import type { CreatePurchaseRequestInput } from '@/types'

const routeApi = getRouteApi('/purchase-requests/$requestId/edit')

export function EditPurchaseRequestPage() {
  const { requestId } = routeApi.useParams()
  const { role } = useRole()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(purchaseRequestQuery(requestId))
  const update = useMutation({
    mutationFn: (input: CreatePurchaseRequestInput) => updatePurchaseRequest(requestId, input),
  })

  const detailLink = (label: string) => (
    <Link
      to="/purchase-requests/$requestId"
      params={{ requestId }}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-dark-normal hover:text-dark-active"
    >
      <Icon icon={ArrowLeft} className="size-3.5" />
      {label}
    </Link>
  )

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Edit Purchase Request" backLink={<BackToRequestsLink />} />
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      </>
    )
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiRequestError && query.error.status === 404
    return (
      <>
        <PageHeader title="Edit Purchase Request" backLink={<BackToRequestsLink />} />
        <Card>
          {notFound ? (
            <EmptyState
              icon={FileWarning}
              title="This purchase request does not exist"
              description="It may have been removed, or the link is incorrect."
            />
          ) : (
            <ErrorState
              title="Unable to load this purchase request"
              description="Something went wrong while retrieving the request."
              onRetry={() => void query.refetch()}
            />
          )}
        </Card>
      </>
    )
  }

  const request = query.data
  const header = (
    <PageHeader
      title={`Edit ${request.requestNumber}`}
      description="Changes are saved to the draft. It stays a draft until you submit it."
      backLink={detailLink(request.requestNumber)}
    />
  )
  const openRequest = (
    <Link
      to="/purchase-requests/$requestId"
      params={{ requestId }}
      className={buttonVariants({ variant: 'outline' })}
    >
      Open {request.requestNumber}
    </Link>
  )

  if (role !== 'USER') {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Lock}
            title="Only warehouse staff can edit purchase requests"
            description="Switch to the staff role from the top bar to change a draft."
            action={openRequest}
          />
        </Card>
      </>
    )
  }

  if (request.status !== 'DRAFT') {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Lock}
            title="Only draft requests can be edited"
            description={`${request.requestNumber} is ${statusLabel(request.status).toLowerCase()}, so its items can no longer change.`}
            action={openRequest}
          />
        </Card>
      </>
    )
  }

  return (
    <>
      {header}
      <PurchaseRequestForm
        defaultValues={{
          warehouseId: request.warehouse.id,
          items: request.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          notes: request.notes ?? '',
        }}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
        save={update.mutateAsync}
        onSaved={(saved) => {
          toast.success(`${saved.requestNumber} updated.`)
          void syncPurchaseRequestCaches(queryClient, saved)
          void navigate({ to: '/purchase-requests/$requestId', params: { requestId: saved.id } })
        }}
        cancel={
          <Link
            to="/purchase-requests/$requestId"
            params={{ requestId }}
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancel
          </Link>
        }
      />
    </>
  )
}
