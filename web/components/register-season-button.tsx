'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  seasonId: string
  seasonYear: number
  memberId: string
  defaultMemberType: 'regular' | 'student'
  token: string
  clubId: string
  apiUrl: string
}

export function RegisterSeasonButton({ seasonId, seasonYear, memberId, defaultMemberType, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [memberType, setMemberType] = useState(defaultMemberType)
  const [loading, setLoading] = useState(false)

  async function register() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/seasons/${seasonId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clubMemberId: memberId, memberType }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to register')
      }
      toast(`Registered for ${seasonYear} season`)
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={memberType}
        onChange={(e) => setMemberType(e.target.value as 'regular' | 'student')}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
      >
        <option value="regular">Regular</option>
        <option value="student">Student</option>
      </select>
      <button
        onClick={register}
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Registering…' : `Register for ${seasonYear} Season`}
      </button>
    </div>
  )
}
