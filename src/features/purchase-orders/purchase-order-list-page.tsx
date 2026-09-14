import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { SearchX, ShoppingCart } from 'lucide-react'
import { useCallback } from 'react'

import { purchaseOrderListQuery } from '@/api/purchase-orders'
import { ListFilters, type ListFilterValues } from '@/components/list-filters'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PurchaseOrderTable } from '@/features/purchase-orders/purchase-order-table'
import { PURCHASE_ORDER_STATUSES, STATUS_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { PurchaseOrderStatus } from '@/types'

const PAGE_SIZE = 10
const routeApi = getRouteApi('/purchase-orders/')
const STATUS_OPTIONS = PURCHASE_ORDER_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABEL[status],
}))

export function PurchaseOrderListPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const query = useQuery({
    ...purchaseOrderListQuery({
      search: search.search,
      status: search.status,
      warehouseId: search.warehouseId,
      page: search.page,
      pageSize: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  })

  const applyFilters = useCallback(
    (patch: ListFilterValues<PurchaseOrderStatus>) =>
      navigate({ search: (previous) => ({ ...previous, ...patch, page: 1 }), replace: true }),
    [navigate],
  )

  const clearFilters = useCallback(
    () => navigate({ search: { page: 1 }, replace: true }),
    [navigate],
  )

  const hasFilters = Boolean(search.search || search.status || search.warehouseId)

  function renderContent() {
    if (query.isPending) return <SkeletonRows rows={8} />

    if (query.isError) {
      return (
        <ErrorState
          title="Unable to load purchase orders"
          description="Something went wrong while retrieving purchase orders."
          onRetry={() => void query.refetch()}
        />
      )
    }

    const { data, meta } = query.data

    if (meta.total === 0 && !hasFilters) {
      return (
        <EmptyState
          icon={ShoppingCart}
          title="No purchase orders yet"
          description="A purchase order is created automatically when a manager approves a purchase request."
          action={
            <Link
              to="/purchase-requests"
              search={{ page: 1 }}
              className={buttonVariants({ variant: 'outline' })}
            >
              View purchase requests
            </Link>
          }
        />
      )
    }

    if (meta.total === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No purchase orders match these filters"
          description="Try a different search term, or clear the filters to see every order."
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
        <PurchaseOrderTable rows={data} />
        <Pagination
          meta={meta}
          label="purchase orders"
          onPageChange={(page) => navigate({ search: (previous) => ({ ...previous, page }) })}
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        description="Orders created from approved purchase requests, and how much of each has been received."
      />
      <Card>
        <ListFilters
          value={{ search: search.search, status: search.status, warehouseId: search.warehouseId }}
          onChange={applyFilters}
          onReset={clearFilters}
          searchLabel="Search by order number, supplier or warehouse"
          searchPlaceholder="Search by number, supplier or warehouse"
          statusOptions={STATUS_OPTIONS}
        />
        {renderContent()}
      </Card>
    </>
  )
}
