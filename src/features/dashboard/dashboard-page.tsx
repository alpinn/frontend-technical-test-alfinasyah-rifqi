import { useQuery } from '@tanstack/react-query'

import { dashboardQuery } from '@/api/dashboard'
import { PageHeader } from '@/components/page-header'
import { ErrorState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'
import { ApprovalBanner } from '@/features/dashboard/approval-banner'
import { RecentActivityCard } from '@/features/dashboard/recent-activity-card'
import { RecentRequestsCard } from '@/features/dashboard/recent-requests-card'
import { SummaryCards, SummaryCardsSkeleton } from '@/features/dashboard/summary-cards'
import { CreatePurchaseRequestLink } from '@/features/purchase-requests/create-purchase-request-link'
import { ExportRequestsButton } from '@/features/purchase-requests/export-requests-button'
import { useRole } from '@/hooks/use-role'

export function DashboardPage() {
  const { role } = useRole()
  const dashboard = useQuery(dashboardQuery)
  const retry = () => void dashboard.refetch()

  function renderSummary() {
    if (dashboard.isPending) return <SummaryCardsSkeleton />

    if (dashboard.isError) {
      return (
        <Card>
          <ErrorState
            title="Unable to load the procurement overview"
            description="Summary figures could not be retrieved."
            onRetry={retry}
          />
        </Card>
      )
    }

    return (
      <>
        {role === 'APPROVER' ? <ApprovalBanner count={dashboard.data.waitingForApproval} /> : null}
        <SummaryCards summary={dashboard.data} role={role} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Procurement Overview"
        description="Track purchase requests, orders, receiving progress, and procurement activity."
        actions={
          <>
            <ExportRequestsButton />
            {role === 'USER' ? <CreatePurchaseRequestLink /> : null}
          </>
        }
      />

      {renderSummary()}

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <RecentRequestsCard />
        <RecentActivityCard
          entries={dashboard.data?.recentActivity}
          isPending={dashboard.isPending}
          isError={dashboard.isError}
          onRetry={retry}
        />
      </div>
    </>
  )
}
