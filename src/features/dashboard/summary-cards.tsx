import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardSummary, Role } from '@/types'

export function SummaryCards({ summary, role }: { summary: DashboardSummary; role: Role }) {
  const cards = [
    {
      label: 'Total Purchase Requests',
      value: summary.totalPurchaseRequests,
      help: `+${summary.createdThisMonth} this month`,
    },
    {
      label: 'Waiting for Approval',
      value: summary.waitingForApproval,
      help: role === 'APPROVER' ? 'Requires your action' : 'Requires manager action',
    },
    {
      label: 'Active Purchase Orders',
      value: summary.activePurchaseOrders,
      help: `${summary.expectedThisWeek} expected this week`,
    },
    {
      label: 'Partially Received Orders',
      value: summary.partiallyReceivedOrders,
      help: 'Receiving still in progress',
    },
  ]

  return (
    <section aria-label="Procurement summary">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-line bg-surface-white p-3.5">
            <dt className="text-xs text-dark-normal">{card.label}</dt>
            <dd className="mt-2 text-xl font-semibold text-dark-active">
              {card.value.toLocaleString('en-US')}
            </dd>
            <dd className="mt-1 text-2xs text-dark-light-active">{card.help}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function SummaryCardsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading procurement summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-xl border border-line p-3.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-6 w-12" />
          <Skeleton className="mt-2 h-2.5 w-24" />
        </div>
      ))}
    </div>
  )
}
