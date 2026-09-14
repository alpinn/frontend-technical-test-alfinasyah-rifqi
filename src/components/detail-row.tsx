import type { ReactNode } from 'react'

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <dt className="text-xs text-dark-normal">{label}</dt>
      <dd className="text-right text-xs font-medium text-dark-active">{children}</dd>
    </div>
  )
}
