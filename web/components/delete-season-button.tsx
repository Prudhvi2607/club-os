'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  seasonId: string
  seasonName: string
  token: string
  clubId: string
  apiUrl: string
}

export function DeleteSeasonButton({ seasonId, seasonName, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/seasons/${seasonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to delete')
      }
      setOpen(false)
      toast(`${seasonName} deleted`)
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-left">
            <h2 className="text-base font-semibold">Delete Season</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Are you sure you want to permanently delete the <span className="font-medium text-zinc-900">{seasonName}</span> season?
              This will remove all fee types, payments, squad assignments, and registrations for this season.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
