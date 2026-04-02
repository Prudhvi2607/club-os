'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  memberId: string
  memberName: string
  token: string
  clubId: string
  apiUrl: string
}

export function DeleteMemberButton({ memberId, memberName, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setBusy(false)
    if (res.ok || res.status === 204) {
      toast(`${memberName} removed from club`)
      router.refresh()
    } else {
      toast('Failed to remove member', 'error')
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Remove?</span>
        <button
          onClick={confirm}
          disabled={busy}
          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {busy ? 'Removing…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
    >
      Remove
    </button>
  )
}
