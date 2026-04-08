import { Suspense } from 'react'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { CreateTeamModal } from '@/components/create-team-modal'
import { SeasonPicker } from '@/components/season-picker'
import { TeamSquadManager } from '@/components/team-squad-manager'

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface Props {
  searchParams: Promise<{ seasonId?: string }>
}

export default async function TeamsPage({ searchParams }: Props) {
  const { seasonId: seasonIdParam } = await searchParams

  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [seasons, members, me] = await Promise.all([
    api.seasons.list(token).catch(() => []),
    api.members.list(token).catch(() => []),
    api.me(token).catch(() => null),
  ])

  const defaultSeason = seasons.find((s) => s.status === 'active') ?? seasons[0]
  const seasonId = seasonIdParam ?? defaultSeason?.id ?? ''

  const [teams, tournaments] = seasonId
    ? await Promise.all([
        api.squads.overview(token, seasonId).catch(() => []),
        api.tournaments.list(token, seasonId).catch(() => []),
      ])
    : [[], []]

  const myUserId = me?.id ?? ''

  if (seasons.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Teams</h1>
        <p className="text-sm text-zinc-400">Create a season first before managing teams.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <SeasonPicker seasons={seasons} selected={seasonId} />
          </Suspense>
          <CreateTeamModal token={token} clubId={CLUB_ID} apiUrl={API_URL} />
        </div>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-zinc-400">No teams yet. Create your first team.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <TeamSquadManager
              key={team.id}
              team={team}
              allMembers={members}
              seasonId={seasonId}
              seasonTournaments={tournaments}
              myUserId={myUserId}
              token={token}
              clubId={CLUB_ID}
              apiUrl={API_URL}
            />
          ))}
        </div>
      )}
    </div>
  )
}
