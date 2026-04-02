'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  feeId: string
  memberId: string
  feeName: string
  amountDue: number
  amountPaid: number
  token: string
  clubId: string
  apiUrl: string
}

const METHODS = ['venmo', 'zelle', 'cash'] as const

export function SubmitPaymentRequestButton({ feeId, memberId, feeName, amountDue, amountPaid, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ amount: String(amountDue - amountPaid), method: 'venmo', notes: '' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/fees/${feeId}/payment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(form.amount), method: form.method, notes: form.notes || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to submit')
      }
      setOpen(false)
      toast('Payment submitted — waiting for board confirmation')
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        I made a payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-left">
            <h2 className="mb-1 text-base font-semibold">Report Payment</h2>
            <p className="mb-4 text-sm text-zinc-500">{feeName}</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Amount ($)</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Method</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className={inputCls}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m} className="capitalize">{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Notes <span className="font-normal text-zinc-400">— optional</span></label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Sent via Venmo @username"
                  className={inputCls}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const inputCls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400'
