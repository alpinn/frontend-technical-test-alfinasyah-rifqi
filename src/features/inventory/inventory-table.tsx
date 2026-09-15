import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatQuantity } from '@/lib/format'
import type { InventoryItem } from '@/types'

export function InventoryTable({ rows }: { rows: InventoryItem[] }) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.product.name}</TableCell>
                <TableCell className="text-dark-normal">{row.product.sku}</TableCell>
                <TableCell>{row.warehouse.name}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {row.currentStock.toLocaleString('en-US')}
                </TableCell>
                <TableCell>{row.product.unit}</TableCell>
                <TableCell className="text-right">
                  <Link
                    to="/inventory/$itemId"
                    params={{ itemId: row.id }}
                    aria-label={`View stock history for ${row.product.name} at ${row.warehouse.name}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    History
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to="/inventory/$itemId"
              params={{ itemId: row.id }}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-white-hover"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-dark-active">
                  {row.product.name}
                </span>
                <span className="mt-0.5 block text-2xs text-dark-light-active">
                  {row.product.sku} · {row.warehouse.name}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-dark-active tabular-nums">
                {formatQuantity(row.currentStock, row.product.unit)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
