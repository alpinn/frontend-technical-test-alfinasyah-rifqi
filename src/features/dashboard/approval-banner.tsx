import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { formatCount } from '@/lib/format'

export function ApprovalBanner({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <section
      aria-label="Pending approvals"
      className="mb-3 flex flex-col gap-3 rounded-xl border border-line bg-surface-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-sm font-medium text-dark-active">
          {formatCount(count, 'purchase request')} {count === 1 ? 'needs' : 'need'} your attention.
        </p>
        <p className="mt-0.5 text-xs text-dark-normal">
          Review pending requests before they delay downstream purchasing.
        </p>
      </div>
      <Button asChild className="self-start sm:self-auto">
        <Link to="/purchase-requests" search={{ status: 'SUBMITTED', page: 1 }}>
          Review requests
        </Link>
      </Button>
    </section>
  )
}
