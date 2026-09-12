import type * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content min-h-21.5 w-full resize-y rounded-md border border-line-strong bg-surface-white p-2.5 text-xs text-dark-active transition-colors outline-none',
        'focus-visible:border-blue-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-normal',
        'disabled:cursor-not-allowed disabled:bg-surface-normal disabled:opacity-60',
        'aria-invalid:border-danger-border aria-invalid:bg-danger-bg/30',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
