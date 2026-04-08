'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
    >
      Sign out
    </button>
  )
}
