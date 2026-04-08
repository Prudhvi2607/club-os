import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { SeasonPicker } from '@/components/season-picker'
import { CreateFeeTypeModal } from '@/components/create-fee-type-modal'
import { AssignFeeButton } from '@/components/assign-fee-button'
import { RecordPaymentModal } from '@/components/record-payment-modal'
import { PaymentRequestsPanel } from '@/components/payment-requests-panel'

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-600',
}

interface Props {
  searchParams: Promise<{ seasonId?: string }>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { seasonId: seasonIdParam } = await searchParams

  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [seasons, me] = await Promise.all([
    api.seasons.list(token).catch(() => []),
    api.me(token).catch(() => null),
  ])

  const roles = me?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
  const isTreasurer = roles.includes('board')
  if (!isTreasurer) redirect('/dashboard')

  const defaultSeason = seasons.find((s) => s.status === 'active') ?? seasons[0]
  const seasonId = seasonIdParam ?? defaultSeason?.id ?? ''
  const myUserId = me?.id ?? ''

  const [feeTypes, summary, pendingRequests] = seasonId
    ? await Promise.all([
        api.payments.feeTypes(token, seasonId).catch(() => []),
        api.payments.summary(token, seasonId).catch(() => null),
        api.payments.listRequests(token).catch(() => []),
      ])
    : [[], null, []]

  if (seasons.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-zinc-400">Create a season first before managing payments.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <SeasonPicker seasons={seasons} selected={seasonId} />
          </Suspense>
          {seasonId && (
            <CreateFeeTypeModal
              token={token}
              clubId={CLUB_ID}
              seasonId={seasonId}
              myUserId={myUserId}
              apiUrl={API_URL}
            />
          )}
        </div>
      </div>

      {/* Pending payment requests */}
      <PaymentRequestsPanel requests={pendingRequests} myUserId={myUserId} token={token} clubId={CLUB_ID} apiUrl={API_URL} />

      {/* Stats */}
      {summary && summary.fees.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Due" value={`$${summary.totalDue.toFixed(2)}`} />
          <StatCard label="Collected" value={`$${summary.totalPaid.toFixed(2)}`} color="text-green-600" />
          <StatCard label="Outstanding" value={`$${summary.totalOutstanding.toFixed(2)}`} color="text-red-600" />
        </div>
      )}

      {/* Fee Types */}
      {feeTypes.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Fee Types</h2>
          <div className="flex flex-wrap gap-2">
            {feeTypes.map((ft) => (
              <div key={ft.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5">
                <div>
                  <span className="text-sm font-medium">{ft.name}</span>
                  <span className="ml-2 text-sm text-zinc-400">${Number(ft.amount).toFixed(2)}</span>
                {ft.studentAmount && (
                  <span className="ml-1 text-xs text-zinc-400">(students ${Number(ft.studentAmount).toFixed(2)})</span>
                )}
                </div>
                <span className="text-xs text-zinc-300">·</span>
                <span className="text-xs text-zinc-400">{ft._count.memberFees} assigned</span>
                <span className="text-xs text-zinc-300">·</span>
                <AssignFeeButton
                  feeTypeId={ft.id}
                  feeName={ft.name}
                  seasonId={seasonId}
                  token={token}
                  clubId={CLUB_ID}
                  apiUrl={API_URL}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member fees table */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Fee</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide">Due</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide">Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {!summary || summary.fees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  {feeTypes.length === 0
                    ? 'Create a fee type, then assign it to members.'
                    : 'No fees assigned yet. Use "Assign to all" on a fee type.'}
                </td>
              </tr>
            ) : (
              summary.fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{fee.clubMember.user.fullName}</td>
                  <td className="px-4 py-3 text-zinc-500">{fee.feeType.name}</td>
                  <td className="px-4 py-3 text-right">${Number(fee.amountDue).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${Number(fee.amountPaid).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[fee.status]}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fee.status !== 'paid' && (
                      <RecordPaymentModal
                        feeId={fee.id}
                        memberId={fee.clubMember.id}
                        memberName={fee.clubMember.user.fullName}
                        feeName={fee.feeType.name}
                        amountDue={Number(fee.amountDue)}
                        amountPaid={Number(fee.amountPaid)}
                        myUserId={myUserId}
                        token={token}
                        clubId={CLUB_ID}
                        apiUrl={API_URL}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-zinc-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}
