import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`
const CLUB = 'club-1'
const SEASON_ID = 'season-1'
const MEMBER_ID = 'member-1'
const FEE_ID = 'fee-1'
const FEE_TYPE_ID = 'ft-1'
const PAYMENT_ID = 'pay-1'
const REQUEST_ID = 'req-1'

describe('DELETE /clubs/:clubId/members/:memberId/fees/:feeId/payments/:paymentId (undo payment)', () => {
  const url = `/clubs/${CLUB}/members/${MEMBER_ID}/fees/${FEE_ID}/payments/${PAYMENT_ID}`

  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns 404 when payment not found', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.payment.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('recalculates status to pending when all payments removed', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.payment.findFirst.mockResolvedValue({ id: PAYMENT_ID, memberFeeId: FEE_ID })

    // $transaction calls: delete payment, aggregate remaining (0), findUnique fee, update fee
    m.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        payment: {
          delete: vi.fn().mockResolvedValue({}),
          aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),  // no remaining
        },
        memberFee: {
          findUnique: vi.fn().mockResolvedValue({ id: FEE_ID, amountDue: 100 }),
          update: vi.fn().mockResolvedValue({ status: 'pending' }),
        },
      }
      await fn(tx)
      expect(tx.memberFee.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'pending', amountPaid: 0 }) })
      )
    })

    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })

  it('recalculates status to partial when some payment remains', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.payment.findFirst.mockResolvedValue({ id: PAYMENT_ID, memberFeeId: FEE_ID })

    m.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        payment: {
          delete: vi.fn().mockResolvedValue({}),
          aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 40 } }),  // partial remaining
        },
        memberFee: {
          findUnique: vi.fn().mockResolvedValue({ id: FEE_ID, amountDue: 100 }),
          update: vi.fn().mockResolvedValue({ status: 'partial' }),
        },
      }
      await fn(tx)
      expect(tx.memberFee.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'partial', amountPaid: 40 }) })
      )
    })

    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })
})

describe('POST /clubs/:clubId/seasons/:seasonId/fee-types/:feeTypeId/assign-all', () => {
  const url = `/clubs/${CLUB}/seasons/${SEASON_ID}/fee-types/${FEE_TYPE_ID}/assign-all`

  it('returns 404 when fee type not found', async () => {
    m.feeType.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'POST', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('skips members who already have the fee', async () => {
    m.feeType.findFirst.mockResolvedValue({ id: FEE_TYPE_ID, amount: 100, studentAmount: null })
    m.clubMember.findMany.mockResolvedValue([
      { id: 'mem-1', roles: [] },
      { id: 'mem-2', roles: [] },
    ])
    // mem-1 already has the fee
    m.memberFee.findMany.mockResolvedValue([{ clubMemberId: 'mem-1' }])
    m.memberFee.createMany.mockResolvedValue({ count: 1 })

    const app = await buildApp()
    const res = await app.inject({ method: 'POST', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().assigned).toBe(1)
    expect(m.memberFee.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ clubMemberId: 'mem-2' }),
        ]),
      })
    )
    // mem-1 should NOT be in createMany
    const createManyCall = m.memberFee.createMany.mock.calls[0][0]
    const assignedIds = createManyCall.data.map((d: any) => d.clubMemberId)
    expect(assignedIds).not.toContain('mem-1')
  })

  it('applies student rate for members with student role', async () => {
    m.feeType.findFirst.mockResolvedValue({ id: FEE_TYPE_ID, amount: 100, studentAmount: 50 })
    m.clubMember.findMany.mockResolvedValue([
      { id: 'mem-student', roles: [{ role: 'student' }] },
      { id: 'mem-regular', roles: [{ role: 'member' }] },
    ])
    m.memberFee.findMany.mockResolvedValue([])
    m.memberFee.createMany.mockResolvedValue({ count: 2 })

    const app = await buildApp()
    await app.inject({ method: 'POST', url, headers: { authorization: token() } })

    const createManyCall = m.memberFee.createMany.mock.calls[0][0]
    const studentEntry = createManyCall.data.find((d: any) => d.clubMemberId === 'mem-student')
    const regularEntry = createManyCall.data.find((d: any) => d.clubMemberId === 'mem-regular')
    expect(studentEntry.amountDue).toBe(50)
    expect(regularEntry.amountDue).toBe(100)
  })

  it('returns assigned=0 and skips createMany when everyone already has the fee', async () => {
    m.feeType.findFirst.mockResolvedValue({ id: FEE_TYPE_ID, amount: 100, studentAmount: null })
    m.clubMember.findMany.mockResolvedValue([{ id: 'mem-1', roles: [] }])
    m.memberFee.findMany.mockResolvedValue([{ clubMemberId: 'mem-1' }])

    const app = await buildApp()
    const res = await app.inject({ method: 'POST', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().assigned).toBe(0)
    expect(m.memberFee.createMany).not.toHaveBeenCalled()
  })
})

describe('GET /clubs/:clubId/seasons/:seasonId/payments/summary', () => {
  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/payments/summary`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('calculates totals and status counts correctly', async () => {
    m.season.findFirst.mockResolvedValue({ id: SEASON_ID })
    m.memberFee.findMany.mockResolvedValue([
      { status: 'paid', amountDue: 100, amountPaid: 100, feeType: {}, clubMember: { user: {} }, payments: [] },
      { status: 'partial', amountDue: 100, amountPaid: 50, feeType: {}, clubMember: { user: {} }, payments: [] },
      { status: 'pending', amountDue: 100, amountPaid: 0, feeType: {}, clubMember: { user: {} }, payments: [] },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/payments/summary`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalDue).toBe(300)
    expect(body.totalPaid).toBe(150)
    expect(body.totalOutstanding).toBe(150)
    expect(body.byStatus.paid).toBe(1)
    expect(body.byStatus.partial).toBe(1)
    expect(body.byStatus.pending).toBe(1)
  })
})

describe('POST /clubs/:clubId/members/:memberId/fees/:feeId/payment-requests', () => {
  const url = `/clubs/${CLUB}/members/${MEMBER_ID}/fees/${FEE_ID}/payment-requests`

  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 50, method: 'bank_transfer' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 404 when fee not found', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.memberFee.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 50, method: 'bank_transfer' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('creates payment request and returns 201', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.memberFee.findFirst.mockResolvedValue({ id: FEE_ID })
    m.paymentRequest.create.mockResolvedValue({
      id: REQUEST_ID, amount: 50, method: 'bank_transfer',
      memberFee: { feeType: {} }, clubMember: { user: {} },
    })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 50, method: 'bank_transfer' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('GET /clubs/:clubId/payment-requests', () => {
  it('returns pending requests by default', async () => {
    m.paymentRequest.findMany.mockResolvedValue([
      { id: REQUEST_ID, status: 'pending', amount: 50, memberFee: { feeType: {} }, clubMember: { user: {} } },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/payment-requests`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(m.paymentRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'pending' }) })
    )
  })

  it('filters by status query param', async () => {
    m.paymentRequest.findMany.mockResolvedValue([])
    const app = await buildApp()
    await app.inject({ method: 'GET', url: `/clubs/${CLUB}/payment-requests?status=confirmed`, headers: { authorization: token() } })
    expect(m.paymentRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'confirmed' }) })
    )
  })
})

describe('PATCH /clubs/:clubId/payment-requests/:requestId', () => {
  const url = `/clubs/${CLUB}/payment-requests/${REQUEST_ID}`

  it('returns 404 when request not found', async () => {
    m.paymentRequest.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 409 when request already resolved', async () => {
    m.paymentRequest.findFirst.mockResolvedValue({ id: REQUEST_ID, status: 'confirmed', memberFee: {} })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('rejects a payment request', async () => {
    m.paymentRequest.findFirst.mockResolvedValue({ id: REQUEST_ID, status: 'pending', memberFee: {} })
    m.paymentRequest.update.mockResolvedValue({ status: 'rejected' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'reject', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('rejected')
  })

  it('confirms a payment request via transaction', async () => {
    m.paymentRequest.findFirst.mockResolvedValue({
      id: REQUEST_ID, status: 'pending',
      memberFeeId: FEE_ID, amount: 100, method: 'cash', notes: null,
      memberFee: { id: FEE_ID, amountPaid: 0, amountDue: 100 },
    })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('confirmed')
  })
})
