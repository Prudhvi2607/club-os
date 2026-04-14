'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

const ROLES = ['member', 'student', 'board', 'captain', 'vice_captain'] as const
const PLAYING_ROLES = ['batter', 'bowler', 'allrounder', 'wicket_keeper'] as const

const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  student: 'Student',
  board: 'Board',
  captain: 'Captain',
  vice_captain: 'Vice Captain',
}

const PLAYING_ROLE_LABELS: Record<string, string> = {
  batter: 'Batter',
  bowler: 'Bowler',
  allrounder: 'Allrounder',
  wicket_keeper: 'Wicket Keeper',
}

interface Props {
  token: string
  clubId: string
  apiUrl: string
}

export function CreateMemberModal({ token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    playingRole: '',
    roles: ['member'] as string[],
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          playingRole: form.playingRole || undefined,
          roles: form.roles,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add member')
      }
      setOpen(false)
      setForm({ fullName: '', email: '', phone: '', playingRole: '', roles: ['member'] })
      toast(`${form.fullName} added as a member`)
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
        Add Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-base font-semibold">Add Member</h2>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Full Name">
                <input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} placeholder="Rahul Sharma" />
              </Field>
              <Field label="Email" hint="optional — needed for login">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="rahul@example.com" />
              </Field>
              <Field label="Phone" hint="optional">
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="Playing Role">
                <select value={form.playingRole} onChange={(e) => set('playingRole', e.target.value)} className={inputCls}>
                  <option value="">— select —</option>
                  {PLAYING_ROLES.map((r) => (
                    <option key={r} value={r}>{PLAYING_ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Club Roles">
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        form.roles.includes(r)
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </Field>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Adding…' : 'Add Member'}
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
