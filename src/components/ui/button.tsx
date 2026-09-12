import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-normal disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-blue-normal text-surface-white hover:bg-blue-normal-hover active:bg-blue-normal-active',
        outline:
          'border border-line-strong bg-surface-white text-dark-normal-active hover:bg-surface-white-hover hover:border-dark-lighter',
        secondary: 'bg-surface-normal text-dark-normal-active hover:bg-surface-normal-hover',
        ghost: 'text-dark-normal-active hover:bg-surface-normal-hover hover:text-dark-active',
        destructive:
          'border border-danger-border bg-danger-bg text-danger-fg hover:bg-danger-border',
        link: 'text-blue-normal underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 text-xs',
        sm: 'h-8 gap-1.5 px-2.5 text-xs',
        lg: 'h-10 px-4 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
