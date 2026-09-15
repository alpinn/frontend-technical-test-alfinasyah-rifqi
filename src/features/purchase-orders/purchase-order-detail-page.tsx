import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { FileWarning, PackageCheck } from 'lucide-react'
import { useState } from 'react'

import { ApiRequestError } from '@/api/client'
import { purchaseOrderQuery } from '@/api/purchase-orders'
import { DetailRow } from '@/components/detail-row'
import { Icon } from '@/components/icon'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { StatusBadge } from '@/components/status-badge'
import { StatusNotice, type NoticeTone } from '@/components/status-notice'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReceiveGoodsDialog } from '@/features/goods-receipt/receive-goods-dialog'
import { BackToOrdersLink } from '@/features/purchase-orders/back-to-orders-link'
import { useRole } from '@/hooks/use-role'
import { formatCount, formatDate, formatDateTime } from '@/lib/format'
import { receivingProgress, remainingQuantity } from '@/lib/purchase-order'
import type { PurchaseOrder } from '@/types'

const routeApi = getRouteApi('/purchase-orders/$orderId/')

const number = (value: number) => value.toLocaleString('en-US')

function noticeFor(order: PurchaseOrder): { tone: NoticeTone; title: string; detail?: string } {
  const progress = receivingProgress(order.items)
  switch (order.status) {
    case 'DRAFT':
      return {
        tone: 'neutral',
        title: 'This order is still a draft.',
        detail: 'It has not been sent to the supplier yet.',
      }
    case 'ORDERED':
      return {
        tone: 'info',
        title: 'Waiting for goods to arrive.',
        detail: `Nothing has been received yet against ${formatCount(progress.ordered, 'ordered unit')}.`,
      }
    case 'PARTIALLY_RECEIVED':
      return {
        tone: 'warning',
        title: 'Partially received.',
        detail: `${number(progress.received)} of ${number(progress.ordered)} units received. ${number(progress.remaining)} still to arrive.`,
      }
    case 'RECEIVED':
      return {
        tone: 'success',
        title: 'Fully received.',
        detail: 'Every item on this order has arrived and been added to stock.',
      }
    case 'CANCELLED':
      return {
        tone: 'neutral',
        title: 'This order was cancelled.',
        detail: 'Nothing can be received against it.',
      }
  }
}

