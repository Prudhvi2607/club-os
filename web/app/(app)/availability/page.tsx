export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { TournamentAvailabilityGrid } from '@/components/tournament-availability-grid'

export const metadata: Metadata = { title: 'My Availability | club-os' }

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default async function AvailabilityPage() {
  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [me, seasons] = await Promise.all([
    api.me(token).catch(() => null),
    api.seasons.list(token).catch(() => []),
  ])

  const memberId = me?.clubMemberships[0]?.id ?? ''
  const openSeason = seasons.find((s) => s.status === 'active') ?? seasons.find((s) => s.status === 'upcoming')

  if (!openSeason) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">My Availability</h1>
        <p className="text-sm text-zinc-400">No active season.</p>
      </div>
    )
  }

  const { tournaments, availability } = await api.availability.member(token, memberId, openSeason.id).catch(() => ({ tournaments: [], availability: [] }))

  if (tournaments.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">My Availability</h1>
        <p className="mt-1 text-sm text-zinc-400">{openSeason.year} Season</p>
        <p className="text-sm text-zinc-400">No tournaments have been created yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Availability</h1>
        <p className="mt-1 text-sm text-zinc-400">{openSeason.year} Season</p>
      </div>

      <TournamentAvailabilityGrid
        tournaments={tournaments}
        memberId={memberId}
        memberName={me?.fullName ?? 'You'}
        initialAvailability={availability}
        seasonId={openSeason.id}
        apiUrl={API_URL}
        token={token}
        clubId={CLUB_ID}
        editable
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Guide</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block w-3 h-3 rounded bg-green-200 border border-green-300 shrink-0" />
            <div>
              <span className="font-medium text-zinc-700">Available</span>
              <p className="text-xs text-zinc-400">Can play 80%+ of games in this tournament</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block w-3 h-3 rounded bg-yellow-200 border border-yellow-300 shrink-0" />
            <div>
              <span className="font-medium text-zinc-700">Partly available</span>
              <p className="text-xs text-zinc-400">Can play ~50% of games — add dates in the notes</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block w-3 h-3 rounded bg-red-200 border border-red-300 shrink-0" />
            <div>
              <span className="font-medium text-zinc-700">Not available</span>
              <p className="text-xs text-zinc-400">Cannot participate in this tournament at all</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
