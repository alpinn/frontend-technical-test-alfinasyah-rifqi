import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { FileWarning } from 'lucide-react'

import { ApiRequestError } from '@/api/client'
import { inventoryItemQuery, inventoryMovementsQuery } from '@/api/inventory'
import { DetailRow } from '@/components/detail-row'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BackToInventoryLink } from '@/features/inventory/back-to-inventory-link'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { InventoryItem, InventoryMovementType } from '@/types'

const routeApi = getRouteApi('/inventory/$itemId')

const MOVEMENT_LABEL: Record<InventoryMovementType, string> = {
  PURCHASE_RECEIPT: 'Purchase receipt',
  ADJUSTMENT: 'Stock adjustment',
}

function MovementHistory({ stock }: { stock: InventoryItem }) {
  const movements = useQuery(inventoryMovementsQuery(stock.id))

  function renderBody() {
    if (movements.isPending) return <SkeletonRows rows={4} />
    if (movements.isError) {
      return (
        <ErrorState
          title="Unable to load the movement history"
          description="Something went wrong while retrieving stock movements."
          onRetry={() => void movements.refetch()}
        />
      )
    }
    if (movements.data.length === 0) {
      return (
        <EmptyState
          className="min-h-0 py-8"
          title="No movements yet"
          description="Receipts and adjustments to this stock will be listed here."
        />
      )
    }
    return (
      <ol aria-label="Movement history" className="divide-y divide-line">
        {movements.data.map((movement) => (
          <li key={movement.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-active">
                {MOVEMENT_LABEL[movement.type]}
              </span>
              <span className="block text-2xs text-dark-light-active">
                {movement.reference} · {formatDateTime(movement.occurredAt)}
              </span>
            </span>
            <span
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                movement.quantity >= 0 ? 'text-success-fg' : 'text-danger-fg',
              )}
            >
              {movement.quantity >= 0 ? '+' : ''}
              {movement.quantity.toLocaleString('en-US')} {stock.product.unit}
            </span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Movement History</CardTitle>
          <CardDescription>Every change to this stock, newest first.</CardDescription>
        </div>
      </CardHeader>
      {renderBody()}
    </Card>
  )
}

export function InventoryItemPage() {
  const { itemId } = routeApi.useParams()
  const query = useQuery(inventoryItemQuery(itemId))

  if (query.isPending) {
    return (
      <div role="status" aria-label="Loading stock item">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-6 h-3.5 w-44" />
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      </div>
    )
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiRequestError && query.error.status === 404
    return (
      <>
        <PageHeader
          title={notFound ? 'Stock item not found' : 'Inventory'}
          backLink={<BackToInventoryLink />}
        />
        <Card>
          {notFound ? (
            <EmptyState
              icon={FileWarning}
              title="This stock item does not exist"
              description="It may have been removed, or the link is incorrect."
            />
          ) : (
            <ErrorState
              title="Unable to load this stock item"
              description="Something went wrong while retrieving the stock level."
              onRetry={() => void query.refetch()}
            />
          )}
        </Card>
      </>
    )
  }

  const stock = query.data

  return (
    <>
      <PageHeader
        title={stock.product.name}
        description={`${stock.product.sku} · ${stock.warehouse.name}`}
        backLink={<BackToInventoryLink />}
      />
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Current Stock</CardTitle>
          </CardHeader>
          <div className="border-b border-line px-4 py-4">
            <p className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-dark-active tabular-nums">
                {stock.currentStock.toLocaleString('en-US')}
              </span>
              <span className="text-sm font-medium text-dark-normal">{stock.product.unit}</span>
            </p>
            <p className="mt-1 text-2xs text-dark-light-active">
              On hand in {stock.warehouse.name}
            </p>
          </div>
          <dl className="divide-y divide-line">
            <DetailRow label="Product">{stock.product.name}</DetailRow>
            <DetailRow label="SKU">{stock.product.sku}</DetailRow>
            <DetailRow label="Warehouse">{stock.warehouse.name}</DetailRow>
            <DetailRow label="Unit">{stock.product.unit}</DetailRow>
          </dl>
        </Card>
        <MovementHistory stock={stock} />
      </div>
    </>
  )
}
