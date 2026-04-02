'use client'

import { useEffect, useState } from 'react'
import mammoth from 'mammoth'

interface Props {
  fileUrl: string
}

export function WordPreview({ fileUrl }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(fileUrl)
        if (!res.ok) throw new Error('Failed to fetch file')
        const buf = await res.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer: buf })
        setHtml(result.value)
      } catch (e: any) {
        setError(e.message)
      }
    }
    load()
  }, [fileUrl])

  if (error) return <div className="flex items-center justify-center h-full text-sm text-zinc-400">{error}</div>
  if (!html) return <div className="flex items-center justify-center h-full text-sm text-zinc-400">Loading…</div>

  return (
    <div
      className="p-8 max-w-3xl mx-auto prose prose-sm prose-zinc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
