import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-xs border px-1.5 py-0.5 text-2xs font-medium whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'border-line bg-surface-normal text-dark-normal',
        info: 'border-blue-light-hover bg-blue-light text-blue-normal',
        success: 'border-success-border bg-success-bg text-success-fg',
        warning: 'border-warning-border bg-warning-bg text-warning-fg',
        danger: 'border-danger-border bg-danger-bg text-danger-fg',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
