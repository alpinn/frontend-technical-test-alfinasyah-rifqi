import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import type { PageMeta } from '@/types'

export function Pagination({
  meta,
  label,
  onPageChange,
}: {
  meta: PageMeta
  label: string
  onPageChange: (page: number) => void
}) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1
  const last = Math.min(meta.page * meta.pageSize, meta.total)

  return (
    <nav
      aria-label={`${label} pages`}
      className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-dark-normal" aria-live="polite">
        Showing {first}–{last} of {meta.total} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
        >
          <Icon icon={ChevronLeft} />
          Previous
        </Button>
        <span className="text-xs text-dark-normal">
          Page {meta.page} of {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
        >
          Next
          <Icon icon={ChevronRight} />
        </Button>
      </div>
    </nav>
  )
}
