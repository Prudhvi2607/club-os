import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { SignOutButton } from '@/components/sign-out-button'
import { ToastProvider } from '@/components/toast-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const token = session.access_token
  const user = session.user

  const me = await api.me(token).catch((e) => {
    console.error('[layout] /me error:', e.message)
    return null
  })

  if (!me) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-medium">You're not a member of any club yet.</p>
          <p className="text-sm text-zinc-500">Ask your board to add you to the club.</p>
          <SignOutButton />
        </div>
      </div>
    )
  }

  const membership = me.clubMemberships[0]
  const roles = membership?.roles.map((r) => r.role) ?? []
  const isBoard = roles.includes('board') || roles.includes('captain') || roles.includes('vice_captain')
  const isBoardOnly = roles.includes('board')

  return (
    <ToastProvider>
      <div className="flex h-screen">
        <Sidebar isBoard={isBoard} showPayments={isBoardOnly} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar fullName={me.fullName} avatarUrl={me.avatarUrl} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
