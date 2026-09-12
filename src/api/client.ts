import type { ApiErrorBody } from '@/types'

export class ApiRequestError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type QueryValue = string | number | undefined | null

export function toQueryString(params: Record<string, QueryValue>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiRequestError(
      response.status,
      body?.message ?? 'Something went wrong while contacting the server.',
      body?.fieldErrors ?? {},
    )
  }

  return (await response.json()) as T
}

export function postJson<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function putJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}
