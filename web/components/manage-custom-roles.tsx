'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'
import type { CustomRole } from '@/lib/api'

interface Props {
  customRoles: CustomRole[]
  token: string
  clubId: string
  apiUrl: string
}

export function ManageCustomRoles({ customRoles, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/custom-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create role')
      }
      setName('')
      toast(`"${name.trim()}" role created`)
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  async function deleteRole(role: CustomRole) {
    const res = await fetch(`${apiUrl}/clubs/${clubId}/custom-roles/${role.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok || res.status === 204) {
      toast(`"${role.name}" role deleted`)
      router.refresh()
    } else {
      toast('Failed to delete role', 'error')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        Custom Roles
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold">Custom Roles</h2>

            <div className="flex flex-wrap gap-2">
              {customRoles.length === 0 && (
                <p className="text-xs text-zinc-400">No custom roles yet.</p>
              )}
              {customRoles.map((r) => (
                <div key={r.id} className="flex items-center gap-1.5 rounded-full bg-zinc-100 pl-3 pr-1.5 py-1">
                  <span className="text-xs font-medium text-zinc-700">{r.name}</span>
                  <span className="text-xs text-zinc-400">{r._count.members}</span>
                  <button
                    onClick={() => deleteRole(r)}
                    className="ml-0.5 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={create} className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Junior, Volunteer…"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <button
                type="submit"
                disabled={adding || !name.trim()}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
            </form>

            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
