import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'
import { SeasonStatusSelect } from '@/components/season-status-select'
import { CreateTournamentModal } from '@/components/create-tournament-modal'
import { DeleteTournamentButton } from '@/components/delete-tournament-button'

export const dynamic = 'force-dynamic'

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!



export default async function SeasonDetailPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const me = await api.me(token).catch(() => null)
  const myUserId = me?.id ?? ''
  const roles = me?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
  const isBoardOnly = roles.includes('board')

  const [season, paymentSummary, tournaments, availData] = await Promise.all([
    api.seasons.get(token, seasonId).catch(() => null),
    isBoardOnly ? api.payments.summary(token, seasonId).catch(() => null) : Promise.resolve(null),
    api.tournaments.list(token, seasonId).catch(() => []),
    api.availability.season(token, seasonId).catch(() => null),
  ])

  if (!season) notFound()

  const paidRegFeeCount = paymentSummary
    ? paymentSummary.fees.filter((f) => f.feeType.name === 'Registration Fee' && f.status === 'paid').length
    : 0

  const totalMembers = availData?.registrations.length ?? 0
  const availSummary = tournaments.map((t) => {
    const records = availData?.availability.filter((a) => a.tournamentId === t.id) ?? []
    return {
      id: t.id,
      name: t.name,
      available: records.filter((a) => a.status === 'available').length,
      partial: records.filter((a) => a.status === 'partial').length,
      unavailable: records.filter((a) => a.status === 'unavailable').length,
      responded: records.length,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/seasons" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
            ← Seasons
          </Link>
          <span className="text-zinc-200">/</span>
          <h1 className="text-xl font-semibold">{season.year} Season</h1>
        </div>
        <SeasonStatusSelect seasonId={season.id} current={season.status} token={token} clubId={CLUB_ID} apiUrl={API_URL} />
      </div>

      {/* Season info cards */}
      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Start Date" value={new Date(season.startDate).toLocaleDateString()} />
        <InfoCard label="End Date" value={new Date(season.endDate).toLocaleDateString()} />
        <InfoCard label="Reg Fee Paid" value={String(paidRegFeeCount)} />
      </div>

      {/* Payment summary */}
      {paymentSummary && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Payments</h2>
            <Link href="/payments" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
              View payment tracking →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoCard label="Total Due" value={`$${Number(paymentSummary.totalDue).toFixed(0)}`} />
            <InfoCard label="Collected" value={`$${Number(paymentSummary.totalPaid).toFixed(0)}`} />
            <InfoCard label="Outstanding" value={`$${Number(paymentSummary.totalOutstanding).toFixed(0)}`} />
            <InfoCard
              label="Status"
              value={`${paymentSummary.byStatus.paid} paid`}
              sub={`${paymentSummary.byStatus.partial} partial · ${paymentSummary.byStatus.pending} pending`}
            />
          </div>
        </div>
      )}



      {/* Availability */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Member Availability</h2>
          <Link
            href={`/seasons/${season.id}/availability`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            View all →
          </Link>
        </div>
        {availSummary.length === 0 ? (
          <p className="text-sm text-zinc-400">No tournaments yet.</p>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Tournament</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-400 uppercase tracking-wide">Responded</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-green-600 uppercase tracking-wide">Avail</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-yellow-600 uppercase tracking-wide">Partly</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-red-500 uppercase tracking-wide">N/A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {availSummary.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-700">{s.name}</td>
                    <td className="px-4 py-2.5 text-center text-zinc-500">{s.responded}/{totalMembers}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block rounded bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium min-w-[2rem]">{s.available}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block rounded bg-yellow-100 text-yellow-700 px-2 py-0.5 text-xs font-medium min-w-[2rem]">{s.partial}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block rounded bg-red-100 text-red-600 px-2 py-0.5 text-xs font-medium min-w-[2rem]">{s.unavailable}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tournaments */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Tournaments</h2>
          {isBoardOnly && <CreateTournamentModal seasonId={season.id} createdById={myUserId} token={token} clubId={CLUB_ID} apiUrl={API_URL} />}
        </div>
        {tournaments.length === 0 ? (
          <p className="text-sm text-zinc-400">No tournaments yet.</p>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">End</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tournaments.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/seasons/${season.id}/tournaments/${t.id}`} className="hover:underline">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(t.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(t.endDate).toLocaleDateString()}</td>
                    {isBoardOnly && (
                      <td className="px-4 py-3 text-right">
                        <DeleteTournamentButton
                          seasonId={season.id}
                          tournamentId={t.id}
                          tournamentName={t.name}
                          token={token}
                          clubId={CLUB_ID}
                          apiUrl={API_URL}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  )
}
