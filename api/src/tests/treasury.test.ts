import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`
const CLUB = 'club-1'
const SPONSOR_ID = 'sponsor-1'
const EXPENSE_ID = 'expense-1'
const CONTRIBUTION_ID = 'contrib-1'
const SEASON_ID = 'season-1'

describe('POST /clubs/:clubId/sponsors', () => {
  it('creates sponsor and returns 201', async () => {
    m.sponsor.create.mockResolvedValue({ id: SPONSOR_ID, name: 'Acme Corp' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/sponsors`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Acme Corp' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('GET /clubs/:clubId/sponsors', () => {
  it('returns sponsors with contributions included', async () => {
    m.sponsor.findMany.mockResolvedValue([
      {
        id: SPONSOR_ID,
        name: 'Acme Corp',
        contributions: [{ id: CONTRIBUTION_ID, amount: 500, receivedAt: new Date() }],
        _count: { contributions: 1 },
      },
    ])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/sponsors`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Acme Corp')
    expect(body[0].contributions).toHaveLength(1)
    expect(m.sponsor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clubId: CLUB },
        include: expect.objectContaining({ contributions: expect.any(Object) }),
      })
    )
  })

  it('returns empty array when club has no sponsors', async () => {
    m.sponsor.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/sponsors`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })
})

describe('DELETE /clubs/:clubId/sponsors/:sponsorId', () => {
  it('returns 404 when not found', async () => {
    m.sponsor.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/sponsors/${SPONSOR_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns 204 on success', async () => {
    m.sponsor.findFirst.mockResolvedValue({ id: SPONSOR_ID })
    m.sponsor.delete.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/sponsors/${SPONSOR_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })
})

describe('POST /clubs/:clubId/sponsors/:sponsorId/contributions', () => {
  it('returns 404 when sponsor not found', async () => {
    m.sponsor.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/sponsors/${SPONSOR_ID}/contributions`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 500, recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('creates contribution and returns 201', async () => {
    m.sponsor.findFirst.mockResolvedValue({ id: SPONSOR_ID })
    m.sponsorContribution.create.mockResolvedValue({ id: 'c-1', amount: 500 })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/sponsors/${SPONSOR_ID}/contributions`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 500, recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('DELETE /clubs/:clubId/sponsors/:sponsorId/contributions/:contributionId', () => {
  const url = `/clubs/${CLUB}/sponsors/${SPONSOR_ID}/contributions/${CONTRIBUTION_ID}`

  it('returns 404 when contribution not found', async () => {
    m.sponsorContribution.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toMatch(/not found/i)
  })

  it('deletes contribution and returns 204', async () => {
    m.sponsorContribution.findFirst.mockResolvedValue({ id: CONTRIBUTION_ID, clubId: CLUB })
    m.sponsorContribution.delete.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
    expect(m.sponsorContribution.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: CONTRIBUTION_ID } })
    )
  })
})

describe('POST /clubs/:clubId/expenses', () => {
  it('creates expense and returns 201', async () => {
    m.expense.create.mockResolvedValue({ id: EXPENSE_ID, amount: 200 })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/expenses`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ category: 'equipment', description: 'Bats', amount: 200, recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('GET /clubs/:clubId/expenses', () => {
  it('returns all expenses without filter', async () => {
    m.expense.findMany.mockResolvedValue([
      { id: 'exp-1', category: 'equipment', amount: 200, description: 'Bats' },
      { id: 'exp-2', category: 'venue', amount: 500, description: 'Ground rental' },
    ])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/expenses`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(2)
    expect(m.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clubId: CLUB } })
    )
  })

  it('filters expenses by seasonId when provided', async () => {
    m.expense.findMany.mockResolvedValue([{ id: 'exp-1', seasonId: SEASON_ID, amount: 200 }])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/expenses?seasonId=${SEASON_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    expect(m.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clubId: CLUB, seasonId: SEASON_ID } })
    )
  })

  it('returns empty array when no expenses match filter', async () => {
    m.expense.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/expenses?seasonId=nonexistent-season`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })
})

describe('DELETE /clubs/:clubId/expenses/:expenseId', () => {
  it('returns 404 when not found', async () => {
    m.expense.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/expenses/${EXPENSE_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /clubs/:clubId/treasury/summary', () => {
  it('calculates correct totals', async () => {
    m.sponsorContribution.findMany.mockResolvedValue([{ amount: 500 }, { amount: 200 }])
    m.expense.findMany.mockResolvedValue([{ amount: 100 }])
    m.payment.findMany.mockResolvedValue([{ amount: 150 }, { amount: 50 }])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/treasury/summary`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalSponsorIncome).toBe(700)
    expect(body.totalMemberFees).toBe(200)
    expect(body.totalExpenses).toBe(100)
    expect(body.totalIncome).toBe(900)
    expect(body.net).toBe(800)
  })

  it('scopes all aggregations to the given season', async () => {
    m.sponsorContribution.findMany.mockResolvedValue([{ amount: 300 }])
    m.expense.findMany.mockResolvedValue([{ amount: 80 }])
    m.payment.findMany.mockResolvedValue([{ amount: 120 }])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/treasury/summary?seasonId=${SEASON_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalSponsorIncome).toBe(300)
    expect(body.totalMemberFees).toBe(120)
    expect(body.totalExpenses).toBe(80)
    expect(body.totalIncome).toBe(420)
    expect(body.net).toBe(340)
    expect(m.sponsorContribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ seasonId: SEASON_ID }) })
    )
    expect(m.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ seasonId: SEASON_ID }) })
    )
  })

  it('returns zeros when season has no financial activity', async () => {
    m.sponsorContribution.findMany.mockResolvedValue([])
    m.expense.findMany.mockResolvedValue([])
    m.payment.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/treasury/summary?seasonId=${SEASON_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalSponsorIncome).toBe(0)
    expect(body.totalMemberFees).toBe(0)
    expect(body.totalExpenses).toBe(0)
    expect(body.net).toBe(0)
  })
})
