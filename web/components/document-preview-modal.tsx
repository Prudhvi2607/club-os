'use client'

import { useState } from 'react'
import { ExcelPreview } from '@/components/excel-preview'
import { WordPreview } from '@/components/word-preview'

interface Props {
  title: string
  fileUrl: string
}

function getFileType(url: string): 'pdf' | 'image' | 'excel' | 'word' | 'other' {
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(clean)) return 'image'
  if (/\.(xls|xlsx)$/.test(clean)) return 'excel'
  if (/\.(doc|docx)$/.test(clean)) return 'word'
  return 'other'
}

export function DocumentPreviewModal({ title, fileUrl }: Props) {
  const [open, setOpen] = useState(false)
  const type = getFileType(fileUrl)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-medium hover:underline text-zinc-800 text-left"
      >
        {title}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 shrink-0">
              <span className="text-sm font-medium text-zinc-800 truncate">{title}</span>
              <div className="flex items-center gap-3">
                <a
                  href={fileUrl}
                  download={title}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Download ↓
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Open in new tab ↗
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto bg-zinc-100">
              {type === 'pdf' && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={title}
                />
              )}
              {type === 'image' && (
                <div className="flex items-center justify-center h-full p-4">
                  <img src={fileUrl} alt={title} className="max-w-full max-h-full object-contain rounded" />
                </div>
              )}
              {type === 'excel' && <ExcelPreview fileUrl={fileUrl} />}
              {type === 'word' && <WordPreview fileUrl={fileUrl} />}
              {type === 'other' && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm text-zinc-500">Preview not available for this file type.</p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
