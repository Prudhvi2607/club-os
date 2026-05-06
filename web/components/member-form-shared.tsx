import type { ReactNode } from 'react'

export const ROLES = ['member', 'student', 'board', 'captain', 'vice_captain'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  member: 'Member',
  student: 'Student',
  board: 'Board',
  captain: 'Captain',
  vice_captain: 'Vice Captain',
}

export const PLAYING_ROLE_LABELS: Record<string, string> = {
  batter: 'Batter',
  bowler: 'Bowler',
  allrounder: 'Allrounder',
  wicket_keeper: 'Wicket Keeper',
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-500">
        {label}{hint && <span className="font-normal"> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}

export const inputCls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400'
