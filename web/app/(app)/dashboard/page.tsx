export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { formatDate, formatDateRange } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard | club-os' }


const AVAIL_BADGE: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unavailable: 'bg-red-100 text-red-600',
}

export default async function DashboardPage() {
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [me, seasons, announcements] = await Promise.all([
    api.me(token).catch(() => null),
    api.seasons.list(token).catch(() => []),
    api.announcements.list(token, { limit: 8 }).catch(() => []),
  ])

  const openSeason = seasons.find((s) => s.status === 'active' || s.status === 'upcoming')
  const membership = me?.clubMemberships[0]
  const memberId = membership?.id
  const roles = membership?.roles.map((r) => r.role) ?? []
  const isBoard = roles.includes('board') || roles.includes('captain') || roles.includes('vice_captain')


  const [myFees, members, paymentSummary, registrations, tournaments, myAvailability] = await Promise.all([
    openSeason && memberId
      ? api.payments.memberFees(token, memberId, openSeason.id).catch(() => [])
      : Promise.resolve([]),
    isBoard
      ? api.members.list(token, 'active').catch(() => [])
      : Promise.resolve([]),
    isBoard && openSeason
      ? api.payments.summary(token, openSeason.id).catch(() => null)
      : Promise.resolve(null),
    openSeason
      ? api.seasons.registrations(token, openSeason.id).catch(() => [])
      : Promise.resolve([]),
    openSeason
      ? api.tournaments.list(token, openSeason.id).catch(() => [])
      : Promise.resolve([]),
    openSeason && memberId
      ? api.availability.member(token, memberId, openSeason.id).catch(() => ({ tournaments: [], availability: [] }))
      : Promise.resolve({ tournaments: [], availability: [] }),
  ])

  const isRegistered = registrations.some((r) => r.clubMemberId === memberId)
  const totalDue = myFees.reduce((sum, f) => sum + parseFloat(f.amountDue), 0)
  const totalPaid = myFees.reduce((sum, f) => sum + parseFloat(f.amountPaid), 0)
  const outstanding = totalDue - totalPaid

  const now = new Date()
  const upcomingTournaments = tournaments
    .filter((t) => new Date(t.endDate) >= now)
    .slice(0, 3)

  const availMap = new Map(myAvailability.availability.map((a) => [a.tournamentId, a.status]))
  const unsetTournaments = upcomingTournaments.filter((t) => !availMap.has(t.id))


  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {openSeason && isRegistered && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700 font-medium">
          You are registered for the {openSeason.year} season
        </div>
      )}

      {/* Availability nudge */}
      {unsetTournaments.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-yellow-800">
            You haven't set availability for{' '}
            <span className="font-medium">
              {unsetTournaments.length === 1
                ? unsetTournaments[0].name
                : `${unsetTournaments.length} upcoming tournaments`}
            </span>
          </p>
          <Link href="/availability" className="shrink-0 rounded-lg bg-yellow-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-900 transition-colors">
            Set availability
          </Link>
        </div>
      )}

      {/* My stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Season"
          value={openSeason ? `${openSeason.year} Season` : 'None'}
          sub={openSeason ? `${members.length} active members` : 'No active season'}
        />
        <StatCard
          label="My Fees Due"
          value={myFees.length > 0 ? `$${totalDue.toFixed(0)}` : '—'}
          sub={myFees.length > 0 ? `$${outstanding.toFixed(0)} outstanding` : openSeason ? 'No fees assigned' : '—'}
        />
        <StatCard
          label="My Payment Status"
          value={
            myFees.length === 0 ? '—'
            : myFees.every((f) => f.status === 'paid') ? 'Paid'
            : myFees.some((f) => f.status === 'partial') ? 'Partial'
            : 'Pending'
          }
          sub={myFees.length > 0 ? `${myFees.length} fee${myFees.length > 1 ? 's' : ''}` : '—'}
        />
      </div>

      {/* Board-only club overview */}
      {isBoard && paymentSummary && (() => {
        // Per-member: are ALL their fees paid?
        const memberFeeMap = new Map<string, string[]>()
        for (const fee of paymentSummary.fees) {
          const id = fee.clubMember.id
          if (!memberFeeMap.has(id)) memberFeeMap.set(id, [])
          memberFeeMap.get(id)!.push(fee.status)
        }
        const totalMembers = members.length
        const membersWithFees = memberFeeMap.size
        const fullyPaid = [...memberFeeMap.values()].filter(statuses => statuses.every(s => s === 'paid')).length
          + (totalMembers - membersWithFees) // members with no fees assigned count as paid
        const unpaid = totalMembers - fullyPaid
        return (
          <div>
            <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">Payments — {openSeason?.year} Season</h2>
            <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 flex flex-wrap gap-6 text-sm">
              <span><span className="text-lg font-semibold">{totalMembers}</span> <span className="text-zinc-400">members</span></span>
              <span><span className="text-lg font-semibold text-green-600">{fullyPaid}</span> <span className="text-zinc-400">fully paid</span></span>
              <span><span className="text-lg font-semibold text-red-500">{unpaid}</span> <span className="text-zinc-400">unpaid</span></span>
              <span className="ml-auto text-zinc-400">${Number(paymentSummary.totalPaid).toFixed(0)} collected · ${Number(paymentSummary.totalOutstanding).toFixed(0)} outstanding</span>
            </div>
          </div>
        )
      })()}

      {/* Upcoming Tournaments */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">Upcoming Tournaments</h2>
        {upcomingTournaments.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-400">
            No upcoming tournaments
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {upcomingTournaments.map((t) => {
              const status = availMap.get(t.id)
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDateRange(t.startDate, t.endDate)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    status ? AVAIL_BADGE[status] : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {status ?? 'not set'}
                  </span>
                </div>
              )
            })}
            {tournaments.filter((t) => new Date(t.endDate) >= now).length > 3 && (
              <div className="px-4 py-2.5 text-center">
                <Link href="/availability" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                  View all tournaments →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcements */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">Recent Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-zinc-400">No announcements yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {announcements.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{a.subject}</p>
                    <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{a.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {formatDate(a.sentAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {a.sentBy.fullName}
                  {a.team ? ` · ${a.team.name}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-sm text-zinc-400">{sub}</p>
    </div>
  )
}
