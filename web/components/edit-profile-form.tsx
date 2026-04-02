'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

const PLAYING_ROLES = ['batter', 'bowler', 'allrounder', 'wicket_keeper'] as const
const TSHIRT_SIZES = ['38', '40', '42', '44', '46', '48'] as const

interface Props {
  token: string
  apiUrl: string
  takenJerseyNumbers: number[]
  initial: {
    fullName: string
    phone: string | null
    playingRole: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    emergencyContactRelationship: string | null
    jerseyNumber: number | null
    tshirtSize: string | null
    cricclubsUrl: string | null
  }
}

export function EditProfileForm({ token, apiUrl, takenJerseyNumbers, initial }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: initial.fullName ?? '',
    phone: initial.phone ?? '',
    playingRole: initial.playingRole ?? '',
    emergencyContactName: initial.emergencyContactName ?? '',
    emergencyContactPhone: initial.emergencyContactPhone ?? '',
    emergencyContactRelationship: initial.emergencyContactRelationship ?? '',
    jerseyNumber: initial.jerseyNumber != null ? String(initial.jerseyNumber) : '',
    tshirtSize: initial.tshirtSize ?? '',
    cricclubsUrl: initial.cricclubsUrl ?? '',
  })

  const jerseyTaken = form.jerseyNumber !== '' && takenJerseyNumbers.includes(Number(form.jerseyNumber))

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone || undefined,
          playingRole: form.playingRole || undefined,
          emergencyContactName: form.emergencyContactName || undefined,
          emergencyContactPhone: form.emergencyContactPhone || undefined,
          emergencyContactRelationship: form.emergencyContactRelationship || undefined,
          jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : null,
          tshirtSize: form.tshirtSize || null,
          cricclubsUrl: form.cricclubsUrl || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      toast('Profile saved')
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" suppressHydrationWarning>
      {/* Basic info */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold">Basic Info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <input
              required
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inputCls}
              placeholder="+1 555 000 0000"
            />
          </Field>
          <Field label="Playing Role">
            <select value={form.playingRole} onChange={(e) => set('playingRole', e.target.value)} className={inputCls}>
              <option value="">— select —</option>
              {PLAYING_ROLES.map((r) => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Jersey Number">
            <input
              type="number"
              min={0}
              max={999}
              value={form.jerseyNumber}
              onChange={(e) => set('jerseyNumber', e.target.value)}
              className={`${inputCls} ${jerseyTaken ? 'border-red-400 focus:border-red-400' : ''}`}
              placeholder="e.g. 7"
            />
            {jerseyTaken && <p className="mt-1 text-xs text-red-500">#{form.jerseyNumber} is already taken</p>}
          </Field>
          <Field label="CricClubs Profile URL">
            <input
              value={form.cricclubsUrl}
              onChange={(e) => set('cricclubsUrl', e.target.value)}
              className={inputCls}
              placeholder="https://www.cricclubs.com/..."
            />
          </Field>
          <Field label="T-Shirt Size (Indian)">
            <select value={form.tshirtSize} onChange={(e) => set('tshirtSize', e.target.value)} className={inputCls}>
              <option value="">— select —</option>
              {TSHIRT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Emergency contact */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold">Emergency Contact <span className="text-xs font-normal text-zinc-400">optional</span></h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name">
            <input
              value={form.emergencyContactName}
              onChange={(e) => set('emergencyContactName', e.target.value)}
              className={inputCls}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.emergencyContactPhone}
              onChange={(e) => set('emergencyContactPhone', e.target.value)}
              className={inputCls}
              placeholder="+1 555 000 0000"
            />
          </Field>
          <Field label="Relationship">
            <input
              value={form.emergencyContactRelationship}
              onChange={(e) => set('emergencyContactRelationship', e.target.value)}
              className={inputCls}
              placeholder="Spouse, Parent…"
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || jerseyTaken}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
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

const inputCls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 capitalize'
