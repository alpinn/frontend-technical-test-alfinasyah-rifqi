import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, STATUS_TONE, type WorkflowStatus } from '@/lib/status'

export function StatusBadge({ status, className }: { status: WorkflowStatus; className?: string }) {
  return (
    <Badge variant={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
