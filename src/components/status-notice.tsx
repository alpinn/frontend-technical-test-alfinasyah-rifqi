import { cn } from '@/lib/utils'

export type NoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const TONE_CLASS: Record<NoticeTone, string> = {
  neutral: 'border-line bg-surface-normal text-dark-normal-active',
  info: 'border-blue-light-hover bg-blue-light text-blue-normal',
  success: 'border-success-border bg-success-bg text-success-fg',
  warning: 'border-warning-border bg-warning-bg text-warning-fg',
  danger: 'border-danger-border bg-danger-bg text-danger-fg',
}

export function StatusNotice({
  tone,
  title,
  detail,
}: {
  tone: NoticeTone
  title: string
  detail?: string
}) {
  return (
    <div role="status" className={cn('mb-3 rounded-xl border px-4 py-3', TONE_CLASS[tone])}>
      <p className="text-sm font-medium">{title}</p>
      {detail ? <p className="mt-0.5 text-xs">{detail}</p> : null}
    </div>
  )
}
