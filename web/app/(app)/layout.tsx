import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { AppShell } from '@/components/app-shell'
import { SignOutButton } from '@/components/sign-out-button'
import { ToastProvider } from '@/components/toast-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const token = (session as any).accessToken ?? ''

  const [me, recentAnnouncements] = await Promise.all([
    api.me(token).catch((e) => {
      console.error('[layout] /me error:', e.message)
      return null
    }),
    api.announcements.list(token, { limit: 1 }).catch(() => []),
  ])
  const latestAnnouncementAt = recentAnnouncements[0]?.sentAt ?? null

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
      <AppShell
        isBoard={isBoard}
        showPayments={isBoardOnly}
        fullName={me.fullName}
        avatarUrl={me.avatarUrl}
        latestAnnouncementAt={latestAnnouncementAt}
      >
        {children}
      </AppShell>
    </ToastProvider>
  )
}
