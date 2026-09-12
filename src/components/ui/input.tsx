import type * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-line-strong bg-surface-white px-2.5 text-xs text-dark-active transition-colors outline-none',
        'selection:bg-blue-light selection:text-blue-normal',
        'focus-visible:border-blue-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-normal',
        'disabled:cursor-not-allowed disabled:bg-surface-normal disabled:opacity-60',
        'aria-invalid:border-danger-border aria-invalid:bg-danger-bg/30',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
