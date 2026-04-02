'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Team {
  id: string
  name: string
}

interface Props {
  sentById: string
  teams: Team[]
  token: string
  clubId: string
  apiUrl: string
}

export function CreateAnnouncementModal({ sentById, teams, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ subject: '', body: '', audience: 'club', teamId: '' })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: form.subject,
          body: form.body,
          audience: form.audience,
          sentById,
          ...(form.audience === 'team' && form.teamId ? { teamId: form.teamId } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send')
      }
      setOpen(false)
      setForm({ subject: '', body: '', audience: 'club', teamId: '' })
      toast('Announcement sent')
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
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        New Announcement
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl text-left">
            <h2 className="mb-4 text-base font-semibold">New Announcement</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Audience</label>
                <div className="flex gap-2">
                  {(['club', 'board', 'team'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => set('audience', a)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                        form.audience === a
                          ? 'bg-zinc-900 text-white'
                          : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {form.audience === 'team' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500">Team</label>
                  <select
                    required
                    value={form.teamId}
                    onChange={(e) => set('teamId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— select team —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Subject</label>
                <input
                  required
                  type="text"
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.body}
                  onChange={(e) => set('body', e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Sending…' : 'Send'}
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
