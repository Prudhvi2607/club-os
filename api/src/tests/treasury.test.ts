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
})
