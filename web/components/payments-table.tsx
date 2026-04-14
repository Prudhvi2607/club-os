'use client'

import { useState } from 'react'
import { RecordPaymentModal } from '@/components/record-payment-modal'
import { UndoPaymentButton } from '@/components/undo-payment-button'
import { formatDateShort } from '@/lib/format'

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-600',
}

interface Props {
  fees: any[]
  feeTypesEmpty: boolean
  myUserId: string
  token: string
  clubId: string
  apiUrl: string
}

export function PaymentsTable({ fees, feeTypesEmpty, myUserId, token, clubId, apiUrl }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? fees.filter((f) => f.clubMember.user.fullName.toLowerCase().includes(search.toLowerCase()))
    : fees

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="sticky left-0 w-32 bg-zinc-50 px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Member</th>
              <th className="sticky left-32 bg-zinc-50 px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide">Due</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide">Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Fee</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  {feeTypesEmpty
                    ? 'Create a fee type, then assign it to members.'
                    : 'No fees assigned yet. Use "Assign to all" on a fee type.'}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No members match "{search}"
                </td>
              </tr>
            ) : (
              filtered.flatMap((fee) => [
                <tr key={fee.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="sticky left-0 w-32 bg-white px-4 py-3 font-medium truncate max-w-[128px]">{fee.clubMember.user.fullName}</td>
                  <td className="sticky left-32 bg-white px-4 py-3 text-right">${Number(fee.amountDue).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div>${Number(fee.amountPaid).toFixed(2)}</div>
                    {fee.payments.map((payment: any) => (
                      <div key={payment.id} className="text-xs text-zinc-400 mt-0.5 capitalize">
                        {payment.method} · {formatDateShort(payment.paidAt)}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[fee.status]}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{fee.feeType.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
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
                          clubId={clubId}
                          apiUrl={apiUrl}
                        />
                      )}
                      {fee.payments.map((payment: any) => (
                        <UndoPaymentButton
                          key={payment.id}
                          paymentId={payment.id}
                          feeId={fee.id}
                          memberId={fee.clubMember.id}
                          amount={Number(payment.amount)}
                          token={token}
                          clubId={clubId}
                          apiUrl={apiUrl}
                        />
                      ))}
                    </div>
                  </td>
                </tr>,
              ])
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
