'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TopbarProps {
  fullName: string
  avatarUrl?: string | null
}

export function Topbar({ fullName, avatarUrl }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b border-zinc-200 bg-white px-6">
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
        onClick={signOut}
        className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        Logout
      </button>
    </header>
  )
}
