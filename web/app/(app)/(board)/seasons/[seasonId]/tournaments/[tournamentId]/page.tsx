import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ seasonId: string; tournamentId: string }>
}) {
  const { seasonId, tournamentId } = await params

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [tournament, season] = await Promise.all([
    api.tournaments.get(token, seasonId, tournamentId).catch(() => null),
    api.seasons.get(token, seasonId).catch(() => null),
  ])

  if (!tournament || !season) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/seasons/${seasonId}`} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
          ← {season.year} Season
        </Link>
        <span className="text-zinc-200">/</span>
        <h1 className="text-xl font-semibold">{tournament.name}</h1>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InfoCard label="Start Date" value={new Date(tournament.startDate).toLocaleDateString()} />
        <InfoCard label="End Date" value={new Date(tournament.endDate).toLocaleDateString()} />
        <InfoCard label="Teams" value={String(tournament.teams.length)} />
      </div>

      {/* Teams */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">Teams Playing</h2>
        {tournament.teams.length === 0 ? (
          <p className="text-sm text-zinc-400">No teams assigned yet. Go to the Teams page to assign teams to this tournament.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournament.teams.map((tt) => (
              <div key={tt.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{tt.team.name}</h3>
                  <span className="text-xs text-zinc-400">{tt.team.assignments.length} players</span>
                </div>
                {tt.team.assignments.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-zinc-400">No players assigned</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {tt.team.assignments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm font-medium">{a.clubMember.user.fullName}</span>
                        {a.clubMember.user.playingRole && (
                          <span className="text-xs text-zinc-400 capitalize">
                            {a.clubMember.user.playingRole.replace('_', ' ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}
