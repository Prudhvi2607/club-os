import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Season Registrations | club-os' }

const FEE_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-600',
}

export default async function RegistrationsPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [season, availData, paymentSummary, feeTypes] = await Promise.all([
    api.seasons.get(token, seasonId).catch(() => null),
    api.availability.season(token, seasonId).catch(() => null),
    api.payments.summary(token, seasonId).catch(() => null),
    api.payments.feeTypes(token, seasonId).catch(() => []),
  ])

  if (!season) notFound()

  const registrations = availData?.registrations ?? []

  // Build map: clubMemberId → { feeTypeId → status }
  const feeStatusMap = new Map<string, Map<string, string>>()
  if (paymentSummary) {
    for (const fee of paymentSummary.fees) {
      if (!feeStatusMap.has(fee.clubMember.id)) {
        feeStatusMap.set(fee.clubMember.id, new Map())
      }
      feeStatusMap.get(fee.clubMember.id)!.set(fee.feeType.id, fee.status)
    }
  }

  const byStatus = {
    active: registrations.filter((r) => r.status === 'active'),
    pending: registrations.filter((r) => r.status === 'pending'),
    inactive: registrations.filter((r) => r.status === 'inactive'),
  }

  return (
    <div className="space-y-6">
      <Link href={`/seasons/${seasonId}`} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
        ← {season.year} Season
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Registrations</h1>
        <span className="text-sm text-zinc-400">{registrations.length} total</span>
      </div>

      {/* Fee summary per fee type */}
      {feeTypes.length > 0 && registrations.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 flex flex-wrap gap-6 text-sm">
          {feeTypes.map((ft) => {
            const paid = paymentSummary?.fees.filter(
              (f) => f.feeType.id === ft.id && f.status === 'paid'
            ).length ?? 0
            const total = paymentSummary?.fees.filter((f) => f.feeType.id === ft.id).length ?? 0
            return (
              <span key={ft.id}>
                <span className="text-zinc-500">{ft.name}: </span>
                <span className="font-semibold text-green-700">{paid}</span>
                <span className="text-zinc-400">/{total} paid</span>
              </span>
            )
          })}
        </div>
      )}

      {registrations.length === 0 ? (
        <p className="text-sm text-zinc-400">No registrations yet.</p>
      ) : (
        ['active', 'pending', 'inactive'].map((status) => {
          const group = byStatus[status as keyof typeof byStatus]
          if (group.length === 0) return null
          return (
            <div key={status}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 capitalize">
                {status} ({group.length})
              </h2>
              <div className="rounded-lg border border-zinc-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Member</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Type</th>
                      {feeTypes.map((ft) => (
                        <th key={ft.id} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          {ft.name}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {group.map((r) => {
                      const memberFees = feeStatusMap.get(r.clubMember.id)
                      return (
                        <tr key={r.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 font-medium">
                            <Link href={`/members/${r.clubMember.id}`} className="hover:underline">
                              {r.clubMember.user.fullName}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-500 capitalize">{r.memberType}</td>
                          {feeTypes.map((ft) => {
                            const feeStatus = memberFees?.get(ft.id)
                            return (
                              <td key={ft.id} className="px-4 py-2.5">
                                {feeStatus ? (
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[feeStatus]}`}>
                                    {feeStatus}
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-300">—</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-4 py-2.5 text-zinc-400 text-xs">
                            {formatDate(r.registeredAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
