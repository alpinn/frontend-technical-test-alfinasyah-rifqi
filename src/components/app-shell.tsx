import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Menu, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { dashboardQuery } from '@/api/dashboard'
import { AppNav, NavLink } from '@/components/app-nav'
import { Icon } from '@/components/icon'
import { MockErrorToggle } from '@/components/mock-error-toggle'
import { RoleSwitcher } from '@/components/role-switcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useRole } from '@/hooks/use-role'
import { formatRelativeTime } from '@/lib/format'
import { SETTINGS_ITEM } from '@/lib/navigation'

const PAGE_TITLES: [string, string][] = [
  ['/purchase-requests', 'Purchase Requests'],
  ['/purchase-orders', 'Purchase Orders'],
  ['/inventory', 'Inventory'],
  ['/goods-receipt', 'Goods Receipt'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
]

function pageTitle(pathname: string) {
  const match = PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix))
  return match ? match[1] : 'Dashboard'
}

function Brand() {
  return (
    <Link to="/" className="mb-4 flex items-center gap-2.5 rounded-lg font-semibold">
      <span className="grid size-7.5 place-items-center rounded-full bg-blue-normal bg-linear-to-br from-white/55 via-white/28 to-transparent text-2xs text-surface-white">
        PF
      </span>
      <span className="text-base text-dark-active">ProcureFlow</span>
    </Link>
  )
}

function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')

  return (
    <form
      role="search"
      className="relative mb-3"
      onSubmit={(event) => {
        event.preventDefault()
        onNavigate?.()
        navigate({ to: '/purchase-requests', search: { search: term, page: 1 } })
      }}
    >
      <label className="sr-only" htmlFor="global-search">
        Search purchase requests
      </label>
      <Icon
        icon={Search}
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-dark-light-active"
      />
      <Input
        id="global-search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search anything..."
        className="pl-8"
      />
    </form>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, user } = useRole()
  const { data } = useQuery(dashboardQuery)

  return (
    <div className="flex h-full flex-col">
      <Brand />
      <GlobalSearch onNavigate={onNavigate} />
      <AppNav
        role={role}
        waitingForApproval={role === 'APPROVER' ? data?.waitingForApproval : undefined}
        onNavigate={onNavigate}
      />
      <div className="mt-6 border-t border-line pt-3">
        <NavLink item={SETTINGS_ITEM} onNavigate={onNavigate} />
        <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2">
          <span className="grid size-7.5 shrink-0 place-items-center rounded-full bg-blue-light text-2xs font-medium text-blue-normal">
            {user.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-dark-active">{user.name}</span>
            <span className="block truncate text-2xs text-dark-light-active">{user.jobTitle}</span>
          </span>
        </div>
        <MockErrorToggle />
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { dataUpdatedAt } = useQuery(dashboardQuery)
  const title = pageTitle(pathname)

  return (
    <div className="grid min-h-dvh w-full grid-cols-1 bg-surface-white lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh scrollbar-thin overflow-auto border-r border-line bg-sidebar px-4 py-4.5 lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-15 items-center justify-between gap-3 border-b border-line bg-surface-white/95 px-4 backdrop-blur-md sm:px-5.5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Icon icon={Menu} className="size-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar px-4 py-4.5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="truncate text-base font-medium text-dark-active">{title}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {dataUpdatedAt ? (
              <span className="hidden text-xs text-dark-light-active sm:inline">
                Last updated {formatRelativeTime(new Date(dataUpdatedAt).toISOString())}
              </span>
            ) : null}
            <RoleSwitcher />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-5.5">{children}</main>
      </div>
    </div>
  )
}