function ReceivingCard({ order }: { order: PurchaseOrder }) {
  const overall = receivingProgress(order.items)

  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Items</CardTitle>
          <CardDescription>{formatCount(order.totalItems, 'item')}</CardDescription>
        </div>
      </CardHeader>

      <div className="border-b border-line px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-dark-active">Receiving progress</p>
          <p className="text-xs text-dark-normal tabular-nums">
            {number(overall.received)} / {number(overall.ordered)} received · {overall.percent}%
          </p>
        </div>
        <Progress
          className="mt-2"
          value={overall.percent}
          aria-label="Overall receiving progress"
          indicatorClassName={overall.remaining === 0 ? 'bg-success-fg' : undefined}
        />
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => {
              const progress = receivingProgress([item])
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="block font-medium">{item.product.name}</span>
                    <span className="block text-2xs text-dark-light-active">
                      {item.product.sku} · {item.product.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {number(item.orderedQuantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {number(item.receivedQuantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {number(remainingQuantity(item))}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Progress
                        className="w-24"
                        value={progress.percent}
                        aria-label={`${item.product.name} received`}
                        indicatorClassName={progress.remaining === 0 ? 'bg-success-fg' : undefined}
                      />
                      <span className="text-2xs text-dark-normal tabular-nums">
                        {number(item.receivedQuantity)} / {number(item.orderedQuantity)}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {order.items.map((item) => {
          const progress = receivingProgress([item])
          return (
            <li key={item.id} className="px-4 py-3">
              <span className="block text-sm font-medium text-dark-active">
                {item.product.name}
              </span>
              <span className="block text-2xs text-dark-light-active">
                {item.product.sku} · {item.product.unit}
              </span>
              <Progress
                className="mt-2"
                value={progress.percent}
                aria-label={`${item.product.name} received`}
                indicatorClassName={progress.remaining === 0 ? 'bg-success-fg' : undefined}
              />
              <span className="mt-1.5 block text-xs text-dark-normal tabular-nums">
                {number(item.receivedQuantity)} of {number(item.orderedQuantity)} received ·{' '}
                {number(remainingQuantity(item))} remaining
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ReceiptsCard({ order }: { order: PurchaseOrder }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Goods receipts</CardTitle>
          <CardDescription>Deliveries recorded against this order.</CardDescription>
        </div>
      </CardHeader>
      {order.receipts.length === 0 ? (
        <EmptyState
          className="min-h-0 py-8"
          title="No goods received yet"
          description="Each delivery recorded against this order will be listed here."
        />
      ) : (
        <ol aria-label="Goods receipts" className="divide-y divide-line">
          {order.receipts.map((receipt) => {
            const units = receipt.lines.reduce((total, line) => total + line.quantity, 0)
            return (
              <li
                key={receipt.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-dark-active">
                    {receipt.receiptNumber}
                  </span>
                  <span className="block text-2xs text-dark-light-active">
                    Received by {receipt.receivedBy} · {formatDateTime(receipt.receivedAt)}
                  </span>
                </span>
                <span className="text-xs text-dark-normal">
                  {formatCount(receipt.lines.length, 'product')} · {formatCount(units, 'unit')}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

function DetailsCard({ order }: { order: PurchaseOrder }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <dl className="divide-y divide-line">
        <DetailRow label="Status">
          <StatusBadge status={order.status} />
        </DetailRow>
        <DetailRow label="Supplier">{order.supplier.name}</DetailRow>
        <DetailRow label="Warehouse">{order.warehouse.name}</DetailRow>
        <DetailRow label="Created">{formatDateTime(order.createdAt)}</DetailRow>
        <DetailRow label="Expected Delivery">
          {order.expectedDate ? formatDate(order.expectedDate) : 'Not scheduled'}
        </DetailRow>
        <DetailRow label="Purchase Request">
          {order.purchaseRequestId && order.purchaseRequestNumber ? (
            <Link
              to="/purchase-requests/$requestId"
              params={{ requestId: order.purchaseRequestId }}
              className="text-blue-normal hover:underline"
            >
              {order.purchaseRequestNumber}
            </Link>
          ) : (
            'Not linked'
          )}
        </DetailRow>
      </dl>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading purchase order">
      <Skeleton className="mb-3 h-3 w-28" />
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-6 h-3.5 w-72" />
      <Card>
        <SkeletonRows rows={4} />
      </Card>
    </div>
  )
}

export function PurchaseOrderDetailPage() {
  const { orderId } = routeApi.useParams()
  const { role } = useRole()
  const [isReceiving, setIsReceiving] = useState(false)
  const query = useQuery(purchaseOrderQuery(orderId))

  if (query.isPending) return <DetailSkeleton />

  if (query.isError) {
    const notFound = query.error instanceof ApiRequestError && query.error.status === 404
    return (
      <>
        <PageHeader
          title={notFound ? 'Purchase order not found' : 'Purchase Order'}
          backLink={<BackToOrdersLink />}
        />
        <Card>
          {notFound ? (
            <EmptyState
              icon={FileWarning}
              title="This purchase order does not exist"
              description="It may have been removed, or the link is incorrect."
              action={
                <Link
                  to="/purchase-orders"
                  search={{ page: 1 }}
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Back to purchase orders
                </Link>
              }
            />
          ) : (
            <ErrorState
              title="Unable to load this purchase order"
              description="Something went wrong while retrieving the order."
              onRetry={() => void query.refetch()}
            />
          )}
        </Card>
      </>
    )
  }

  const order = query.data
  const canReceive =
    role === 'USER' && (order.status === 'ORDERED' || order.status === 'PARTIALLY_RECEIVED')

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        badge={<StatusBadge status={order.status} />}
        description={`Ordered from ${order.supplier.name} for ${order.warehouse.name}.`}
        backLink={<BackToOrdersLink />}
        actions={
          canReceive ? (
            <Button onClick={() => setIsReceiving(true)}>
              <Icon icon={PackageCheck} />
              Receive Goods
            </Button>
          ) : null
        }
      />
      <StatusNotice {...noticeFor(order)} />
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-3">
          <ReceivingCard order={order} />
          <ReceiptsCard order={order} />
        </div>
        <DetailsCard order={order} />
      </div>
      {canReceive ? (
        <ReceiveGoodsDialog orderId={order.id} open={isReceiving} onOpenChange={setIsReceiving} />
      ) : null}
    </>
  )
}
