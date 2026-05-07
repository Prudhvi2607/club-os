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

const mockSeason = { id: SEASON_ID, clubId: CLUB }
const mockMember = { id: MEMBER_ID, clubId: CLUB }
const mockFeeType = { id: FEE_TYPE_ID, clubId: CLUB, seasonId: SEASON_ID, name: 'Reg Fee', amount: 100, studentAmount: 50, isRegistrationFee: false }
const mockMemberFee = { id: FEE_ID, clubMemberId: MEMBER_ID, feeTypeId: FEE_TYPE_ID, amountDue: 100, amountPaid: 0, status: 'pending', feeType: mockFeeType }

describe('POST /clubs/:clubId/seasons/:seasonId/fee-types', () => {
  it('creates fee type and returns 201', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.feeType.create.mockResolvedValue(mockFeeType)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/fee-types`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Reg Fee', amount: 100, createdById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/fee-types`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Fee', amount: 50, createdById: 'u-1' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /clubs/:clubId/members/:memberId/fees', () => {
  it('returns 409 when fee already assigned', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.feeType.findFirst.mockResolvedValue(mockFeeType)
    m.memberFee.findFirst.mockResolvedValue({ id: 'existing-fee' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/fees`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ feeTypeId: FEE_TYPE_ID }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('creates fee with default amount', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.feeType.findFirst.mockResolvedValue(mockFeeType)
    m.memberFee.findFirst.mockResolvedValue(null)
    m.memberFee.create.mockResolvedValue(mockMemberFee)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/fees`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ feeTypeId: FEE_TYPE_ID }),
    })
    expect(res.statusCode).toBe(201)
    expect(m.memberFee.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountDue: 100 }) })
    )
  })
})

describe('POST /clubs/:clubId/members/:memberId/fees/:feeId/payments', () => {
  it('sets status to paid when fully paid', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.memberFee.findFirst.mockResolvedValue({ ...mockMemberFee, amountDue: 100, amountPaid: 0 })
    m.payment.create.mockResolvedValue({ id: PAYMENT_ID })
    m.memberFee.update.mockResolvedValue({})
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/fees/${FEE_ID}/payments`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 100, method: 'zelle', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
    expect(m.memberFee.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'paid', amountPaid: 100 }) })
    )
  })

  it('sets status to partial when partially paid', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.memberFee.findFirst.mockResolvedValue({ ...mockMemberFee, amountDue: 100, amountPaid: 0 })
    m.payment.create.mockResolvedValue({ id: PAYMENT_ID })
    m.memberFee.update.mockResolvedValue({})
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/fees/${FEE_ID}/payments`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 50, method: 'zelle', recordedById: 'user-1' }),
    })
    expect(m.memberFee.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'partial', amountPaid: 50 }) })
    )
  })

  it('auto-registers member when registration fee fully paid', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.memberFee.findFirst.mockResolvedValue({
      ...mockMemberFee, amountDue: 100, amountPaid: 0,
      feeType: { ...mockFeeType, isRegistrationFee: true, seasonId: SEASON_ID },
    })
    m.payment.create.mockResolvedValue({ id: PAYMENT_ID })
    m.memberFee.update.mockResolvedValue({})
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    m.seasonRegistration.create.mockResolvedValue({})
    const app = await buildApp()
    await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/fees/${FEE_ID}/payments`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 100, method: 'zelle', recordedById: 'user-1' }),
    })
    expect(m.seasonRegistration.create).toHaveBeenCalled()
  })
})

describe('DELETE /clubs/:clubId/members/:memberId/fees/:feeId/payments/:paymentId', () => {
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

    m.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        payment: {
          delete: vi.fn().mockResolvedValue({}),
          aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
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
          aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 40 } }),
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
    m.memberFee.findMany.mockResolvedValue([{ clubMemberId: 'mem-1' }])
    m.memberFee.createMany.mockResolvedValue({ count: 1 })

    const app = await buildApp()
    const res = await app.inject({ method: 'POST', url, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().assigned).toBe(1)
    const createManyCall = m.memberFee.createMany.mock.calls[0][0]
    const assignedIds = createManyCall.data.map((d: any) => d.clubMemberId)
    expect(assignedIds).not.toContain('mem-1')
    expect(assignedIds).toContain('mem-2')
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
  const REQ_ID = REQUEST_ID
  const mockRequest = {
    id: REQ_ID, status: 'pending', amount: 100, method: 'zelle', notes: null,
    memberFeeId: FEE_ID, clubMember: { clubId: CLUB },
    memberFee: { amountPaid: 0, amountDue: 100 },
  }

  it('returns 404 when request not found', async () => {
    m.paymentRequest.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/payment-requests/${REQ_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 409 when already resolved', async () => {
    m.paymentRequest.findFirst.mockResolvedValue({ ...mockRequest, status: 'confirmed' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/payment-requests/${REQ_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('rejects request', async () => {
    m.paymentRequest.findFirst.mockResolvedValue(mockRequest)
    m.paymentRequest.update.mockResolvedValue({ ...mockRequest, status: 'rejected' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/payment-requests/${REQ_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'reject', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('rejected')
  })

  it('confirms request and records payment', async () => {
    m.paymentRequest.findFirst.mockResolvedValue(mockRequest)
    m.paymentRequest.update.mockResolvedValue({})
    m.payment.create.mockResolvedValue({})
    m.memberFee.update.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/payment-requests/${REQ_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', recordedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('confirmed')
    expect(m.payment.create).toHaveBeenCalled()
  })
})
