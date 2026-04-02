'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  token: string
  createdById: string
  clubId: string
  apiUrl: string
}

export function CreateSeasonModal({ token, createdById, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    registrationFee: '',
  })

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          name: String(form.year),
          createdBy: createdById,
          registrationFee: form.registrationFee ? Number(form.registrationFee) : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create season')
      }
      setOpen(false)
      setForm({ year: new Date().getFullYear(), startDate: '', endDate: '', registrationFee: '' })
      toast(`${form.year} season created`)
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
        New Season
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl text-left">
            <h2 className="mb-4 text-base font-semibold">Create Season</h2>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Year">
                <input
                  required
                  type="number"
                  value={form.year}
                  onChange={(e) => set('year', parseInt(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date">
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Registration Fee ($)" hint="optional">
                <input
                  type="number"
                  min="0"
                  value={form.registrationFee}
                  onChange={(e) => set('registrationFee', e.target.value)}
                  className={inputCls}
                  placeholder="200"
                />
              </Field>

              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-500">
        {label}{hint && <span className="font-normal"> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400'
