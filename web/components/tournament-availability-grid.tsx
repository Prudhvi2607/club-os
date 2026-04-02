'use client'

import { useState } from 'react'
import type { Tournament, MemberAvailability } from '@/lib/api'

type Status = 'available' | 'partial' | 'unavailable'

const STATUS_CYCLE: Status[] = ['available', 'partial', 'unavailable']

const cellStyles: Record<Status, string> = {
  available: 'bg-green-100 text-green-700 border-green-200',
  partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  unavailable: 'bg-red-100 text-red-700 border-red-200',
}

const cellLabels: Record<Status, string> = {
  available: 'Available',
  partial: 'Partly',
  unavailable: 'N/A',
}

interface Props {
  tournaments: Tournament[]
  memberId: string
  memberName: string
  initialAvailability: MemberAvailability[]
  seasonId: string
  editable: boolean
  apiUrl: string
  token: string
  clubId: string
}

export function TournamentAvailabilityGrid({
  tournaments, memberId, memberName, initialAvailability, seasonId, editable, apiUrl, token, clubId
}: Props) {
  const [availability, setAvailability] = useState<MemberAvailability[]>(initialAvailability)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')

  function getRecord(tournamentId: string) {
    return availability.find((a) => a.tournamentId === tournamentId)
  }

  async function toggleStatus(tournamentId: string) {
    if (!editable) return
    const current = getRecord(tournamentId)?.status
    const currentIdx = current ? STATUS_CYCLE.indexOf(current) : -1
    const next = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
    setSaving(tournamentId)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seasonId, tournamentId, status: next, notes: current ? getRecord(tournamentId)?.notes : undefined }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setAvailability((prev) => {
        const filtered = prev.filter((a) => a.tournamentId !== tournamentId)
        return [...filtered, updated]
      })
    } catch {
      // silent
    } finally {
      setSaving(null)
    }
  }

  async function saveNotes(tournamentId: string) {
    const current = getRecord(tournamentId)
    if (!current) return
    setSaving(tournamentId)
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/members/${memberId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seasonId, tournamentId, status: current.status, notes: notesDraft || null }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setAvailability((prev) => [...prev.filter((a) => a.tournamentId !== tournamentId), updated])
    } catch {
      // silent
    } finally {
      setSaving(null)
      setEditingNotes(null)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide w-40">
              {editable ? 'Tournament' : memberName}
            </th>
            {tournaments.map((t) => (
              <th key={t.id} className="px-3 py-3 text-center text-xs font-medium text-zinc-500 min-w-[120px]">
                <div>{t.name}</div>
                <div className="text-zinc-400 font-normal">
                  {new Date(t.startDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(t.endDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </div>
              </th>
            ))}
            {editable && <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Notes</th>}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-3 font-medium text-zinc-700 text-sm">
              {editable ? 'My availability' : ''}
            </td>
            {tournaments.map((t) => {
              const record = getRecord(t.id)
              const status = record?.status
              const isSaving = saving === t.id
              return (
                <td key={t.id} className="px-2 py-3 text-center">
                  {editable ? (
                    <button
                      onClick={() => toggleStatus(t.id)}
                      disabled={isSaving}
                      className={`rounded border px-3 py-1 text-xs font-medium w-full transition-colors ${
                        isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:opacity-80'
                      } ${status ? cellStyles[status] : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}
                    >
                      {status ? cellLabels[status] : '— Click —'}
                    </button>
                  ) : (
                    <span className={`inline-block rounded border px-3 py-1 text-xs font-medium w-full ${
                      status ? cellStyles[status] : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                    }`}>
                      {status ? cellLabels[status] : '—'}
                    </span>
                  )}
                </td>
              )
            })}
            {editable && (
              <td className="px-3 py-3">
                {/* notes shown per-tournament inline below */}
              </td>
            )}
          </tr>
          {editable && (
            <tr className="border-t border-zinc-50">
              <td className="px-4 py-2 text-xs text-zinc-400">Unavailable dates</td>
              {tournaments.map((t) => {
                const record = getRecord(t.id)
                const isEditing = editingNotes === t.id
                return (
                  <td key={t.id} className="px-2 py-2 text-center">
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <input
                          autoFocus
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="e.g. Apr 18-19"
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                          onKeyDown={(e) => { if (e.key === 'Enter') saveNotes(t.id); if (e.key === 'Escape') setEditingNotes(null) }}
                        />
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => saveNotes(t.id)} className="text-xs text-zinc-700 font-medium hover:text-zinc-900">Save</button>
                          <button onClick={() => setEditingNotes(null)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNotes(t.id); setNotesDraft(record?.notes ?? '') }}
                        className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors w-full text-center"
                      >
                        {record?.notes ? <span className="text-zinc-600">{record.notes}</span> : '+ add'}
                      </button>
                    )}
                  </td>
                )
              })}
              <td />
            </tr>
          )}
          {!editable && availability.some((a) => a.notes) && (
            <tr className="border-t border-zinc-50 bg-zinc-50">
              <td className="px-4 py-2 text-xs text-zinc-400">Notes</td>
              {tournaments.map((t) => {
                const record = getRecord(t.id)
                return (
                  <td key={t.id} className="px-2 py-2 text-center text-xs text-zinc-500">
                    {record?.notes ?? ''}
                  </td>
                )
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
