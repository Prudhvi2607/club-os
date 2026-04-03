'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

const boardNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Members', href: '/members' },
  { label: 'Seasons', href: '/seasons' },
  { label: 'Teams', href: '/teams' },
  { label: 'Payments', href: '/payments' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Documents', href: '/documents' },
  { label: 'My Availability', href: '/availability' },
  { label: 'Profile', href: '/profile' },
]

const memberNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Team', href: '/my-team' },
  { label: 'My Fees', href: '/my-fees' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Availability', href: '/availability' },
  { label: 'Documents', href: '/documents' },
  { label: 'Profile', href: '/profile' },
]

interface SidebarProps {
  isBoard: boolean
  showPayments?: boolean
  onNavigate?: () => void
}

export function Sidebar({ isBoard, showPayments = true, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const nav = isBoard
    ? boardNav.filter((item) => item.href !== '/payments' || showPayments)
    : memberNav

  return (
    <aside className="flex h-full w-56 flex-col bg-zinc-900 px-3 py-4">
      <div className="px-2 py-2 mb-6">
        <span className="text-sm font-semibold text-white">club-os</span>
        <p className="text-xs text-zinc-500 mt-0.5">UC Cricket Club</p>
      </div>
      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
