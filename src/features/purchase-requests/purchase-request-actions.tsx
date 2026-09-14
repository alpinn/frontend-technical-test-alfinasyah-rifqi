import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, Pencil, Send, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/client'
import {
  approvePurchaseRequest,
  purchaseRequestKeys,
  submitPurchaseRequest,
  syncPurchaseRequestCaches,
} from '@/api/purchase-requests'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Icon } from '@/components/icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { RejectRequestDialog } from '@/features/purchase-requests/reject-request-dialog'
import { formatCount } from '@/lib/format'
import type { PurchaseRequest, Role } from '@/types'

type OpenDialog = 'submit' | 'approve' | 'reject' | null

function reportActionError(error: unknown, queryClient: QueryClient, requestId: string) {
  toast.error(
    error instanceof ApiRequestError ? error.message : 'Something went wrong. Please try again.',
  )
  if (error instanceof ApiRequestError && error.status === 409) {
    void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.detail(requestId) })
  }
}

export function PurchaseRequestActions({
  request,
  role,
}: {
  request: PurchaseRequest
  role: Role
}) {
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)

  const submit = useMutation({
    mutationFn: () => submitPurchaseRequest(request.id),
    onSuccess: async (updated) => {
      setOpenDialog(null)
      toast.success(`${updated.requestNumber} submitted for approval.`)
      await syncPurchaseRequestCaches(queryClient, updated)
    },
    onError: (error) => reportActionError(error, queryClient, request.id),
  })

  const approve = useMutation({
    mutationFn: () => approvePurchaseRequest(request.id),
    onSuccess: async (updated) => {
      setOpenDialog(null)
      toast.success(
        `${updated.requestNumber} approved. ${updated.purchaseOrderNumber} was created.`,
      )
      await syncPurchaseRequestCaches(queryClient, updated)
    },
    onError: (error) => reportActionError(error, queryClient, request.id),
  })

  const dialogChange = (dialog: Exclude<OpenDialog, null>) => (open: boolean) =>
    setOpenDialog(open ? dialog : null)

  if (role === 'USER' && request.status === 'DRAFT') {
    return (
      <>
        <Link
          to="/purchase-requests/$requestId/edit"
          params={{ requestId: request.id }}
          className={buttonVariants({ variant: 'outline' })}
        >
          <Icon icon={Pencil} />
          Edit
        </Link>
        <Button onClick={() => setOpenDialog('submit')}>
          <Icon icon={Send} />
          Submit for Approval
        </Button>
        <ConfirmDialog
          open={openDialog === 'submit'}
          onOpenChange={dialogChange('submit')}
          title="Submit Purchase Request?"
          description={`${request.requestNumber} will be sent to a manager for approval. It can no longer be edited once submitted.`}
          confirmLabel="Submit"
          pendingLabel="Submitting..."
          isPending={submit.isPending}
          onConfirm={() => submit.mutate()}
        />
      </>
    )
  }

  if (role === 'APPROVER' && request.status === 'SUBMITTED') {
    return (
      <>
        <Button variant="destructive" onClick={() => setOpenDialog('reject')}>
          <Icon icon={X} />
          Reject
        </Button>
        <Button onClick={() => setOpenDialog('approve')}>
          <Icon icon={Check} />
          Approve
        </Button>
        <ConfirmDialog
          open={openDialog === 'approve'}
          onOpenChange={dialogChange('approve')}
          title="Approve Purchase Request?"
          description={`${request.requestNumber} will move to Approved, and a purchase order will be created for its ${formatCount(request.totalItems, 'item')}.`}
          confirmLabel="Approve"
          pendingLabel="Approving..."
          isPending={approve.isPending}
          onConfirm={() => approve.mutate()}
        />
        <RejectRequestDialog
          request={request}
          open={openDialog === 'reject'}
          onOpenChange={dialogChange('reject')}
        />
      </>
    )
  }

  return null
}
