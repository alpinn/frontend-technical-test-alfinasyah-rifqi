import { delay, http, HttpResponse, type JsonBodyType } from 'msw'

import { USERS } from '@/lib/users'
import {
  ApiError,
  approvePurchaseRequest,
  countsByStatus,
  createPurchaseRequest,
  getPurchaseOrder,
  getPurchaseRequest,
  getStockRow,
  hydrateInventoryItem,
  hydratePurchaseOrder,
  hydratePurchaseOrderSummary,
  hydratePurchaseRequest,
  hydratePurchaseRequestSummary,
  listActivity,
  listMovements,
  listPurchaseOrders,
  listPurchaseRequests,
  listStock,
  receiveGoods,
  rejectPurchaseRequest,
  submitPurchaseRequest,
  updatePurchaseRequest,
} from '@/mocks/db'
import { isMockFailureEnabled } from '@/mocks/failure'
import { products, suppliers, warehouses } from '@/mocks/seed'
import type { ApiErrorBody, PageMeta, Paginated } from '@/types'

const isTest = import.meta.env.MODE === 'test'

async function simulateNetwork() {
  if (isTest) return
  await delay(300 + Math.round(Math.random() * 500))
}

function paginate<T>(rows: T[], url: URL): Paginated<T> {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') ?? 10))
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const meta: PageMeta = { page: safePage, pageSize, total, totalPages }
  return {
    data: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    meta,
  }
}

function matches(haystack: string[], needle: string | null) {
  if (!needle) return true
  const query = needle.trim().toLowerCase()
  if (!query) return true
  return haystack.some((value) => value.toLowerCase().includes(query))
}

async function resolve<T extends JsonBodyType>(build: () => Promise<T> | T) {
  await simulateNetwork()

  if (isMockFailureEnabled()) {
    return HttpResponse.json<ApiErrorBody>(
      { message: 'Simulated server error. Turn off error mode to continue.' },
      { status: 500 },
    )
  }

  try {
    return HttpResponse.json(await build())
  } catch (error) {
    if (error instanceof ApiError) {
      return HttpResponse.json<ApiErrorBody>(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      )
    }
    throw error
  }
}

export const handlers = [
  http.get('/api/warehouses', () => resolve(() => warehouses)),

  http.get('/api/products', () => resolve(() => products)),

  http.get('/api/suppliers', () => resolve(() => suppliers)),

  http.get('/api/dashboard', () =>
    resolve(() => ({
      ...countsByStatus(),
      recentActivity: listActivity().slice(0, 6),
    })),
  ),

  http.get('/api/purchase-requests', ({ request }) =>
    resolve(() => {
      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const warehouseId = url.searchParams.get('warehouseId')
      const search = url.searchParams.get('search')
      const oldestFirst = url.searchParams.get('sort') === 'oldest'

      const rows = listPurchaseRequests()
        .filter((record) => (status ? record.status === status : true))
        .filter((record) => (warehouseId ? record.warehouseId === warehouseId : true))
        .sort((a, b) =>
          oldestFirst
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt),
        )
        .map(hydratePurchaseRequestSummary)
        .filter((row) => matches([row.requestNumber, row.requestedBy, row.warehouse.name], search))

      return paginate(rows, url)
    }),
  ),

  http.post('/api/purchase-requests', ({ request }) =>
    resolve(async () => {
      const body = await request.json()
      const record = createPurchaseRequest(
        body as Parameters<typeof createPurchaseRequest>[0],
        USERS.USER.name,
      )
      return hydratePurchaseRequest(record)
    }),
  ),

  http.get('/api/purchase-requests/:id', ({ params }) =>
    resolve(() => hydratePurchaseRequest(getPurchaseRequest(String(params.id)))),
  ),

  http.put('/api/purchase-requests/:id', ({ params, request }) =>
    resolve(async () => {
      const body = await request.json()
      const record = updatePurchaseRequest(
        String(params.id),
        body as Parameters<typeof updatePurchaseRequest>[1],
      )
      return hydratePurchaseRequest(record)
    }),
  ),

  http.post('/api/purchase-requests/:id/submit', ({ params }) =>
    resolve(() => hydratePurchaseRequest(submitPurchaseRequest(String(params.id)))),
  ),

  http.post('/api/purchase-requests/:id/approve', ({ params }) =>
    resolve(() =>
      hydratePurchaseRequest(approvePurchaseRequest(String(params.id), USERS.APPROVER.name)),
    ),
  ),

  http.post('/api/purchase-requests/:id/reject', ({ params, request }) =>
    resolve(async () => {
      const body = (await request.json()) as { reason?: string }
      return hydratePurchaseRequest(
        rejectPurchaseRequest(String(params.id), body.reason ?? '', USERS.APPROVER.name),
      )
    }),
  ),

  http.get('/api/purchase-orders', ({ request }) =>
    resolve(() => {
      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const warehouseId = url.searchParams.get('warehouseId')
      const search = url.searchParams.get('search')

      const statuses = status ? status.split(',') : []

      const rows = listPurchaseOrders()
        .filter((record) => (statuses.length > 0 ? statuses.includes(record.status) : true))
        .filter((record) => (warehouseId ? record.warehouseId === warehouseId : true))
        .map(hydratePurchaseOrderSummary)
        .filter((row) => matches([row.orderNumber, row.supplier.name, row.warehouse.name], search))

      return paginate(rows, url)
    }),
  ),

  http.get('/api/purchase-orders/:id', ({ params }) =>
    resolve(() => hydratePurchaseOrder(getPurchaseOrder(String(params.id)))),
  ),

  http.post('/api/purchase-orders/:id/receipts', ({ params, request }) =>
    resolve(async () => {
      const body = (await request.json()) as { lines?: { productId: string; quantity: number }[] }
      const { order } = receiveGoods(String(params.id), body.lines ?? [], USERS.USER.name)
      return hydratePurchaseOrder(order)
    }),
  ),

  http.get('/api/inventory', ({ request }) =>
    resolve(() => {
      const url = new URL(request.url)
      const warehouseId = url.searchParams.get('warehouseId')
      const search = url.searchParams.get('search')

      const rows = listStock()
        .filter((record) => (warehouseId ? record.warehouseId === warehouseId : true))
        .map(hydrateInventoryItem)
        .filter((row) => matches([row.product.name, row.product.sku, row.warehouse.name], search))

      return paginate(rows, url)
    }),
  ),

  http.get('/api/inventory/:id', ({ params }) =>
    resolve(() => hydrateInventoryItem(getStockRow(String(params.id)))),
  ),

  http.get('/api/inventory/:id/movements', ({ params }) =>
    resolve(() => {
      getStockRow(String(params.id))
      return listMovements(String(params.id))
    }),
  ),
]
