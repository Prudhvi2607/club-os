import { auth } from '@/auth'
import { api } from '@/lib/api'
import { EditProfileForm } from '@/components/edit-profile-form'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  student: 'Student',
  board: 'Board',
  captain: 'Captain',
  vice_captain: 'Vice Captain',
}

export default async function ProfilePage() {
  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [me, takenJerseyNumbers] = await Promise.all([
    api.me(token).catch(() => null),
    api.members.jerseyNumbers(token).catch(() => []),
  ])
  if (!me) return null

  const membership = me.clubMemberships[0]
  const roles = membership?.roles ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      {/* Read-only membership info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-3">
        <h2 className="text-sm font-semibold">Membership</h2>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="text-zinc-400">Club</span>
          <span>{membership?.club.name ?? '—'}</span>
          <span className="text-zinc-400">Email</span>
          <span>{me.email ?? '—'}</span>
          <span className="text-zinc-400">Roles</span>
          <div className="flex flex-wrap gap-1">
            {roles.length === 0 ? (
              <span className="text-zinc-400">—</span>
            ) : (
              roles.map((r) => (
                <span key={r.id} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                  {ROLE_LABELS[r.role] ?? r.role}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <EditProfileForm
        token={token}
        apiUrl={API_URL}
        takenJerseyNumbers={takenJerseyNumbers.filter((j) => j.userId !== me.id).map((j) => j.jerseyNumber)}
        initial={{
          fullName: me.fullName,
          phone: me.phone,
          playingRole: me.playingRole,
          emergencyContactName: me.emergencyContactName,
          emergencyContactPhone: me.emergencyContactPhone,
          emergencyContactRelationship: me.emergencyContactRelationship,
          jerseyNumber: me.jerseyNumber,
          tshirtSize: me.tshirtSize,
          cricclubsUrl: me.cricclubsUrl,
        }}
      />
    </div>
  )
}
