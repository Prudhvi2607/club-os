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

const mockSeason = {
  id: SEASON_ID, clubId: CLUB, name: '2025 Spring', year: 2025,
  startDate: new Date('2025-03-01'), endDate: new Date('2025-09-30'),
  status: 'open', createdBy: 'user-1', createdAt: new Date(),
}

describe('GET /clubs/:clubId/seasons', () => {
  it('returns seasons list', async () => {
    m.season.findMany.mockResolvedValue([mockSeason])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('GET /clubs/:clubId/seasons/:seasonId', () => {
  it('returns 404 when not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns season when found', async () => {
    m.season.findFirst.mockResolvedValue({ ...mockSeason, registrations: [], _count: { registrations: 0 } })
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(SEASON_ID)
  })
})

describe('POST /clubs/:clubId/seasons', () => {
  it('creates season and returns 201', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.season.create.mockResolvedValue(mockSeason)
    m.announcement.create.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: '2025 Spring', year: 2025, startDate: '2025-03-01', endDate: '2025-09-30', createdBy: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('creates registration fee type if provided', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.season.create.mockResolvedValue(mockSeason)
    m.feeType.create.mockResolvedValue({})
    m.announcement.create.mockResolvedValue({})
    const app = await buildApp()
    await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: '2025 Spring', year: 2025, startDate: '2025-03-01', endDate: '2025-09-30', createdBy: 'user-1', registrationFee: 150 }),
    })
    expect(m.feeType.create).toHaveBeenCalled()
  })

  it('returns 404 when club not found', async () => {
    m.club.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'S', year: 2025, startDate: '2025-01-01', endDate: '2025-12-31', createdBy: 'u-1' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /clubs/:clubId/seasons/:seasonId/status', () => {
  it('updates status', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.season.update.mockResolvedValue({ ...mockSeason, status: 'closed' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /clubs/:clubId/seasons/:seasonId/registrations', () => {
  it('returns 409 on duplicate registration', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: 'member-1' })
    m.seasonRegistration.findFirst.mockResolvedValue({ id: 'reg-1' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: 'member-1', memberType: 'regular' }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('auto-assigns registration fee if fee type exists', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: 'member-1' })
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    m.seasonRegistration.create.mockResolvedValue({ id: 'reg-1', clubMember: { user: {} } })
    m.clubMemberRole.findFirst.mockResolvedValue(null)
    m.feeType.findFirst.mockResolvedValue({ id: 'ft-1', amount: 100, studentAmount: 50, isRegistrationFee: true })
    m.memberFee.create.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: 'member-1', memberType: 'regular' }),
    })
    expect(res.statusCode).toBe(201)
    expect(m.memberFee.create).toHaveBeenCalled()
  })

  it('uses student fee amount when registering as student', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: 'member-1' })
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    m.seasonRegistration.create.mockResolvedValue({ id: 'reg-1', clubMember: { user: {} } })
    m.clubMemberRole.findFirst.mockResolvedValue(null)
    m.clubMemberRole.create.mockResolvedValue({})
    m.feeType.findFirst.mockResolvedValue({ id: 'ft-1', amount: 100, studentAmount: 50, isRegistrationFee: true })
    m.memberFee.create.mockResolvedValue({})
    const app = await buildApp()
    await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: 'member-1', memberType: 'student' }),
    })
    expect(m.memberFee.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountDue: 50 }) })
    )
  })
})
