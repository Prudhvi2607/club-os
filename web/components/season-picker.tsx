'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Season {
  id: string
  name: string
  year: number
  status: string
}

interface Props {
  seasons: Season[]
  selected: string
}

export function SeasonPicker({ seasons, selected }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(seasonId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('seasonId', seasonId)
    router.push(`?${params.toString()}`)
  }

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} {s.status === 'active' ? '(active)' : ''}
        </option>
      ))}
    </select>
  )
}
