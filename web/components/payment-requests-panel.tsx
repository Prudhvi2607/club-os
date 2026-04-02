'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'
import type { PaymentRequest } from '@/lib/api'

interface Props {
  requests: PaymentRequest[]
  myUserId: string
  token: string
  clubId: string
  apiUrl: string
}

export function PaymentRequestsPanel({ requests, myUserId, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  async function resolve(requestId: string, action: 'confirm' | 'reject') {
    setBusy(requestId)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/payment-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, recordedById: myUserId }),
    })
    setBusy(null)
    if (res.ok) {
      toast(action === 'confirm' ? 'Payment confirmed' : 'Payment rejected')
      router.refresh()
    } else {
      toast('Failed to update request', 'error')
    }
  }

  if (requests.length === 0) return null

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-2">
        Pending Payment Reports
        <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-semibold w-5 h-5">
          {requests.length}
        </span>
      </h2>
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden divide-y divide-zinc-100">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{r.clubMember.user.fullName}</p>
              <p className="text-xs text-zinc-500">
                ${Number(r.amount).toFixed(0)} via {r.method} · {r.memberFee.feeType.name}
                {r.notes && <span className="ml-1 text-zinc-400">· {r.notes}</span>}
              </p>
              <p className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => resolve(r.id, 'confirm')}
                disabled={busy === r.id}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {busy === r.id ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => resolve(r.id, 'reject')}
                disabled={busy === r.id}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
