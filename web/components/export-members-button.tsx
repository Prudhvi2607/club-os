'use client'

import type { Member } from '@/lib/api'

export function ExportMembersButton({ members }: { members: Member[] }) {
  function exportCsv() {
    const headers = ['Name', 'Email', 'Phone', 'Playing Role', 'Roles', 'Status', 'Joined']
    const rows = members.map((m) => [
      m.user.fullName,
      m.user.email ?? '',
      m.user.phone ?? '',
      m.user.playingRole?.replace('_', ' ') ?? '',
      m.roles.map((r: any) => r.role.replace('_', ' ')).join(', '),
      m.status,
      new Date(m.joinedAt).toLocaleDateString(),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportCsv}
      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
    >
      Export CSV
    </button>
  )
}
