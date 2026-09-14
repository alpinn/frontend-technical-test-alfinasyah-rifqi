import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import { useCallback } from 'react'

import { purchaseRequestListQuery, type PurchaseRequestSort } from '@/api/purchase-requests'
import { ListFilters, type ListFilterValues } from '@/components/list-filters'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CreatePurchaseRequestLink } from '@/features/purchase-requests/create-purchase-request-link'
import { PurchaseRequestTable } from '@/features/purchase-requests/purchase-request-table'
import { useRole } from '@/hooks/use-role'
import { PURCHASE_REQUEST_STATUSES, STATUS_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { PurchaseRequestStatus } from '@/types'

const PAGE_SIZE = 10
const routeApi = getRouteApi('/purchase-requests/')
const STATUS_OPTIONS = PURCHASE_REQUEST_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABEL[status],
}))

export function PurchaseRequestListPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { role } = useRole()
  const canCreate = role === 'USER'

  const query = useQuery({
    ...purchaseRequestListQuery({
      search: search.search,
      status: search.status,
      warehouseId: search.warehouseId,
      sort: search.sort,
      page: search.page,
      pageSize: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  })

  const applyFilters = useCallback(
    (patch: ListFilterValues<PurchaseRequestStatus>) =>
      navigate({ search: (previous) => ({ ...previous, ...patch, page: 1 }), replace: true }),
    [navigate],
  )

  const clearFilters = useCallback(
    () => navigate({ search: { page: 1 }, replace: true }),
    [navigate],
  )

  const changeSort = (sort: PurchaseRequestSort) =>
    navigate({
      search: (previous) => ({
        ...previous,
        sort: sort === 'newest' ? undefined : sort,
        page: 1,
      }),
      replace: true,
    })

  const hasFilters = Boolean(search.search || search.status || search.warehouseId)

  function renderContent() {
    if (query.isPending) return <SkeletonRows rows={8} />

    if (query.isError) {
      return (
        <ErrorState
          title="Unable to load purchase requests"
          description="Something went wrong while retrieving purchase requests."
          onRetry={() => void query.refetch()}
        />
      )
    }

    const { data, meta } = query.data

    if (meta.total === 0 && !hasFilters) {
      return (
        <EmptyState
          title="No purchase requests yet"
          description={
            canCreate
              ? 'Create your first purchase request to start requesting stock.'
              : 'Requests raised by warehouse staff will appear here for review.'
          }
          action={canCreate ? <CreatePurchaseRequestLink /> : null}
        />
      )
    }

    if (meta.total === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No purchase requests match these filters"
          description="Try a different search term, or clear the filters to see every request."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Show all requests
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
        <PurchaseRequestTable
          rows={data}
          showActions
          sort={{ value: search.sort ?? 'newest', onChange: changeSort }}
        />
        <Pagination
          meta={meta}
          label="purchase requests"
          onPageChange={(page) => navigate({ search: (previous) => ({ ...previous, page }) })}
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Purchase Requests"
        description="Every stock request raised across the warehouses, with its approval status."
        actions={canCreate ? <CreatePurchaseRequestLink /> : null}
      />
      <Card>
        <ListFilters
          value={{ search: search.search, status: search.status, warehouseId: search.warehouseId }}
          onChange={applyFilters}
          onReset={clearFilters}
          searchLabel="Search by request number, requester or warehouse"
          searchPlaceholder="Search by number, requester or warehouse"
          statusOptions={STATUS_OPTIONS}
        />
        {renderContent()}
      </Card>
    </>
  )
}
