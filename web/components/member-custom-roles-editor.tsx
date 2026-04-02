'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'
import type { CustomRole } from '@/lib/api'

interface Props {
  memberId: string
  assignedCustomRoles: { id: string; customRole: { id: string; name: string } }[]
  allCustomRoles: CustomRole[]
  token: string
  clubId: string
  apiUrl: string
}

export function MemberCustomRolesEditor({
  memberId, assignedCustomRoles, allCustomRoles, token, clubId, apiUrl,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  const assignedIds = new Set(assignedCustomRoles.map((r) => r.customRole.id))

  async function toggle(role: CustomRole) {
    if (busy) return
    setBusy(role.id)
    const has = assignedIds.has(role.id)

    if (has) {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/custom-roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok || res.status === 204) toast(`${role.name} removed`)
      else {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? `Failed to remove role (${res.status})`, 'error')
      }
    } else {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/custom-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customRoleId: role.id }),
      })
      if (res.ok) toast(`${role.name} assigned`)
      else {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? `Failed to assign role (${res.status})`, 'error')
      }
    }

    setBusy(null)
    router.refresh()
  }

  if (allCustomRoles.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {allCustomRoles.map((r) => (
        <button
          key={r.id}
          type="button"
          disabled={busy === r.id}
          onClick={() => toggle(r)}
          className={`rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
            assignedIds.has(r.id)
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          {r.name}
        </button>
      ))}
    </div>
  )
}
