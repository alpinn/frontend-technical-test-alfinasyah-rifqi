import { useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { purchaseRequestListQuery } from '@/api/purchase-requests'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { formatCount, formatDate } from '@/lib/format'
import { STATUS_LABEL } from '@/lib/status'

const EXPORT_LIMIT = 1000

export function ExportRequestsButton() {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  async function exportRequests() {
    setIsExporting(true)
    try {
      const { data } = await queryClient.fetchQuery(
        purchaseRequestListQuery({ pageSize: EXPORT_LIMIT }),
      )
      downloadCsv(`purchase-requests-${new Date().toISOString().slice(0, 10)}.csv`, [
        [
          'No',
          'Request Number',
          'Warehouse',
          'Requested By',
          'Total Items',
          'Status',
          'Created At',
        ],
        ...data.map((row, index) => [
          String(index + 1),
          row.requestNumber,
          row.warehouse.name,
          row.requestedBy,
          String(row.totalItems),
          STATUS_LABEL[row.status],
          formatDate(row.createdAt),
        ]),
      ])
      toast.success(`Exported ${formatCount(data.length, 'purchase request')}.`)
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={exportRequests} disabled={isExporting}>
      <Icon icon={Download} />
      {isExporting ? 'Exporting...' : 'Export'}
    </Button>
  )
}
