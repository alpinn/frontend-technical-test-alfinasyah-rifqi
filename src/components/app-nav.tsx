import { Link } from '@tanstack/react-router'

import { Icon } from '@/components/icon'
import { NAV_GROUPS, type NavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

const linkClass =
  'my-0.5 flex h-9.5 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-dark-normal-active transition-colors hover:bg-surface-normal-active hover:text-dark-active'

export function NavLink({
  item,
  badge,
  onNavigate,
}: {
  item: NavItem
  badge?: number
  onNavigate?: () => void
}) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === '/' }}
      activeProps={{
        className: 'bg-surface-normal-active font-medium text-dark-active',
        'aria-current': 'page',
      }}
      className={cn(linkClass)}
    >
      <Icon icon={item.icon} className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? (
        <span className="rounded-xs bg-danger-bg px-1.5 py-0.5 text-2xs font-medium text-danger-fg">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

export function AppNav({
  role,
  waitingForApproval,
  onNavigate,
}: {
  role: Role
  waitingForApproval?: number
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Main navigation" className="flex-1">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => !item.roles || item.roles.includes(role))
        if (items.length === 0) return null

        return (
          <div key={group.title ?? 'primary'}>
            {group.title ? (
              <p className="mx-2 mt-4.5 mb-1.5 text-2xs font-medium tracking-[0.06em] text-dark-light-active uppercase">
                {group.title}
              </p>
            ) : null}
            {items.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                badge={item.to === '/purchase-requests' ? waitingForApproval : undefined}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )
      })}
    </nav>
  )
}
