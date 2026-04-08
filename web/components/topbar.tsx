'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface TopbarProps {
  fullName: string
  avatarUrl?: string | null
  onMenuClick?: () => void
}

export function Topbar({ fullName, avatarUrl, onMenuClick }: TopbarProps) {

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md text-zinc-500 hover:bg-zinc-100"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <Link href="/profile" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
              {initials}
            </div>
          )}
          <span className="text-sm font-medium">{fullName}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
