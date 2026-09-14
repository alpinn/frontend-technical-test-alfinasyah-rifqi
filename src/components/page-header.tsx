import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  badge,
  backLink,
}: {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
  backLink?: ReactNode
}) {
  return (
    <header className="mb-6">
      {backLink ? <div className="mb-3">{backLink}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-[-0.4px] text-dark-active">{title}</h2>
            {badge}
          </div>
          {description ? (
            <p className="mt-1.5 max-w-[760px] text-sm text-dark-normal">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
