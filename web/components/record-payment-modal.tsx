'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

const METHODS = ['venmo', 'zelle', 'cash'] as const

interface Props {
  feeId: string
  memberId: string
  memberName: string
  feeName: string
  amountDue: number
  amountPaid: number
  myUserId: string
  token: string
  clubId: string
  apiUrl: string
}

export function RecordPaymentModal({
  feeId, memberId, memberName, feeName, amountDue, amountPaid, myUserId, token, clubId, apiUrl,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const remaining = amountDue - amountPaid
  const [form, setForm] = useState({ amount: String(remaining > 0 ? remaining : ''), method: 'venmo', notes: '' })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/fees/${feeId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          method: form.method,
          recordedById: myUserId,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to record payment')
      }
      setOpen(false)
      toast(`$${form.amount} recorded for ${memberName}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
      >
        Record
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold">Record Payment</h2>
            <p className="mb-4 text-xs text-zinc-400">
              {memberName} — {feeName} · ${amountPaid} of ${amountDue} paid
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Amount ($)</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={remaining}
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Method</label>
                <div className="flex gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('method', m)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                        form.method === m
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Notes <span className="font-normal">(optional)</span></label>
                <input
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  placeholder="e.g. paid at practice"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
