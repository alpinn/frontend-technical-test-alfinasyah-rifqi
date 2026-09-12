import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/state-panels'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Account and workspace preferences." />
      <Card>
        <EmptyState
          icon={Settings}
          title="Settings are not available"
          description="Authentication is outside the scope of this technical test. Use the control in the top bar to switch between the staff and manager roles."
        />
      </Card>
    </>
  )
}
