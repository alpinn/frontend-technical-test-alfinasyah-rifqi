import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

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

const ALL = 'ALL'
const SEARCH_DELAY_MS = 300

export type ListFilterValues<TStatus extends string> = {
  search?: string
  status?: TStatus
  warehouseId?: string
}

export function ListFilters<TStatus extends string>({
  value,
  onChange,
  onReset,
  searchLabel,
  searchPlaceholder,
  statusOptions,
}: {
  value: ListFilterValues<TStatus>
  onChange: (patch: ListFilterValues<TStatus>) => void
  onReset: () => void
  searchLabel: string
  searchPlaceholder: string
  statusOptions?: { value: TStatus; label: string }[]
}) {
  const searchId = useId()
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
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <Icon
          icon={Search}
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-dark-light-active"
        />
        <Input
          id={searchId}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
        />
      </div>

      {statusOptions ? (
        <Select
          value={value.status ?? ALL}
          onValueChange={(next) =>
            onChange({ status: next === ALL ? undefined : (next as TStatus) })
          }
        >
          <SelectTrigger aria-label="Filter by status" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

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
