'use client'

import type { Tournament, MemberAvailability } from '@/lib/api'

type Status = 'available' | 'partial' | 'unavailable'

const cellStyles: Record<Status, string> = {
  available: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unavailable: 'bg-red-100 text-red-700',
}

const cellLabels: Record<Status, string> = {
  available: 'Avail',
  partial: 'Partly',
  unavailable: 'N/A',
}

interface Member {
  memberId: string
  memberName: string
}

interface Props {
  tournaments: Tournament[]
  members: Member[]
  availability: MemberAvailability[]
}

export function AvailabilityBoardView({ tournaments, members, availability }: Props) {
  function getRecord(memberId: string, tournamentId: string) {
    return availability.find((a) => a.clubMemberId === memberId && a.tournamentId === tournamentId)
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide sticky left-0 bg-zinc-50 min-w-[140px]">
              Member
            </th>
            {tournaments.map((t) => (
              <th key={t.id} className="px-3 py-2.5 text-center text-xs font-medium text-zinc-500 min-w-[100px] border-l border-zinc-100">
                <div className="font-medium">{t.name}</div>
                <div className="font-normal text-zinc-400">
                  {new Date(t.startDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })}–{new Date(t.endDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {members.map((m) => (
            <tr key={m.memberId} className="hover:bg-zinc-50">
              <td className="px-4 py-2 font-medium text-zinc-700 sticky left-0 bg-white text-sm whitespace-nowrap">
                {m.memberName}
              </td>
              {tournaments.map((t) => {
                const record = getRecord(m.memberId, t.id)
                const status = record?.status as Status | undefined
                return (
                  <td key={t.id} className="px-2 py-2 text-center border-l border-zinc-100">
                    {status ? (
                      <div>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cellStyles[status]}`}>
                          {cellLabels[status]}
                        </span>
                        {record?.notes && (
                          <div className="text-xs text-zinc-400 mt-0.5 leading-tight">{record.notes}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
