import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

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
import type { PurchaseOrderSummary } from '@/types'

export function PurchaseOrderTable({
  rows,
  renderAction,
}: {
  rows: PurchaseOrderSummary[]
  renderAction?: (row: PurchaseOrderSummary) => ReactNode
}) {
  const action = (row: PurchaseOrderSummary) =>
    renderAction ? (
      renderAction(row)
    ) : (
      <Link
        to="/purchase-orders/$orderId"
        params={{ orderId: row.id }}
        aria-label={`View ${row.orderNumber}`}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        View
      </Link>
    )

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.orderNumber}</TableCell>
                <TableCell>{row.supplier.name}</TableCell>
                <TableCell>{row.warehouse.name}</TableCell>
                <TableCell>{formatCount(row.totalItems, 'item')}</TableCell>
                <TableCell>
                  <time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">{action(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-4 py-3">
            <Link
              to="/purchase-orders/$orderId"
              params={{ orderId: row.id }}
              className="block min-w-0 flex-1 rounded-md transition-colors hover:text-blue-normal"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-dark-active">{row.orderNumber}</span>
                <StatusBadge status={row.status} />
              </span>
              <span className="mt-1 block text-xs text-dark-normal">{row.supplier.name}</span>
              <span className="mt-0.5 block text-2xs text-dark-light-active">
                {row.warehouse.name} · {formatCount(row.totalItems, 'item')} ·{' '}
                {formatDate(row.createdAt)}
              </span>
            </Link>
            {renderAction ? renderAction(row) : null}
          </li>
        ))}
      </ul>
    </>
  )
}
