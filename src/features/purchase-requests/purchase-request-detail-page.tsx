import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { FileWarning } from 'lucide-react'

import { ApiRequestError } from '@/api/client'
import { purchaseRequestQuery } from '@/api/purchase-requests'
import { DetailRow } from '@/components/detail-row'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { StatusBadge } from '@/components/status-badge'
import { StatusNotice, type NoticeTone } from '@/components/status-notice'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BackToRequestsLink } from '@/features/purchase-requests/back-to-requests-link'
import { PurchaseRequestActions } from '@/features/purchase-requests/purchase-request-actions'
import { useRole } from '@/hooks/use-role'
import { formatCount, formatDateTime, formatQuantity } from '@/lib/format'
import type { PurchaseRequest, Role } from '@/types'

const routeApi = getRouteApi('/purchase-requests/$requestId/')

function noticeFor(
  request: PurchaseRequest,
  role: Role,
): { tone: NoticeTone; title: string; detail?: string } {
  switch (request.status) {
    case 'DRAFT':
      return role === 'USER'
        ? {
            tone: 'neutral',
            title: 'This request is a draft.',
            detail: 'Edit it as needed, then submit it for a manager to review.',
          }
        : {
            tone: 'neutral',
            title: 'This request is still a draft.',
            detail: 'It can be reviewed once warehouse staff submit it.',
          }
    case 'SUBMITTED':
      return role === 'APPROVER'
        ? { tone: 'info', title: 'This request is waiting for your decision.' }
        : {
            tone: 'info',
            title: 'Waiting for approval.',
            detail: 'A manager will approve or reject this request. It can no longer be edited.',
          }
    case 'APPROVED':
      return {
        tone: 'success',
        title: `Approved by ${request.approvedBy} on ${request.approvedAt ? formatDateTime(request.approvedAt) : 'an unknown date'}.`,
        detail: request.purchaseOrderNumber
          ? `Purchase order ${request.purchaseOrderNumber} was created from this request.`
          : undefined,
      }
    case 'REJECTED':
      return {
        tone: 'danger',
        title: `Rejected by ${request.rejectedBy} on ${request.rejectedAt ? formatDateTime(request.rejectedAt) : 'an unknown date'}.`,
        detail: request.rejectionReason ? `Reason: ${request.rejectionReason}` : undefined,
      }
  }
}

function ItemsCard({ request }: { request: PurchaseRequest }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Items</CardTitle>
        <span className="text-xs text-dark-normal">{formatCount(request.totalItems, 'item')}</span>
      </CardHeader>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product.name}</TableCell>
                <TableCell className="text-dark-normal">{item.product.sku}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity.toLocaleString('en-US')}
                </TableCell>
                <TableCell>{item.product.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {request.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-active">
                {item.product.name}
              </span>
              <span className="block text-2xs text-dark-light-active">SKU: {item.product.sku}</span>
            </span>
            <span className="text-sm font-medium text-dark-active">
              {formatQuantity(item.quantity, item.product.unit)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DetailsCard({ request }: { request: PurchaseRequest }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <dl className="divide-y divide-line">
        <DetailRow label="Status">
          <StatusBadge status={request.status} />
        </DetailRow>
        <DetailRow label="Warehouse">{request.warehouse.name}</DetailRow>
        <DetailRow label="Requested By">{request.requestedBy}</DetailRow>
        <DetailRow label="Created">{formatDateTime(request.createdAt)}</DetailRow>
        <DetailRow label="Submitted">
          {request.submittedAt ? formatDateTime(request.submittedAt) : 'Not submitted yet'}
        </DetailRow>
        {request.purchaseOrderId && request.purchaseOrderNumber ? (
          <DetailRow label="Purchase Order">
            <Link
              to="/purchase-orders/$orderId"
              params={{ orderId: request.purchaseOrderId }}
              className="text-blue-normal hover:underline"
            >
              {request.purchaseOrderNumber}
            </Link>
          </DetailRow>
        ) : null}
      </dl>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading purchase request">
      <Skeleton className="mb-3 h-3 w-28" />
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-6 h-3.5 w-72" />
      <Card>
        <SkeletonRows rows={4} />
      </Card>
    </div>
  )
}

export function PurchaseRequestDetailPage() {
  const { requestId } = routeApi.useParams()
  const { role } = useRole()
  const query = useQuery(purchaseRequestQuery(requestId))

  if (query.isPending) return <DetailSkeleton />

  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.status === 404) {
      return (
        <>
          <PageHeader title="Purchase request not found" backLink={<BackToRequestsLink />} />
          <Card>
            <EmptyState
              icon={FileWarning}
              title="This purchase request does not exist"
              description="It may have been removed, or the link is incorrect."
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
        <PageHeader title="Purchase Request" backLink={<BackToRequestsLink />} />
        <Card>
          <ErrorState
            title="Unable to load this purchase request"
            description="Something went wrong while retrieving the request."
            onRetry={() => void query.refetch()}
          />
        </Card>
      </>
    )
  }

  const request = query.data

  return (
    <>
      <PageHeader
        title={request.requestNumber}
        badge={<StatusBadge status={request.status} />}
        description={`Requested by ${request.requestedBy} for ${request.warehouse.name}.`}
        backLink={<BackToRequestsLink />}
        actions={<PurchaseRequestActions request={request} role={role} />}
      />
      <StatusNotice {...noticeFor(request, role)} />
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-3">
          <ItemsCard request={request} />
          {request.notes ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <p className="px-4 py-3.5 text-xs whitespace-pre-line text-dark-normal-active">
                {request.notes}
              </p>
            </Card>
          ) : null}
        </div>
        <DetailsCard request={request} />
      </div>
    </>
  )
}
