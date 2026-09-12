import type * as React from 'react'

import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--color-surface-light-active),var(--color-surface-normal),var(--color-surface-light-active))] bg-size-[200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
