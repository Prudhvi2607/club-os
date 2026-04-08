import { auth } from '@/auth'
import { api } from '@/lib/api'
import { SubmitPaymentRequestButton } from '@/components/submit-payment-request-button'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!

const STATUS_COLOR: Record<string, string> = {
  paid: 'text-green-700 bg-green-50',
  partial: 'text-yellow-700 bg-yellow-50',
  pending: 'text-zinc-500 bg-zinc-100',
}

export default async function MyFeesPage() {
  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [me, seasons] = await Promise.all([
    api.me(token).catch(() => null),
    api.seasons.list(token).catch(() => []),
  ])

  const memberId = me?.clubMemberships[0]?.id
  const openSeason = seasons.find((s) => s.status === 'active' || s.status === 'upcoming')

  const fees = memberId
    ? await api.payments.memberFees(token, memberId, openSeason?.id).catch(() => [])
    : []

  const totalDue = fees.reduce((sum, f) => sum + parseFloat(f.amountDue), 0)
  const totalPaid = fees.reduce((sum, f) => sum + parseFloat(f.amountPaid), 0)
  const outstanding = totalDue - totalPaid

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Fees</h1>

      {fees.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {openSeason ? `No fees assigned for the ${openSeason.year} season.` : 'No active season.'}
        </p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Due" value={`$${totalDue.toFixed(0)}`} />
            <StatCard label="Paid" value={`$${totalPaid.toFixed(0)}`} />
            <StatCard label="Outstanding" value={`$${outstanding.toFixed(0)}`} />
          </div>

          {/* Fee list */}
          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Payments</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 font-medium">{f.feeType.name}</td>
                    <td className="px-4 py-3 text-zinc-500">${Number(f.amountDue).toFixed(0)}</td>
                    <td className="px-4 py-3 text-zinc-500">${Number(f.amountPaid).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[f.status]}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.payments.length === 0 ? (
                        <span className="text-xs text-zinc-400">None</span>
                      ) : (
                        <div className="space-y-0.5">
                          {f.payments.map((p) => (
                            <div key={p.id} className="text-xs text-zinc-500">
                              ${Number(p.amount).toFixed(0)} via {p.method} · {new Date(p.paidAt).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.status !== 'paid' && memberId && (
                        <SubmitPaymentRequestButton
                          feeId={f.id}
                          memberId={memberId}
                          feeName={f.feeType.name}
                          amountDue={Number(f.amountDue)}
                          amountPaid={Number(f.amountPaid)}
                          token={token}
                          clubId={CLUB_ID}
                          apiUrl={API_URL}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
