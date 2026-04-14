'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  feeId: string
  memberId: string
  memberName: string
  remaining: number
  myUserId: string
  token: string
  clubId: string
  apiUrl: string
}

export function QuickPayButton({ feeId, memberId, memberName, remaining, myUserId, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function pay() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/fees/${feeId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: remaining, method: 'cash', recordedById: myUserId }),
      })
      if (!res.ok) throw new Error('Failed to record payment')
      toast(`$${remaining.toFixed(0)} cash recorded for ${memberName}`)
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={pay}
          disabled={loading}
          className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : 'Confirm'}
        </button>
        <span className="text-zinc-300">·</span>
        <button onClick={() => setConfirming(false)} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-zinc-400 hover:text-green-700 transition-colors"
      title={`Mark $${remaining.toFixed(0)} paid in cash`}
    >
      Cash ✓
    </button>
  )
}
