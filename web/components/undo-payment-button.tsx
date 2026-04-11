'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  paymentId: string
  feeId: string
  memberId: string
  amount: number
  token: string
  clubId: string
  apiUrl: string
}

export function UndoPaymentButton({ paymentId, feeId, memberId, amount, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function undo() {
    setLoading(true)
    try {
      const res = await fetch(
        `${apiUrl}/clubs/${clubId}/members/${memberId}/fees/${feeId}/payments/${paymentId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to undo payment')
      toast(`$${amount.toFixed(2)} payment undone`)
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
          onClick={undo}
          disabled={loading}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Undoing…' : 'Confirm'}
        </button>
        <span className="text-zinc-300">·</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
    >
      Undo
    </button>
  )
}
