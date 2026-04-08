import { auth } from '@/auth'
import { api } from '@/lib/api'
import { RegisterSeasonButton } from '@/components/register-season-button'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!

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
  const isStudent = roles.includes('student')

  const [myFees, members, paymentSummary, registrations] = await Promise.all([
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
  ])

  const isRegistered = registrations.some((r) => r.clubMemberId === memberId)

  const totalDue = myFees.reduce((sum, f) => sum + parseFloat(f.amountDue), 0)
  const totalPaid = myFees.reduce((sum, f) => sum + parseFloat(f.amountPaid), 0)
  const outstanding = totalDue - totalPaid

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Season registration banner */}
      {openSeason && !isRegistered && memberId && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="font-medium">Register for the {openSeason.year} Season</p>
          <p className="mt-1 mb-4 text-sm text-zinc-500">
            Registration is open. Select your membership type and register below.
          </p>
          <RegisterSeasonButton
            seasonId={openSeason.id}
            seasonYear={openSeason.year}
            memberId={memberId}
            defaultMemberType={isStudent ? 'student' : 'regular'}
            token={token}
            clubId={CLUB_ID}
            apiUrl={API_URL}
          />
        </div>
      )}

      {openSeason && isRegistered && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700 font-medium">
          You are registered for the {openSeason.year} season
        </div>
      )}

      {/* My stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Season"
          value={openSeason ? `${openSeason.year} Season` : 'None'}
          sub={openSeason ? `${openSeason._count.registrations} registered` : 'No active season'}
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
      {isBoard && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">Club Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard label="Active Members" value={String(members.length)} sub="currently active" />
            <StatCard
              label="Total Collected"
              value={paymentSummary ? `$${Number(paymentSummary.totalPaid).toFixed(0)}` : '—'}
              sub={openSeason ? `${openSeason.year} season` : '—'}
            />
            <StatCard
              label="Outstanding"
              value={paymentSummary ? `$${Number(paymentSummary.totalOutstanding).toFixed(0)}` : '—'}
              sub={paymentSummary ? `${paymentSummary.byStatus.pending} pending · ${paymentSummary.byStatus.partial} partial` : '—'}
            />
            <StatCard
              label="Fully Paid"
              value={paymentSummary ? String(paymentSummary.byStatus.paid) : '—'}
              sub={paymentSummary ? `of ${paymentSummary.byStatus.paid + paymentSummary.byStatus.partial + paymentSummary.byStatus.pending} assigned` : '—'}
            />
          </div>
        </div>
      )}

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
                    {new Date(a.sentAt).toLocaleDateString()}
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
