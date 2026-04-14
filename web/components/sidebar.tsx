'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const memberNav = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Team', href: '/my-team' },
  { label: 'My Fees', href: '/my-fees' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Availability', href: '/availability' },
  { label: 'Documents', href: '/documents' },
  { label: 'Profile', href: '/profile' },
]

const boardOnlyNav = [
  { label: 'Members', href: '/members' },
  { label: 'Seasons', href: '/seasons' },
  { label: 'Teams', href: '/teams' },
  { label: 'Payments', href: '/payments' },
]

interface SidebarProps {
  isBoard: boolean
  showPayments?: boolean
  latestAnnouncementAt?: string | null
  onNavigate?: () => void
}

export function Sidebar({ isBoard, showPayments = true, latestAnnouncementAt, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [boardOpen, setBoardOpen] = useState(true)
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false)

  useEffect(() => {
    if (!latestAnnouncementAt) return
    const seen = localStorage.getItem('last_seen_announcements')
    if (!seen || new Date(latestAnnouncementAt) > new Date(seen)) {
      setHasNewAnnouncement(true)
    }
  }, [latestAnnouncementAt])

  useEffect(() => {
    if (pathname === '/announcements') {
      localStorage.setItem('last_seen_announcements', new Date().toISOString())
      setHasNewAnnouncement(false)
    }
  }, [pathname])

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    const showBadge = href === '/announcements' && hasNewAnnouncement
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
          active ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        }`}
      >
        {label}
        {showBadge && (
          <span className="ml-2 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
        )}
      </Link>
    )
  }

  return (
    <aside className="flex h-full w-56 flex-col bg-zinc-900 px-3 py-4">
      <div className="px-2 py-2 mb-6">
        <span className="text-sm font-semibold text-white">club-os</span>
        <p className="text-xs text-zinc-500 mt-0.5">{process.env.NEXT_PUBLIC_CLUB_NAME ?? 'My Club'}</p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {memberNav.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}

        {isBoard && (
          <div className="mt-3">
            <button
              onClick={() => setBoardOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <span>Board</span>
              <span>{boardOpen ? '▾' : '▸'}</span>
            </button>
            {boardOpen && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {boardOnlyNav
                  .filter((item) => item.href !== '/payments' || showPayments)
                  .map((item) => (
                    <NavLink key={item.href} href={item.href} label={item.label} />
                  ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  )
}
