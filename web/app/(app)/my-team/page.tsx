import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'

export default async function MyTeamPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [me, seasons] = await Promise.all([
    api.me(token).catch(() => null),
    api.seasons.list(token).catch(() => []),
  ])

  const memberId = me?.clubMemberships[0]?.id
  const openSeason = seasons.find((s) => s.status === 'active' || s.status === 'upcoming')

  const squads = openSeason
    ? await api.squads.overview(token, openSeason.id).catch(() => [])
    : []

  const myTeams = squads.filter((team) =>
    team.assignments.some((a) => a.clubMember.id === memberId)
  )

  if (!openSeason) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">My Team</h1>
        <p className="text-sm text-zinc-400">No active season.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Team</h1>

      {myTeams.length === 0 ? (
        <p className="text-sm text-zinc-400">You haven't been assigned to a team for the {openSeason.year} season yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myTeams.map((team) => (
            <div key={team.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{team.name}</h2>
                <span className="text-xs text-zinc-400">{team.assignments.length} players</span>
              </div>
              <ul className="divide-y divide-zinc-100">
                {team.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className={`text-sm ${a.clubMember.id === memberId ? 'font-semibold' : 'font-medium'}`}>
                      {a.clubMember.user.fullName}
                      {a.clubMember.id === memberId && <span className="ml-2 text-xs text-zinc-400">(you)</span>}
                    </span>
                    {a.clubMember.user.playingRole && (
                      <span className="text-xs text-zinc-400 capitalize">
                        {a.clubMember.user.playingRole.replace('_', ' ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
