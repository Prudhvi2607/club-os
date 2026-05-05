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

const mockSeason = { id: SEASON_ID, clubId: CLUB }
const mockMember = { id: MEMBER_ID, clubId: CLUB }
const mockFeeType = { id: 'ft-1', clubId: CLUB, seasonId: SEASON_ID, name: 'Reg Fee', amount: 100, studentAmount: 50, isRegistrationFee: false }
const mockMemberFee = { id: FEE_ID, clubMemberId: MEMBER_ID, feeTypeId: 'ft-1', amountDue: 100, amountPaid: 0, status: 'pending', feeType: mockFeeType }

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
      body: JSON.stringify({ feeTypeId: 'ft-1' }),
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
      body: JSON.stringify({ feeTypeId: 'ft-1' }),
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
    m.payment.create.mockResolvedValue({ id: 'pay-1' })
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
    m.payment.create.mockResolvedValue({ id: 'pay-1' })
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
    m.payment.create.mockResolvedValue({ id: 'pay-1' })
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

describe('PATCH /clubs/:clubId/payment-requests/:requestId', () => {
  const REQ_ID = 'req-1'
  const mockRequest = {
    id: REQ_ID, status: 'pending', amount: 100, method: 'zelle', notes: null,
    memberFeeId: FEE_ID, clubMember: { clubId: CLUB },
    memberFee: { amountPaid: 0, amountDue: 100 },
  }

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
