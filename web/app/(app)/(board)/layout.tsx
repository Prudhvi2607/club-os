import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const me = await api.me(session.access_token).catch(() => null)
  const roles = me?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
  const isBoard = roles.includes('board') || roles.includes('captain') || roles.includes('vice_captain')

  if (!isBoard) redirect('/dashboard')

  return <>{children}</>
}
