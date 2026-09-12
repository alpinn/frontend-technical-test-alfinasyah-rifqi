import { createFileRoute } from '@tanstack/react-router'
import { ChartNoAxesColumn } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Reporting on procurement activity across warehouses."
      />
      <Card>
        <EmptyState
          icon={ChartNoAxesColumn}
          title="Reports are not available"
          description="Reporting is outside the scope of this technical test. The screen is kept because it appears in the provided navigation design."
        />
      </Card>
    </>
  )
}
