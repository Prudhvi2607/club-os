'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  seasonId: string
  tournamentId: string
  tournamentName: string
  token: string
  clubId: string
  apiUrl: string
}

export function DeleteTournamentButton({ seasonId, tournamentId, tournamentName, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function deleteTournament() {
    setDeleting(true)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/seasons/${seasonId}/tournaments/${tournamentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setDeleting(false)
    if (res.ok || res.status === 204) {
      toast(`${tournamentName} deleted`)
      router.refresh()
    } else {
      toast('Failed to delete tournament', 'error')
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-zinc-500">Delete?</span>
        <button
          onClick={deleteTournament}
          disabled={deleting}
          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Yes'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  )
}
