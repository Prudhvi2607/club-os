'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

const STATUSES = ['active', 'inactive'] as const
type Status = (typeof STATUSES)[number]

const STATUS_CLS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-zinc-100 text-zinc-500',
}

interface Props {
  memberId: string
  current: Status
  token: string
  clubId: string
  apiUrl: string
}

export function MemberStatusSelect({ memberId, current, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(current)

  async function onChange(status: Status) {
    if (status === value) return
    setLoading(true)
    setValue(status)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) {
      toast(`Member status updated to ${status}`)
    } else {
      toast('Failed to update status', 'error')
      setValue(current)
    }
    router.refresh()
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[value]} ${loading ? 'opacity-50' : ''}`}>
      <select
        value={value}
        disabled={loading}
        onChange={(e) => onChange(e.target.value as Status)}
        className="appearance-none bg-transparent border-0 p-0 text-xs font-medium capitalize focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </span>
  )
}
