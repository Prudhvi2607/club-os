'use client'

import { useState, useEffect } from 'react'

interface Season {
  id: string
  name: string
  year: number
}

interface Props {
  sponsorId: string
  sponsorName: string
  seasons: Season[]
  token: string
  clubId: string
  apiUrl: string
  recordedById: string
  onAdded: () => void
}

export function AddContributionModal({ sponsorId, sponsorName, seasons, token, apiUrl, clubId, recordedById, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [receivedAt, setReceivedAt] = useState('')
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
      const res = await fetch(`${apiUrl}/clubs/${clubId}/sponsors/${sponsorId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || undefined,
          seasonId: seasonId || undefined,
          receivedAt: receivedAt || undefined,
          recordedById,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setOpen(false)
      setAmount('')
      setDescription('')
      setSeasonId('')
      setReceivedAt('')
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
        className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
      >
        + contribution
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-1">Record Contribution</h2>
            <p className="text-sm text-zinc-500 mb-4">{sponsorName}</p>
            <form onSubmit={submit} className="space-y-3">
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
                <label className="block text-xs font-medium text-zinc-600 mb-1">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                <label className="block text-xs font-medium text-zinc-600 mb-1">Received Date</label>
                <input
                  type="date"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
