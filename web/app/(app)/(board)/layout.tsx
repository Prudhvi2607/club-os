import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { api } from '@/lib/api'

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  
  const session = await auth()
  if (!session) redirect('/login')

  const me = await api.me((session as any).accessToken ?? '').catch(() => null)
  const roles = me?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
  const isBoard = roles.includes('board') || roles.includes('captain') || roles.includes('vice_captain')

  if (!isBoard) redirect('/dashboard')

  return <>{children}</>
}
