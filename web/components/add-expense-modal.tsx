'use client'

import { useState, useEffect } from 'react'

const CATEGORIES = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'venue', label: 'Venue' },
  { value: 'travel', label: 'Travel' },
  { value: 'uniforms', label: 'Uniforms' },
  { value: 'food', label: 'Food' },
  { value: 'registration_fees', label: 'Registration Fees' },
  { value: 'other', label: 'Other' },
]

interface Season {
  id: string
  name: string
  year: number
}

interface Props {
  seasons: Season[]
  token: string
  clubId: string
  apiUrl: string
  recordedById: string
  onAdded: () => void
}

export function AddExpenseModal({ seasons, token, apiUrl, clubId, recordedById, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('other')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          description,
          amount: parseFloat(amount),
          seasonId: seasonId || undefined,
          paidAt: paidAt || undefined,
          notes: notes || undefined,
          recordedById,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setOpen(false)
      setCategory('other')
      setDescription('')
      setAmount('')
      setSeasonId('')
      setPaidAt('')
      setNotes('')
      onAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        + Add Expense
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Expense</h2>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Description *</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Season</label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="">None</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Date Paid</label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
