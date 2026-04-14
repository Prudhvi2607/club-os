'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  token: string
  clubId: string
  seasonId: string
  myUserId: string
  apiUrl: string
}

export function CreateFeeTypeModal({ token, clubId, seasonId, myUserId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', amount: '', studentAmount: '', isRegistrationFee: false })

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/seasons/${seasonId}/fee-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          amount: parseFloat(form.amount),
          ...(form.studentAmount ? { studentAmount: parseFloat(form.studentAmount) } : {}),
          isRegistrationFee: form.isRegistrationFee,
          createdById: myUserId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create fee type')
      }
      setOpen(false)
      setForm({ name: '', amount: '', studentAmount: '', isRegistrationFee: false })
      toast(`Fee type "${form.name}" created`)
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
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        New Fee Type
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-base font-semibold">Create Fee Type</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  placeholder="e.g. Season Dues"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500">Amount ($)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                    placeholder="200.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500">Student Amount ($) <span className="font-normal text-zinc-400">optional</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.studentAmount}
                    onChange={(e) => set('studentAmount', e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                    placeholder="100.00"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isRegistrationFee}
                  onChange={(e) => setForm((f) => ({ ...f, isRegistrationFee: e.target.checked }))}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-600">This is a registration fee</span>
                <span className="text-xs text-zinc-400">(auto-registers member when paid)</span>
              </label>
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
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
