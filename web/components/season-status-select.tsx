'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

const STATUSES = ['upcoming', 'active', 'completed'] as const
type Status = (typeof STATUSES)[number]

interface Props {
  seasonId: string
  current: Status
  token: string
  clubId: string
  apiUrl: string
}

export function SeasonStatusSelect({ seasonId, current, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function onChange(status: Status) {
    if (status === current) return
    setLoading(true)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/seasons/${seasonId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) {
      toast(`Season marked as ${status}`)
    } else {
      toast('Failed to update status', 'error')
    }
    router.refresh()
  }

  return (
    <select
      value={current}
      disabled={loading}
      onChange={(e) => onChange(e.target.value as Status)}
      className="rounded-full border-0 bg-transparent py-0 text-xs font-medium capitalize focus:ring-0 cursor-pointer disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}
