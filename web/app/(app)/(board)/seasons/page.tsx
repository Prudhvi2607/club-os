import { Fragment } from 'react'
import Link from 'next/link'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import type { Tournament } from '@/lib/api'
import { CreateSeasonModal } from '@/components/create-season-modal'
import { SeasonStatusSelect } from '@/components/season-status-select'
import { DeleteSeasonButton } from '@/components/delete-season-button'

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default async function SeasonsPage() {
  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [seasons, me] = await Promise.all([
    api.seasons.list(token).catch(() => []),
    api.me(token).catch(() => null),
  ])

  const tournamentsBySeason = Object.fromEntries(
    await Promise.all(
      seasons.map(async (s) => [s.id, await api.tournaments.list(token, s.id).catch(() => [])])
    )
  )

  const myUserId = me?.id ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Seasons</h1>
        <CreateSeasonModal token={token} createdById={myUserId} clubId={CLUB_ID} apiUrl={API_URL} />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Registered</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {seasons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No seasons yet. Create your first one.
                </td>
              </tr>
            )}
            {seasons.map((s) => {
              const tournaments: Tournament[] = tournamentsBySeason[s.id] ?? []
              return (
                <Fragment key={s.id}>
                  <tr className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/seasons/${s.id}`} className="hover:underline">
                        {s.year}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{s._count.registrations}</td>
                    <td className="px-4 py-3">
                      <SeasonStatusSelect seasonId={s.id} current={s.status} token={token} clubId={CLUB_ID} apiUrl={API_URL} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteSeasonButton seasonId={s.id} seasonName={String(s.year)} token={token} clubId={CLUB_ID} apiUrl={API_URL} />
                    </td>
                  </tr>
                  {tournaments.length > 0 && (
                    <tr key={`${s.id}-tournaments`} className="bg-zinc-50/50">
                      <td colSpan={5} className="px-4 pb-3 pt-0">
                        <div className="flex flex-wrap gap-2">
                          {tournaments.map((t) => (
                            <Link
                              key={t.id}
                              href={`/seasons/${s.id}/tournaments/${t.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                              {t.name}
                              <span className="text-zinc-400">
                                {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–{new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
