import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Filter, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'

import { purchaseRequestListQuery } from '@/api/purchase-requests'
import { Icon } from '@/components/icon'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/state-panels'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { CreatePurchaseRequestLink } from '@/features/purchase-requests/create-purchase-request-link'
import { PurchaseRequestTable } from '@/features/purchase-requests/purchase-request-table'
import { useRole } from '@/hooks/use-role'
import { PURCHASE_REQUEST_STATUSES, STATUS_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { PurchaseRequestStatus } from '@/types'

const RECENT_LIMIT = 5
const ALL = 'ALL'
const SEARCH_DELAY_MS = 300

export function RecentRequestsCard() {
  const { role } = useRole()
  const [term, setTerm] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PurchaseRequestStatus>()

  useEffect(() => {
    const timer = setTimeout(() => setSearch(term.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [term])

  const query = useQuery({
    ...purchaseRequestListQuery({ search: search || undefined, status, pageSize: RECENT_LIMIT }),
    placeholderData: keepPreviousData,
  })
  const isFiltered = Boolean(search || status)

  function renderBody() {
    if (query.isPending) return <SkeletonRows rows={RECENT_LIMIT} />

    if (query.isError) {
      return (
        <ErrorState
          title="Unable to load purchase requests"
          description="Something went wrong while retrieving recent requests."
          onRetry={() => void query.refetch()}
        />
      )
    }

    const rows = query.data.data

    if (rows.length === 0 && !isFiltered) {
      return (
        <EmptyState
          title="No purchase requests yet"
          description={
            role === 'USER'
              ? 'Create your first purchase request to start requesting stock.'
              : 'Requests raised by warehouse staff will appear here for review.'
          }
          action={role === 'USER' ? <CreatePurchaseRequestLink /> : null}
        />
      )
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No matching purchase requests"
          description="Try another request number, requester or warehouse."
        />
      )
    }

    return (
      <div
        aria-busy={query.isPlaceholderData}
        className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}
      >
        <PurchaseRequestTable rows={rows} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Recent Purchase Requests</CardTitle>
        <CardAction className="w-full sm:w-auto">
          <label htmlFor="recent-request-search" className="sr-only">
            Search recent purchase requests
          </label>
          <Input
            id="recent-request-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search requests..."
            className="flex-1 sm:w-56 sm:flex-none"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                aria-label={
                  status ? `Filter by status: ${STATUS_LABEL[status]}` : 'Filter by status'
                }
              >
                <Icon icon={Filter} />
                Filter
                {status ? <span className="size-1.5 rounded-full bg-blue-normal" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={status ?? ALL}
                onValueChange={(next) =>
                  setStatus(next === ALL ? undefined : (next as PurchaseRequestStatus))
                }
              >
                <DropdownMenuRadioItem value={ALL}>All statuses</DropdownMenuRadioItem>
                {PURCHASE_REQUEST_STATUSES.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {STATUS_LABEL[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {renderBody()}

      <CardFooter className="border-t">
        <Link
          to="/purchase-requests"
          search={{ page: 1 }}
          className="text-xs font-medium text-blue-normal hover:underline"
        >
          View all purchase requests
        </Link>
      </CardFooter>
    </Card>
  )
}
