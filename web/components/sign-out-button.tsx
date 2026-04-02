'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={signOut}
      className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
    >
      Sign out
    </button>
  )
}
