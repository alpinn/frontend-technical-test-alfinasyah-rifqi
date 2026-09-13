import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp } from 'lucide-react'

import type { PurchaseRequestSort } from '@/api/purchase-requests'
import { Icon } from '@/components/icon'
import { StatusBadge } from '@/components/status-badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCount, formatDate } from '@/lib/format'
import type { PurchaseRequestSummary } from '@/types'

type SortControl = {
  value: PurchaseRequestSort
  onChange: (sort: PurchaseRequestSort) => void
}

function CreatedAtHeader({ sort }: { sort?: SortControl }) {
  if (!sort) return <TableHead>Created At</TableHead>

  const oldestFirst = sort.value === 'oldest'

  return (
    <TableHead aria-sort={oldestFirst ? 'ascending' : 'descending'}>
      <button
        type="button"
        onClick={() => sort.onChange(oldestFirst ? 'newest' : 'oldest')}
        className="-mx-1 inline-flex items-center gap-1 rounded-xs px-1 font-medium hover:text-dark-active"
      >
        Created At
        <Icon icon={oldestFirst ? ArrowUp : ArrowDown} className="size-3" />
        <span className="sr-only">{oldestFirst ? ', oldest first' : ', newest first'}</span>
      </button>
    </TableHead>
  )
}

export function PurchaseRequestTable({
  rows,
  sort,
  showActions = false,
}: {
  rows: PurchaseRequestSummary[]
  sort?: SortControl
  showActions?: boolean
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Request Number</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Items</TableHead>
              <CreatedAtHeader sort={sort} />
              <TableHead>Status</TableHead>
              {showActions ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {showActions ? (
                    row.requestNumber
                  ) : (
                    <Link
                      to="/purchase-requests/$requestId"
                      params={{ requestId: row.id }}
                      className="hover:text-blue-normal hover:underline"
                    >
                      {row.requestNumber}
                    </Link>
                  )}
                </TableCell>
                <TableCell>{row.requestedBy}</TableCell>
                <TableCell>{row.warehouse.name}</TableCell>
                <TableCell>{formatCount(row.totalItems, 'item')}</TableCell>
                <TableCell>
                  <time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                {showActions ? (
                  <TableCell className="text-right">
                    <Link
                      to="/purchase-requests/$requestId"
                      params={{ requestId: row.id }}
                      aria-label={`View ${row.requestNumber}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      View
                    </Link>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to="/purchase-requests/$requestId"
              params={{ requestId: row.id }}
              className="block px-4 py-3 transition-colors hover:bg-surface-white-hover"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-dark-active">{row.requestNumber}</span>
                <StatusBadge status={row.status} />
              </span>
              <span className="mt-1 block text-xs text-dark-normal">
                {row.warehouse.name} · {formatCount(row.totalItems, 'item')}
              </span>
              <span className="mt-0.5 block text-2xs text-dark-light-active">
                {row.requestedBy} · {formatDate(row.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
