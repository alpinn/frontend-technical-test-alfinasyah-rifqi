import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { warehousesQuery } from '@/api/reference'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PURCHASE_REQUEST_STATUSES, STATUS_LABEL } from '@/lib/status'
import type { PurchaseRequestStatus } from '@/types'

const ALL = 'ALL'
const SEARCH_DELAY_MS = 300

export type PurchaseRequestFilterValues = {
  search?: string
  status?: PurchaseRequestStatus
  warehouseId?: string
}

export function PurchaseRequestFilters({
  value,
  onChange,
  onReset,
}: {
  value: PurchaseRequestFilterValues
  onChange: (patch: PurchaseRequestFilterValues) => void
  onReset: () => void
}) {
  const warehouses = useQuery(warehousesQuery)
  const appliedSearch = value.search ?? ''
  const [term, setTerm] = useState(appliedSearch)
  const [syncedSearch, setSyncedSearch] = useState(appliedSearch)

  if (appliedSearch !== syncedSearch) {
    setSyncedSearch(appliedSearch)
    setTerm(appliedSearch)
  }

  useEffect(() => {
    const normalized = term.trim()
    if (normalized === appliedSearch) return
    const timer = setTimeout(() => onChange({ search: normalized || undefined }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [term, appliedSearch, onChange])

  const hasFilters = Boolean(value.search || value.status || value.warehouseId)

  return (
    <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:min-w-56 sm:flex-1">
        <label htmlFor="purchase-request-search" className="sr-only">
          Search by request number, requester or warehouse
        </label>
        <Icon
          icon={Search}
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-dark-light-active"
        />
        <Input
          id="purchase-request-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by number, requester or warehouse"
          className="pl-8"
        />
      </div>

      <Select
        value={value.status ?? ALL}
        onValueChange={(next) =>
          onChange({ status: next === ALL ? undefined : (next as PurchaseRequestStatus) })
        }
      >
        <SelectTrigger aria-label="Filter by status" className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All statuses</SelectItem>
          {PURCHASE_REQUEST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.warehouseId ?? ALL}
        onValueChange={(next) => onChange({ warehouseId: next === ALL ? undefined : next })}
        disabled={!warehouses.data}
      >
        <SelectTrigger aria-label="Filter by warehouse" className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All warehouses</SelectItem>
          {warehouses.data?.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" onClick={onReset}>
          <Icon icon={X} />
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
