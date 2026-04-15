'use client'

import { useState } from 'react'
import { AddSponsorModal } from '@/components/add-sponsor-modal'
import { AddContributionModal } from '@/components/add-contribution-modal'
import { AddExpenseModal } from '@/components/add-expense-modal'
import { formatDate } from '@/lib/format'
import type { Sponsor, Expense, TreasurySummary, Season } from '@/lib/api'

const CATEGORY_LABELS: Record<string, string> = {
  equipment: 'Equipment',
  venue: 'Venue',
  travel: 'Travel',
  uniforms: 'Uniforms',
  food: 'Food',
  registration_fees: 'Registration Fees',
  other: 'Other',
}

interface Props {
  initialSponsors: Sponsor[]
  initialExpenses: Expense[]
  initialSummary: TreasurySummary
  seasons: Season[]
  token: string
  clubId: string
  apiUrl: string
  myUserId: string
  seasonId?: string
}

export function TreasuryPanel({
  initialSponsors,
  initialExpenses,
  initialSummary,
  seasons,
  token,
  clubId,
  apiUrl,
  myUserId,
  seasonId,
}: Props) {
  const [sponsors, setSponsors] = useState(initialSponsors)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [summary, setSummary] = useState(initialSummary)

  async function refresh() {
    const qs = seasonId ? `?seasonId=${seasonId}` : ''
    const [s, e, sum] = await Promise.all([
      fetch(`${apiUrl}/clubs/${clubId}/sponsors`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${apiUrl}/clubs/${clubId}/expenses${qs}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${apiUrl}/clubs/${clubId}/treasury/summary${qs}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
    setSponsors(s)
    setExpenses(e)
    setSummary(sum)
  }

  async function deleteSponsor(sponsorId: string) {
    if (!confirm('Delete this sponsor and all their contributions?')) return
    await fetch(`${apiUrl}/clubs/${clubId}/sponsors/${sponsorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  async function deleteContribution(sponsorId: string, contributionId: string) {
    await fetch(`${apiUrl}/clubs/${clubId}/sponsors/${sponsorId}/contributions/${contributionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  async function deleteExpense(expenseId: string) {
    if (!confirm('Delete this expense?')) return
    await fetch(`${apiUrl}/clubs/${clubId}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  const netColor = summary.net >= 0 ? 'text-green-700' : 'text-red-600'

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Member Fees</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">${summary.totalMemberFees.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Sponsor Income</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">${summary.totalSponsorIncome.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">${summary.totalExpenses.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Net</p>
          <p className={`mt-1 text-2xl font-semibold ${netColor}`}>${summary.net.toFixed(0)}</p>
        </div>
      </div>

      {/* Sponsors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Sponsors</h2>
          <AddSponsorModal token={token} apiUrl={apiUrl} clubId={clubId} onAdded={refresh} />
        </div>

        {sponsors.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">No sponsors yet. Add your first sponsor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsors.map((sponsor) => {
              const total = sponsor.contributions.reduce((sum, c) => sum + Number(c.amount), 0)
              return (
                <div key={sponsor.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{sponsor.name}</span>
                        {sponsor.contactName && (
                          <span className="text-xs text-zinc-400">· {sponsor.contactName}</span>
                        )}
                        {sponsor.contactEmail && (
                          <a href={`mailto:${sponsor.contactEmail}`} className="text-xs text-zinc-400 hover:text-zinc-600">
                            {sponsor.contactEmail}
                          </a>
                        )}
                      </div>
                      {sponsor.notes && <p className="text-xs text-zinc-400 mt-0.5">{sponsor.notes}</p>}

                      {/* Contributions */}
                      <div className="mt-3 space-y-1">
                        {sponsor.contributions.length === 0 ? (
                          <p className="text-xs text-zinc-400">No contributions recorded.</p>
                        ) : (
                          sponsor.contributions.map((c) => (
                            <div key={c.id} className="flex items-center gap-3 text-sm">
                              <span className="font-medium text-green-700">${Number(c.amount).toFixed(0)}</span>
                              {c.description && <span className="text-zinc-500">{c.description}</span>}
                              <span className="text-zinc-400">{formatDate(c.receivedAt)}</span>
                              <button
                                onClick={() => deleteContribution(sponsor.id, c.id)}
                                className="text-xs text-zinc-300 hover:text-red-500 transition-colors ml-auto"
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                        <div className="pt-1">
                          <AddContributionModal
                            sponsorId={sponsor.id}
                            sponsorName={sponsor.name}
                            seasons={seasons}
                            token={token}
                            apiUrl={apiUrl}
                            clubId={clubId}
                            recordedById={myUserId}
                            onAdded={refresh}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold text-green-700">${total.toFixed(0)}</p>
                      <p className="text-xs text-zinc-400">{sponsor._count.contributions} contribution{sponsor._count.contributions !== 1 ? 's' : ''}</p>
                      <button
                        onClick={() => deleteSponsor(sponsor.id)}
                        className="mt-2 text-xs text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Expenses</h2>
          <AddExpenseModal
            seasons={seasons}
            token={token}
            apiUrl={apiUrl}
            clubId={clubId}
            recordedById={myUserId}
            onAdded={refresh}
          />
        </div>

        {expenses.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(exp.paidAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {CATEGORY_LABELS[exp.category] ?? exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {exp.description}
                      {exp.notes && <span className="block text-xs text-zinc-400">{exp.notes}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">${Number(exp.amount).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="text-xs text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
