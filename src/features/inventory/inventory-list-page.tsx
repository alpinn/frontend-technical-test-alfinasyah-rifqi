import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Box, SearchX } from 'lucide-react'
import { useCallback } from 'react'

import { inventoryListQuery } from '@/api/inventory'
import { ListFilters, type ListFilterValues } from '@/components/list-filters'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InventoryTable } from '@/features/inventory/inventory-table'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10
const routeApi = getRouteApi('/inventory/')

export function InventoryListPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const query = useQuery({
    ...inventoryListQuery({
      search: search.search,
      warehouseId: search.warehouseId,
      page: search.page,
      pageSize: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
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

  const hasFilters = Boolean(search.search || search.warehouseId)

  function renderContent() {
    if (query.isPending) return <SkeletonRows rows={8} />

    if (query.isError) {
      return (
        <ErrorState
          title="Unable to load inventory"
          description="Something went wrong while retrieving stock levels."
          onRetry={() => void query.refetch()}
        />
      )
    }

    const { data, meta } = query.data

    if (meta.total === 0 && !hasFilters) {
      return (
        <EmptyState
          icon={Box}
          title="No stock recorded yet"
          description="Stock appears here once goods are received into a warehouse."
        />
      )
    }

    if (meta.total === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No stock matches these filters"
          description="Try a different product name or SKU, or clear the filters to see all stock."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Show all stock
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
        <InventoryTable rows={data} />
        <Pagination
          meta={meta}
          label="inventory items"
          onPageChange={(page) => navigate({ search: (previous) => ({ ...previous, page }) })}
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Current stock on hand for every product in every warehouse."
      />
      <Card>
        <ListFilters
          value={{ search: search.search, warehouseId: search.warehouseId }}
          onChange={applyFilters}
          onReset={clearFilters}
          searchLabel="Search by product, SKU or warehouse"
          searchPlaceholder="Search by product, SKU or warehouse"
        />
        {renderContent()}
      </Card>
    </>
  )
}
