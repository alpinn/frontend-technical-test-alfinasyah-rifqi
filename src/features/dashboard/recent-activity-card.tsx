import { Box, CircleCheck, CircleX, FileText, ShoppingCart, type LucideIcon } from 'lucide-react'

import { Icon } from '@/components/icon'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import type { ActivityEntry, ActivityKind } from '@/types'

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  PR_SUBMITTED: FileText,
  PR_APPROVED: CircleCheck,
  PR_REJECTED: CircleX,
  PO_CREATED: ShoppingCart,
  GOODS_RECEIVED: Box,
}

function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ol aria-label="Recent activity" className="divide-y divide-line">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-white text-dark-normal">
            <Icon icon={ACTIVITY_ICON[entry.kind]} className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-dark-active">{entry.title}</p>
            <p className="text-xs text-dark-normal">{entry.description}</p>
            <time
              dateTime={entry.occurredAt}
              title={formatDateTime(entry.occurredAt)}
              className="mt-1 block text-2xs text-dark-light-active"
            >
              {formatRelativeTime(entry.occurredAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function RecentActivityCard({
  entries,
  isPending,
  isError,
  onRetry,
}: {
  entries?: ActivityEntry[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
}) {
  function renderBody() {
    if (isPending) return <SkeletonRows rows={4} />
    if (isError) {
      return (
        <ErrorState
          title="Unable to load activity"
          description="Recent procurement events could not be retrieved."
          onRetry={onRetry}
        />
      )
    }
    if (!entries?.length) {
      return (
        <EmptyState
          title="No activity yet"
          description="Submissions, approvals and receipts will be listed here as they happen."
        />
      )
    }
    return <ActivityList entries={entries} />
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      {renderBody()}
    </Card>
  )
}
