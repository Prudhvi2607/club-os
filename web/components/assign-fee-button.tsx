'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  feeTypeId: string
  feeName: string
  seasonId: string
  token: string
  clubId: string
  apiUrl: string
}

export function AssignFeeButton({ feeTypeId, feeName, seasonId, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function assign() {
    setLoading(true)
    try {
      const res = await fetch(
        `${apiUrl}/clubs/${clubId}/seasons/${seasonId}/fee-types/${feeTypeId}/assign-all`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to assign')
      const data = await res.json()
      toast(data.assigned === 0 ? 'All members already assigned' : `Assigned to ${data.assigned} members`)
      router.refresh()
    } catch {
      toast('Failed to assign fee', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={assign}
      disabled={loading}
      className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Assigning…' : 'Assign to all'}
    </button>
  )
}
