'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  announcementId: string
  token: string
  clubId: string
  apiUrl: string
}

export function DeleteAnnouncementButton({ announcementId, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function del() {
    setDeleting(true)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setDeleting(false)
    if (res.ok || res.status === 204) {
      toast('Announcement deleted')
      router.refresh()
    } else {
      toast('Failed to delete', 'error')
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={del} disabled={deleting} className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)} className="text-xs text-zinc-400 hover:text-red-600 transition-colors">
      Delete
    </button>
  )
}
