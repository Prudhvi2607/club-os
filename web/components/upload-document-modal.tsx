'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast-provider'

const CATEGORIES = [
  { value: 'bylaws', label: 'Bylaws / Constitution' },
  { value: 'code_of_conduct', label: 'Code of Conduct' },
  { value: 'other', label: 'Other' },
]

interface Props {
  token: string
  apiUrl: string
  clubId: string
  uploadedById: string
}

export function UploadDocumentModal({ token, apiUrl, clubId, uploadedById }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [visibility, setVisibility] = useState('club')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle('')
    setCategory('other')
    setVisibility('club')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${clubId}/${Date.now()}-${title.replace(/\s+/g, '-')}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('club-docs')
        .upload(path, file, { upsert: false })
      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('club-docs').getPublicUrl(path)

      const res = await fetch(`${apiUrl}/clubs/${clubId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, fileUrl: publicUrl, category, visibility, uploadedById }),
      })
      if (!res.ok) throw new Error('Failed to save document')

      toast('Document uploaded')
      reset()
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        + Upload
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4"
        suppressHydrationWarning
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Upload Document</h2>
          <button type="button" onClick={() => { setOpen(false); reset() }} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="e.g. Club Constitution 2026"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Visible to</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="club">All members</option>
              <option value="board">Board only</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">File</label>
            <input
              ref={fileRef}
              required
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-zinc-500 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
            <p className="text-xs text-zinc-400">PDF, Word, Excel, or image</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setOpen(false); reset() }}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  )
}
