'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'
import type { CustomRole } from '@/lib/api'

const FIXED_ROLES = ['member', 'student', 'board', 'captain', 'vice_captain'] as const
type FixedRole = (typeof FIXED_ROLES)[number]

const FIXED_LABELS: Record<FixedRole, string> = {
  member: 'Member',
  student: 'Student',
  board: 'Board',
  captain: 'Captain',
  vice_captain: 'Vice Captain',
}

interface Props {
  memberId: string
  currentRoles: FixedRole[]
  assignedCustomRoles: { id: string; customRole: { id: string; name: string } }[]
  allCustomRoles: CustomRole[]
  token: string
  clubId: string
  apiUrl: string
}

export function MemberRolesEditor({
  memberId, currentRoles, assignedCustomRoles, allCustomRoles, token, clubId, apiUrl,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [roles, setRoles] = useState<Set<FixedRole>>(new Set(currentRoles))
  const [busyFixed, setBusyFixed] = useState<FixedRole | null>(null)
  const [busyCustom, setBusyCustom] = useState<string | null>(null)

  const assignedCustomIds = new Set(assignedCustomRoles.map((r) => r.customRole.id))

  async function toggleFixed(role: FixedRole) {
    if (busyFixed) return
    // Enforce mutual exclusivity between captain and vice_captain
    if (role === 'captain' && roles.has('vice_captain') && !roles.has('captain')) {
      toast('Remove Vice Captain role first', 'error')
      return
    }
    if (role === 'vice_captain' && roles.has('captain') && !roles.has('vice_captain')) {
      toast('Remove Captain role first', 'error')
      return
    }
    setBusyFixed(role)
    const has = roles.has(role)
    if (has) {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/roles/${role}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok || res.status === 204) {
        setRoles((prev) => { const next = new Set(prev); next.delete(role); return next })
        toast(`${FIXED_LABELS[role]} role removed`)
      } else {
        toast('Failed to remove role', 'error')
      }
    } else {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        setRoles((prev) => new Set([...prev, role]))
        toast(`${FIXED_LABELS[role]} role added`)
      } else {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Failed to add role', 'error')
      }
    }
    setBusyFixed(null)
    router.refresh()
  }

  async function toggleCustom(role: CustomRole) {
    if (busyCustom) return
    setBusyCustom(role.id)
    const has = assignedCustomIds.has(role.id)
    if (has) {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/custom-roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok || res.status === 204) toast(`${role.name} removed`)
      else toast('Failed to remove role', 'error')
    } else {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/custom-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customRoleId: role.id }),
      })
      if (res.ok) toast(`${role.name} assigned`)
      else {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Failed to assign role', 'error')
      }
    }
    setBusyCustom(null)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-1">
      {FIXED_ROLES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={busyFixed === r}
          onClick={() => toggleFixed(r)}
          className={`rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
            roles.has(r)
              ? 'bg-zinc-800 text-white hover:bg-zinc-600'
              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          {FIXED_LABELS[r]}
        </button>
      ))}
      {allCustomRoles.map((r) => (
        <button
          key={r.id}
          type="button"
          disabled={busyCustom === r.id}
          onClick={() => toggleCustom(r)}
          className={`rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
            assignedCustomIds.has(r.id)
              ? 'bg-zinc-800 text-white hover:bg-zinc-600'
              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          {r.name}
        </button>
      ))}
    </div>
  )
}
