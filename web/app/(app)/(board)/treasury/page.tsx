export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { TreasuryPanel } from '@/components/treasury-panel'
import { SeasonPicker } from '@/components/season-picker'

export const metadata: Metadata = { title: 'Treasury | club-os' }

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface Props {
  searchParams: Promise<{ seasonId?: string }>
}

export default async function TreasuryPage({ searchParams }: Props) {
  const { seasonId: seasonIdParam } = await searchParams

  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [seasons, me] = await Promise.all([
    api.seasons.list(token).catch(() => []),
    api.me(token).catch(() => null),
  ])

  const defaultSeason = seasons.find((s) => s.status === 'active') ?? seasons[0]
  const seasonId = seasonIdParam ?? defaultSeason?.id

  const [sponsors, expenses, summary] = await Promise.all([
    api.treasury.sponsors(token).catch(() => []),
    api.treasury.expenses(token, seasonId).catch(() => []),
    api.treasury.summary(token, seasonId).catch(() => ({ totalSponsorIncome: 0, totalMemberFees: 0, totalIncome: 0, totalExpenses: 0, net: 0 })),
  ])

  const myUserId = me?.id ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Treasury</h1>
        {seasons.length > 0 && (
          <Suspense>
            <SeasonPicker seasons={seasons} selected={seasonId ?? ''} />
          </Suspense>
        )}
      </div>

      <TreasuryPanel
        initialSponsors={sponsors}
        initialExpenses={expenses}
        initialSummary={summary}
        seasons={seasons}
        token={token}
        clubId={CLUB_ID}
        apiUrl={API_URL}
        myUserId={myUserId}
        seasonId={seasonId}
      />
    </div>
  )
}
