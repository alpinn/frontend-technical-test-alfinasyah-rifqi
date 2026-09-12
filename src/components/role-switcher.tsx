import { Check, ChevronDown } from 'lucide-react'

import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRole } from '@/hooks/use-role'
import { ROLE_LABELS, USERS } from '@/lib/users'
import type { Role } from '@/types'

const ROLE_ORDER: Role[] = ['USER', 'APPROVER']

export function RoleSwitcher() {
  const { role, setRole } = useRole()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Active role: ${ROLE_LABELS[role]}`}>
          {ROLE_LABELS[role]}
          <Icon icon={ChevronDown} className="size-3.5 text-dark-light-active" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-2xs font-medium tracking-wide text-dark-light-active uppercase">
          Switch role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLE_ORDER.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => setRole(option)}
            className="flex items-start gap-2"
          >
            <span className="flex-1">
              <span className="block text-xs font-medium text-dark-active">
                {ROLE_LABELS[option]}
              </span>
              <span className="block text-2xs text-dark-normal">
                {USERS[option].name} · {USERS[option].jobTitle}
              </span>
            </span>
            {role === option ? (
              <Icon icon={Check} className="mt-0.5 size-3.5 text-blue-normal" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
