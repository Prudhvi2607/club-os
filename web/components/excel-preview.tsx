'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

interface Props {
  fileUrl: string
}

interface SheetData {
  name: string
  rows: string[][]
}

export function ExcelPreview({ fileUrl }: Props) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(fileUrl)
        if (!res.ok) throw new Error('Failed to fetch file')
        const buf = await res.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const parsed = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name]
          const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
          return { name, rows }
        })
        setSheets(parsed)
      } catch (e: any) {
        setError(e.message)
      }
    }
    load()
  }, [fileUrl])

  if (error) return <div className="flex items-center justify-center h-full text-sm text-zinc-400">{error}</div>
  if (!sheets.length) return <div className="flex items-center justify-center h-full text-sm text-zinc-400">Loading…</div>

  const current = sheets[activeSheet]

  return (
    <div className="flex flex-col h-full">
      {sheets.length > 1 && (
        <div className="flex gap-1 px-3 py-2 border-b border-zinc-200 bg-white shrink-0">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActiveSheet(i)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                i === activeSheet ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="text-xs border-collapse min-w-full">
          <tbody>
            {current.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-zinc-50 font-medium' : 'hover:bg-zinc-50'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-zinc-200 px-2 py-1 whitespace-nowrap">
                    {cell ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
