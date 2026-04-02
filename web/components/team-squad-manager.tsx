'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'
import type { Member, SquadAssignment, Tournament } from '@/lib/api'

interface Team {
  id: string
  name: string
  assignments: SquadAssignment[]
}

interface Props {
  team: Team
  allMembers: Member[]
  seasonId: string
  seasonTournaments: Tournament[]
  myUserId: string
  token: string
  clubId: string
  apiUrl: string
}

export function TeamSquadManager({ team, allMembers, seasonId, seasonTournaments, myUserId, token, clubId, apiUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingTournament, setTogglingTournament] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(team.name)
  const [savingName, setSavingName] = useState(false)

  const assignedIds = new Set(team.assignments.map((a) => a.clubMember.id))
  const available = allMembers.filter((m) => !assignedIds.has(m.id))

  async function assign() {
    if (!selectedMemberId) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/clubs/${clubId}/teams/${team.id}/squad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clubMemberId: selectedMemberId, seasonId, assignedById: myUserId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add player')
      }
      const name = allMembers.find((m) => m.id === selectedMemberId)?.user.fullName ?? 'Player'
      setAdding(false)
      setSelectedMemberId('')
      toast(`${name} added to ${team.name}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function deleteTeam() {
    setDeleting(true)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/teams/${team.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setDeleting(false)
    if (res.ok || res.status === 204) {
      toast(`${team.name} deleted`)
      router.refresh()
    } else {
      toast('Failed to delete team', 'error')
      setConfirmDelete(false)
    }
  }

  async function toggleTournament(tournament: Tournament, isIn: boolean) {
    setTogglingTournament(tournament.id)
    const base = `${apiUrl}/clubs/${clubId}/seasons/${tournament.seasonId}/tournaments/${tournament.id}/teams`
    const res = await fetch(isIn ? `${base}/${team.id}` : base, {
      method: isIn ? 'DELETE' : 'POST',
      headers: isIn
        ? { Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: isIn ? undefined : JSON.stringify({ teamId: team.id }),
    })
    setTogglingTournament(null)
    if (res.ok || res.status === 204 || res.status === 201) {
      router.refresh()
    } else {
      toast('Failed to update tournament', 'error')
    }
  }

  async function saveName() {
    if (!nameValue.trim() || nameValue === team.name) { setEditingName(false); return }
    setSavingName(true)
    const res = await fetch(`${apiUrl}/clubs/${clubId}/teams/${team.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: nameValue.trim() }),
    })
    setSavingName(false)
    if (res.ok) {
      setEditingName(false)
      toast(`Team renamed to ${nameValue.trim()}`)
      router.refresh()
    } else {
      toast('Failed to rename team', 'error')
    }
  }

  async function remove(assignmentId: string, name: string) {
    const res = await fetch(`${apiUrl}/clubs/${clubId}/teams/${team.id}/squad/${assignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok || res.status === 204) {
      toast(`${name} removed from ${team.name}`)
    } else {
      toast('Failed to remove player', 'error')
    }
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-3 gap-3">
        {editingName ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(team.name) } }}
              className="flex-1 rounded border border-zinc-300 px-2 py-0.5 text-sm font-semibold outline-none focus:border-zinc-500 min-w-0"
            />
            <button onClick={saveName} disabled={savingName} className="text-xs font-medium text-zinc-700 hover:text-zinc-900 disabled:opacity-50">
              {savingName ? '…' : 'Save'}
            </button>
            <button onClick={() => { setEditingName(false); setNameValue(team.name) }} className="text-xs text-zinc-400 hover:text-zinc-600">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="text-sm font-semibold truncate min-w-0 hover:text-zinc-500 transition-colors text-left">
            {team.name}
          </button>
        )}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-zinc-400">{team.assignments.length} players</span>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Delete team?</span>
              <button
                onClick={deleteTeam}
                disabled={deleting}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {team.assignments.length === 0 && (
          <p className="px-4 py-3 text-sm text-zinc-400">No players assigned yet.</p>
        )}
        {team.assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <span className="text-sm font-medium">{a.clubMember.user.fullName}</span>
              {a.clubMember.user.playingRole && (
                <span className="ml-2 text-xs text-zinc-400 capitalize">
                  {a.clubMember.user.playingRole.replace('_', ' ')}
                </span>
              )}
            </div>
            <button
              onClick={() => remove(a.id, a.clubMember.user.fullName)}
              className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {seasonTournaments.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Tournaments</p>
          <div className="flex flex-wrap gap-2">
            {seasonTournaments.map((t) => {
              const isIn = t.teams.some((tt) => tt.teamId === team.id)
              const busy = togglingTournament === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTournament(t, isIn)}
                  disabled={busy}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                    isIn
                      ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                      : 'border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {busy ? '…' : isIn ? `✓ ${t.name}` : t.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="border-t border-zinc-100 px-4 py-3 space-y-2">
        {adding ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">— pick a member —</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user.fullName}
                  {m.user.playingRole ? ` (${m.user.playingRole.replace('_', ' ')})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={!selectedMemberId || busy}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setSelectedMemberId(''); setError('') }}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            disabled={available.length === 0}
            className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-40 transition-colors"
          >
            + Add player
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
