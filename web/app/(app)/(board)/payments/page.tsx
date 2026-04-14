import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { SeasonPicker } from '@/components/season-picker'
import { CreateFeeTypeModal } from '@/components/create-fee-type-modal'
import { AssignFeeButton } from '@/components/assign-fee-button'
import { PaymentRequestsPanel } from '@/components/payment-requests-panel'
import { PaymentsTable } from '@/components/payments-table'
import { ExportPaymentsButton } from '@/components/export-payments-button'

export const metadata: Metadata = { title: 'Payments | club-os' }

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!


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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Payments</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <SeasonPicker seasons={seasons} selected={seasonId} />
          </Suspense>
          {summary && summary.fees.length > 0 && (
            <ExportPaymentsButton
              fees={summary.fees}
              seasonYear={seasons.find((s) => s.id === seasonId)?.year ?? seasonId}
            />
          )}
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
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Total Due" value={`$${Math.round(summary.totalDue)}`} />
          <StatCard label="Collected" value={`$${Math.round(summary.totalPaid)}`} color="text-green-600" />
          <StatCard label="Outstanding" value={`$${Math.round(summary.totalOutstanding)}`} color="text-red-600" />
        </div>
      )}

      {/* Fee Types */}
      {feeTypes.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Fee Types</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {feeTypes.map((ft) => (
              <div key={ft.id} className="flex shrink-0 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5">
                <div className="whitespace-nowrap">
                  <span className="text-sm font-medium">{ft.name}</span>
                  <span className="ml-2 text-sm text-zinc-400">${Number(ft.amount).toFixed(2)}</span>
                  {ft.studentAmount && (
                    <span className="ml-1 text-xs text-zinc-400">(students ${Number(ft.studentAmount).toFixed(2)})</span>
                  )}
                </div>
                <span className="text-xs text-zinc-300">·</span>
                <span className="text-xs text-zinc-400 whitespace-nowrap">{ft._count.memberFees} assigned</span>
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

      <PaymentsTable
        fees={summary?.fees ?? []}
        feeTypesEmpty={feeTypes.length === 0}
        myUserId={myUserId}
        token={token}
        clubId={CLUB_ID}
        apiUrl={API_URL}
      />
    </div>
  )
}

function StatCard({ label, value, color = 'text-zinc-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold sm:text-2xl truncate ${color}`}>{value}</p>
    </div>
  )
}
