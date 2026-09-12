import type { PurchaseOrderStatus, PurchaseRequestStatus } from '@/types'

export type WorkflowStatus = PurchaseRequestStatus | PurchaseOrderStatus

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export const STATUS_TONE: Record<WorkflowStatus, StatusTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  ORDERED: 'info',
  APPROVED: 'success',
  RECEIVED: 'success',
  PARTIALLY_RECEIVED: 'warning',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
}

export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ORDERED: 'Ordered',
  APPROVED: 'Approved',
  RECEIVED: 'Received',
  PARTIALLY_RECEIVED: 'Partially Received',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const PURCHASE_REQUEST_STATUSES: PurchaseRequestStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
]

export const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]

export function statusLabel(status: WorkflowStatus) {
  return STATUS_LABEL[status]
}
