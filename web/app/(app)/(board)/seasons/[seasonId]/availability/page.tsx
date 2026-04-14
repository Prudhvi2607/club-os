export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { AvailabilityBoardView } from '@/components/availability-board-view'

export default async function SeasonAvailabilityPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params

  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [season, seasonAvail] = await Promise.all([
    api.seasons.get(token, seasonId).catch(() => null),
    api.availability.season(token, seasonId).catch(() => null),
  ])

  if (!season) notFound()

  const { registrations = [], tournaments = [], availability = [] } = seasonAvail ?? {}

  const members = registrations.map((r) => ({
    memberId: r.clubMemberId,
    memberName: r.clubMember.user.fullName,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/seasons/${seasonId}`} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
          ← {season.year} Season
        </Link>
        <span className="text-zinc-200">/</span>
        <h1 className="text-xl font-semibold">Member Availability</h1>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-sm text-zinc-400">No tournaments created yet for this season.</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-zinc-400">No registrations yet.</p>
      ) : (
        <>
          <AvailabilityBoardView
            tournaments={tournaments}
            members={members}
            availability={availability}
          />
          <div className="flex gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-green-100" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-yellow-100" /> Partly available</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-red-100" /> Not available</span>
            <span className="flex items-center gap-1.5"><span className="text-zinc-300">—</span> No response</span>
          </div>
        </>
      )}
    </div>
  )
}
