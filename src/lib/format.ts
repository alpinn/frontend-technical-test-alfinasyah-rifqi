const dateParts = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
})

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

export function formatDate(iso: string) {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  return `${parts.day} ${parts.month} ${parts.year}`
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${timeFormatter.format(new Date(iso))}`
}

export function formatRelativeTime(iso: string, now = Date.now()) {
  const elapsed = new Date(iso).getTime() - now

  for (const [unit, step] of RELATIVE_STEPS) {
    if (Math.abs(elapsed) >= step) {
      return relativeFormatter.format(Math.round(elapsed / step), unit)
    }
  }

  return 'just now'
}

export function formatQuantity(quantity: number, unit: string) {
  return `${quantity.toLocaleString('en-US')} ${unit}`
}

export function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
