'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Props {
  docId: string
  docTitle: string
  token: string
  apiUrl: string
  clubId: string
}

export function DeleteDocumentButton({ docId, docTitle, token, apiUrl, clubId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<'idle' | 'renaming' | 'confirming'>('idle')
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState(docTitle)

  async function handleRename() {
    if (!newTitle.trim() || newTitle === docTitle) { setMode('idle'); return }
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error('Failed to rename')
      toast('Document renamed')
      router.refresh()
    } catch {
      toast('Failed to rename document', 'error')
    } finally {
      setLoading(false)
      setMode('idle')
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Document deleted')
      router.refresh()
    } catch {
      toast('Failed to delete document', 'error')
    } finally {
      setLoading(false)
      setMode('idle')
    }
  }

  if (mode === 'renaming') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input
          autoFocus
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setMode('idle') }}
          className="rounded border border-zinc-300 px-2 py-0.5 text-xs outline-none focus:border-zinc-500 w-40"
        />
        <button onClick={handleRename} disabled={loading} className="text-xs text-zinc-700 font-medium hover:text-zinc-900 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setMode('idle'); setNewTitle(docTitle) }} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
      </span>
    )
  }

  if (mode === 'confirming') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-zinc-500">Delete?</span>
        <button onClick={handleDelete} disabled={loading} className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50">
          {loading ? 'Deleting…' : 'Yes'}
        </button>
        <button onClick={() => setMode('idle')} className="text-xs text-zinc-400 hover:text-zinc-600">No</button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button onClick={() => setMode('renaming')} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
        Rename
      </button>
      <button onClick={() => setMode('confirming')} className="text-xs text-zinc-400 hover:text-red-500 transition-colors">
        Delete
      </button>
    </span>
  )
}
