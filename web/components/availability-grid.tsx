'use client'

import { useState } from 'react'
import type { MonthCol } from '@/lib/availability-utils'

export type AvailabilityStatus = 'available' | 'partial' | 'unavailable'
export type { MonthCol }

interface AvailabilityRecord {
  clubMemberId: string
  month: number
  year: number
  status: AvailabilityStatus
}

interface MemberRow {
  memberId: string
  name: string
}

function cycle(status: AvailabilityStatus | null): AvailabilityStatus {
  if (!status || status === 'unavailable') return 'available'
  if (status === 'available') return 'partial'
  return 'unavailable'
}

const cellStyles: Record<AvailabilityStatus, string> = {
  available: 'bg-green-100 text-green-700 border-green-200',
  partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  unavailable: 'bg-red-100 text-red-700 border-red-200',
}

const cellLabels: Record<AvailabilityStatus, string> = {
  available: 'Avail',
  partial: 'Partly',
  unavailable: 'N/A',
}

interface Props {
  months: MonthCol[]
  members: MemberRow[]
  initialRecords: AvailabilityRecord[]
  seasonId: string
  readOnly?: boolean
  editableMemberId?: string // if set, only this member's row is editable
  apiUrl?: string
  token?: string
  clubId?: string
}

export function AvailabilityGrid({ months, members, initialRecords, seasonId, readOnly = false, editableMemberId, apiUrl, token, clubId }: Props) {
  const [records, setRecords] = useState<AvailabilityRecord[]>(initialRecords)
  const [saving, setSaving] = useState<string | null>(null)

  function getStatus(memberId: string, month: number, year: number): AvailabilityStatus | null {
    return records.find(r => r.clubMemberId === memberId && r.month === month && r.year === year)?.status ?? null
  }

  async function toggleCell(memberId: string, month: number, year: number) {
    if (editableMemberId && memberId !== editableMemberId) return
    const current = getStatus(memberId, month, year)
    const next = cycle(current)
    const key = `${memberId}-${month}-${year}`
    setSaving(key)

    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seasonId, month, year, status: next }),
      })
      if (!res.ok) throw new Error('Failed')
      setRecords(prev => {
        const filtered = prev.filter(r => !(r.clubMemberId === memberId && r.month === month && r.year === year))
        return [...filtered, { clubMemberId: memberId, month, year, status: next }]
      })
    } catch {
      // silent fail — cell stays as is
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wide min-w-[140px]">
              Member
            </th>
            {months.map(m => (
              <th key={`${m.year}-${m.month}`} className="px-2 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-center min-w-[72px]">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {members.map(member => {
            const editable = !readOnly && (!editableMemberId || member.memberId === editableMemberId)
            return (
              <tr key={member.memberId} className="hover:bg-zinc-50">
                <td className="px-3 py-2 font-medium text-zinc-800 whitespace-nowrap">{member.name}</td>
                {months.map(m => {
                  const status = getStatus(member.memberId, m.month, m.year)
                  const key = `${member.memberId}-${m.month}-${m.year}`
                  const isSaving = saving === key
                  return (
                    <td key={`${m.year}-${m.month}`} className="px-1 py-1.5 text-center">
                      {editable ? (
                        <button
                          onClick={() => toggleCell(member.memberId, m.month, m.year)}
                          disabled={isSaving}
                          className={`w-16 rounded border text-xs py-1 font-medium transition-colors ${
                            isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:opacity-80'
                          } ${status ? cellStyles[status] : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}
                        >
                          {status ? cellLabels[status] : '—'}
                        </button>
                      ) : (
                        <span className={`inline-block w-16 rounded border text-xs py-1 font-medium ${
                          status ? cellStyles[status] : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                        }`}>
                          {status ? cellLabels[status] : '—'}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!readOnly && (
        <p className="mt-3 text-xs text-zinc-400">Click a cell to cycle: Available → Partly → N/A</p>
      )}
    </div>
  )
}
