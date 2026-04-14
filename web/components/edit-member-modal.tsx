'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

const ROLES = ['member', 'student', 'board', 'captain', 'vice_captain'] as const
type Role = (typeof ROLES)[number]

const ROLE_LABELS: Record<Role, string> = {
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
  member: {
    id: string
    roles: { id: string; role: string }[]
    user: {
      fullName: string
      email: string | null
      phone: string | null
      playingRole: string | null
    }
  }
  token: string
  clubId: string
  apiUrl: string
}

export function EditMemberModal({ member, token, clubId, apiUrl }: Props) {
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
  const [roles, setRoles] = useState<string[]>(member.roles.map((r) => r.role))
  const [form, setForm] = useState({
    fullName: member.user.fullName,
    email: member.user.email ?? '',
    phone: member.user.phone ?? '',
    playingRole: member.user.playingRole ?? '',
  })

  useEffect(() => {
    if (open) {
      setRoles(member.roles.map((r) => r.role))
      setForm({
        fullName: member.user.fullName,
        email: member.user.email ?? '',
        phone: member.user.phone ?? '',
        playingRole: member.user.playingRole ?? '',
      })
    }
  }, [open])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleRole(role: string) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Update basic info
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          playingRole: form.playingRole || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }

      // Diff roles and apply changes
      const original = new Set(member.roles.map((r) => r.role))
      const updated = new Set(roles)
      const toAdd = roles.filter((r) => !original.has(r))
      const toRemove = [...original].filter((r) => !updated.has(r))

      await Promise.all([
        ...toAdd.map((role) =>
          fetch(`${apiUrl}/clubs/${clubId}/members/${member.id}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ role }),
          })
        ),
        ...toRemove.map((role) =>
          fetch(`${apiUrl}/clubs/${clubId}/members/${member.id}/roles/${role}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        ),
      ])

      setOpen(false)
      toast(`${form.fullName} updated`)
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
        className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl text-left">
            <h2 className="mb-4 text-base font-semibold">Edit Member</h2>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Full Name">
                <input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email" hint="optional">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="rahul@example.com" />
              </Field>
              <Field label="Phone" hint="optional">
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="Playing Role">
                <select value={form.playingRole} onChange={(e) => set('playingRole', e.target.value)} className={inputCls}>
                  <option value="">— select —</option>
                  {Object.entries(PLAYING_ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
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
                        roles.includes(r)
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
