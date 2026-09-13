import { describe, expect, it } from 'vitest'

import { formatCount, formatDate, formatRelativeTime } from '@/lib/format'

describe('formatting', () => {
  it('writes dates as day, abbreviated month and year, as the design does', () => {
    expect(formatDate('2026-09-01T12:00:00Z')).toBe('01 Sep 2026')
    expect(formatDate('2026-12-25T12:00:00Z')).toBe('25 Dec 2026')
  })

  it('describes elapsed time relative to now', () => {
    const now = Date.parse('2026-09-13T12:00:00Z')

    expect(formatRelativeTime('2026-09-13T10:00:00Z', now)).toBe('2 hours ago')
    expect(formatRelativeTime('2026-09-13T11:59:40Z', now)).toBe('just now')
  })

  it('pluralises counts', () => {
    expect(formatCount(1, 'item')).toBe('1 item')
    expect(formatCount(4, 'item')).toBe('4 items')
  })
})
