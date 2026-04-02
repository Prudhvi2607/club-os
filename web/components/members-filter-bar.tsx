'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const STATUSES = ['active', 'inactive', 'alumni']
const ROLES = ['board', 'captain', 'vice_captain', 'member', 'student']
const PLAYING_ROLES = ['batter', 'bowler', 'allrounder', 'wicket_keeper']
const SORTS = [
  { value: 'name_asc', label: 'A–Z' },
  { value: 'name_desc', label: 'Z–A' },
  { value: 'joined_desc', label: 'Newest' },
  { value: 'joined_asc', label: 'Oldest' },
]

export function MembersFilterRow({ total, filtered }: { total: number; filtered: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`)
  }

  const status = params.get('status') ?? ''
  const role = params.get('role') ?? ''
  const playingRole = params.get('playingRole') ?? ''
  const sort = params.get('sort') ?? 'name_asc'
  const hasFilters = !!(status || role || playingRole)

  return (
    <tr className="border-b border-zinc-100 bg-zinc-50">
      <th className="px-4 py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Name</span>
          <select value={sort} onChange={(e) => update('sort', e.target.value)} className={selectCls}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </th>
      <th className="px-4 py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Roles</span>
          <select value={role} onChange={(e) => update('role', e.target.value)} className={selectCls}>
            <option value="">All</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
      </th>
      <th className="px-4 py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Playing Role</span>
          <select value={playingRole} onChange={(e) => update('playingRole', e.target.value)} className={selectCls}>
            <option value="">All</option>
            {PLAYING_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
      </th>
      <th className="px-4 py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
          <select value={status} onChange={(e) => update('status', e.target.value)} className={selectCls}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </th>
      <th className="px-4 py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Joined</span>
          <select
            value={['joined_desc', 'joined_asc'].includes(sort) ? sort : ''}
            onChange={(e) => update('sort', e.target.value)}
            className={selectCls}
          >
            <option value="">—</option>
            <option value="joined_desc">Newest</option>
            <option value="joined_asc">Oldest</option>
          </select>
        </div>
      </th>
      <th className="px-4 py-2.5 text-right">
        {hasFilters && (
          <button onClick={() => router.replace(pathname)} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
            {filtered !== total ? `${filtered}/${total} · ` : ''}Clear
          </button>
        )}
      </th>
    </tr>
  )
}

const selectCls = 'rounded border-0 bg-transparent text-xs text-zinc-400 font-normal outline-none cursor-pointer hover:text-zinc-600'
