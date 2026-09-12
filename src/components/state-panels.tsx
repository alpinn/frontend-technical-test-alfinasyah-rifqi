import { AlertCircle, Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function StatePanel({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid min-h-45 place-items-center px-6 py-10 text-center', className)}>
      <div className="max-w-sm">
        <div className="mx-auto mb-2.5 grid size-9.5 place-items-center rounded-lg border border-line bg-surface-normal text-dark-normal">
          <Icon icon={icon} className="size-4" />
        </div>
        <h4 className="text-sm font-medium text-dark-active">{title}</h4>
        <p className="mt-1 text-xs text-dark-normal">{description}</p>
        {action ? <div className="mt-3 flex justify-center gap-2">{action}</div> : null}
      </div>
    </div>
  )
}

export function EmptyState({
  icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <StatePanel
      icon={icon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  )
}

export function ErrorState({
  title = 'Unable to load data',
  description = 'Something went wrong while retrieving data.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <StatePanel
      icon={AlertCircle}
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        ) : null
      }
    />
  )
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2 p-4', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-8.5 w-full rounded-sm" />
      ))}
    </div>
  )
}
