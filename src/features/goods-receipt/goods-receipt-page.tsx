import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Lock, PackageCheck, SearchX } from 'lucide-react'
import { useCallback, useState } from 'react'

import { purchaseOrderListQuery } from '@/api/purchase-orders'
import { Icon } from '@/components/icon'
import { ListFilters, type ListFilterValues } from '@/components/list-filters'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReceiveGoodsDialog } from '@/features/goods-receipt/receive-goods-dialog'
import { PurchaseOrderTable } from '@/features/purchase-orders/purchase-order-table'
import { useRole } from '@/hooks/use-role'
import { cn } from '@/lib/utils'
import type { PurchaseOrderStatus } from '@/types'

const PAGE_SIZE = 10
const RECEIVABLE_STATUSES: PurchaseOrderStatus[] = ['ORDERED', 'PARTIALLY_RECEIVED']
const routeApi = getRouteApi('/goods-receipt/')

export function GoodsReceiptPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { role } = useRole()
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null)
  const isStaff = role === 'USER'

  const query = useQuery({
    ...purchaseOrderListQuery({
      search: search.search,
      warehouseId: search.warehouseId,
      status: RECEIVABLE_STATUSES,
      page: search.page,
      pageSize: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    enabled: isStaff,
  })

  const applyFilters = useCallback(
    (patch: ListFilterValues<never>) =>
      navigate({ search: (previous) => ({ ...previous, ...patch, page: 1 }), replace: true }),
    [navigate],
  )

  const clearFilters = useCallback(
    () => navigate({ search: { page: 1 }, replace: true }),
    [navigate],
  )

  const header = (
    <PageHeader
      title="Goods Receipt"
      description="Purchase orders still waiting for goods. Record each delivery as it arrives, and stock is updated straight away."
    />
  )

  if (!isStaff) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Lock}
            title="Goods receipt is recorded by warehouse staff"
            description="Switch to the staff role from the top bar to record a delivery."
            action={
              <Link
                to="/purchase-orders"
                search={{ page: 1 }}
                className={buttonVariants({ variant: 'outline' })}
              >
                View purchase orders
              </Link>
            }
          />
        </Card>
      </>
    )
  }

  const hasFilters = Boolean(search.search || search.warehouseId)

  function renderContent() {
    if (query.isPending) return <SkeletonRows rows={8} />

    if (query.isError) {
      return (
        <ErrorState
          title="Unable to load orders waiting for goods"
          description="Something went wrong while retrieving purchase orders."
          onRetry={() => void query.refetch()}
        />
      )
    }

    const { data, meta } = query.data

    if (meta.total === 0 && !hasFilters) {
      return (
        <EmptyState
          icon={PackageCheck}
          title="Nothing is waiting to be received"
          description="Every purchase order has been fully received or cancelled."
          action={
            <Link
              to="/purchase-orders"
              search={{ page: 1 }}
              className={buttonVariants({ variant: 'outline' })}
            >
              View purchase orders
            </Link>
          }
        />
      )
    }

    if (meta.total === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No orders match these filters"
          description="Try a different search term, or clear the filters to see every order waiting for goods."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Show all orders
            </Button>
          }
        />
      )
    }

    return (
      <div
        aria-busy={query.isPlaceholderData}
        className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}
      >
        <PurchaseOrderTable
          rows={data}
          renderAction={(row) => (
            <Button
              size="sm"
              onClick={() => setReceivingOrderId(row.id)}
              aria-label={`Receive goods for ${row.orderNumber}`}
            >
              <Icon icon={PackageCheck} />
              Receive
            </Button>
          )}
        />
        <Pagination
          meta={meta}
          label="orders waiting for goods"
          onPageChange={(page) => navigate({ search: (previous) => ({ ...previous, page }) })}
        />
      </div>
    )
  }

  return (
    <>
      {header}
      <Card>
        <ListFilters
          value={{ search: search.search, warehouseId: search.warehouseId }}
          onChange={applyFilters}
          onReset={clearFilters}
          searchLabel="Search by order number, supplier or warehouse"
          searchPlaceholder="Search by number, supplier or warehouse"
        />
        {renderContent()}
      </Card>
      <ReceiveGoodsDialog
        orderId={receivingOrderId ?? ''}
        open={receivingOrderId !== null}
        onOpenChange={(open) => (open ? undefined : setReceivingOrderId(null))}
      />
    </>
  )
}
