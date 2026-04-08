import { Suspense } from 'react'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { CreateMemberModal } from '@/components/create-member-modal'
import { MemberStatusSelect } from '@/components/member-status-select'
import { MemberRolesEditor } from '@/components/member-roles-editor'
import { DeleteMemberButton } from '@/components/delete-member-button'
import { EditMemberModal } from '@/components/edit-member-modal'
import { ManageCustomRoles } from '@/components/manage-custom-roles'
import { MembersFilterRow } from '@/components/members-filter-bar'
import { ExportMembersButton } from '@/components/export-members-button'

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface Props {
  searchParams: Promise<{ status?: string; role?: string; playingRole?: string; sort?: string }>
}

export default async function MembersPage({ searchParams }: Props) {
  const { status, role, playingRole, sort = 'name_asc' } = await searchParams

  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [members, customRoles] = await Promise.all([
    api.members.list(token).catch(() => []),
    api.customRoles.list(token).catch(() => []),
  ])

  let filtered = members

  if (status) filtered = filtered.filter((m) => m.status === status)
  if (role) filtered = filtered.filter((m) => m.roles.some((r: any) => r.role === role))
  if (playingRole) filtered = filtered.filter((m) => m.user.playingRole === playingRole)

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'name_asc') return a.user.fullName.localeCompare(b.user.fullName)
    if (sort === 'name_desc') return b.user.fullName.localeCompare(a.user.fullName)
    if (sort === 'joined_desc') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    if (sort === 'joined_asc') return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    return 0
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Members</h1>
        <div className="flex items-center gap-2">
          <ManageCustomRoles customRoles={customRoles} token={token} clubId={CLUB_ID} apiUrl={API_URL} />
          <ExportMembersButton members={filtered} />
          <CreateMemberModal token={token} clubId={CLUB_ID} apiUrl={API_URL} />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <Suspense>
              <MembersFilterRow total={members.length} filtered={filtered.length} />
            </Suspense>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No members match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium">{m.user.fullName}</td>
                <td className="px-4 py-3">
                  <MemberRolesEditor
                    memberId={m.id}
                    currentRoles={m.roles.map((r: any) => r.role)}
                    assignedCustomRoles={m.customRoles}
                    allCustomRoles={customRoles}
                    token={token}
                    clubId={CLUB_ID}
                    apiUrl={API_URL}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-500 capitalize">
                  {m.user.playingRole?.replace('_', ' ') ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <MemberStatusSelect
                    memberId={m.id}
                    current={m.status as 'active' | 'inactive' | 'alumni'}
                    token={token}
                    clubId={CLUB_ID}
                    apiUrl={API_URL}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <EditMemberModal member={m} token={token} clubId={CLUB_ID} apiUrl={API_URL} />
                    <DeleteMemberButton memberId={m.id} memberName={m.user.fullName} token={token} clubId={CLUB_ID} apiUrl={API_URL} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
