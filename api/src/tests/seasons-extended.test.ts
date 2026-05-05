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
const REG_ID = 'reg-1'
const MEMBER_ID = 'member-1'

const mockSeason = { id: SEASON_ID, clubId: CLUB, name: '2025', year: 2025 }

describe('DELETE /clubs/:clubId/seasons/:seasonId', () => {
  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('deletes season in FK dependency order and returns 204', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.feeType.findMany.mockResolvedValue([{ id: 'ft-1' }, { id: 'ft-2' }])
    m.payment.deleteMany.mockResolvedValue({ count: 3 })
    m.memberFee.deleteMany.mockResolvedValue({ count: 5 })
    m.feeType.deleteMany.mockResolvedValue({ count: 2 })
    m.seasonRegistration.deleteMany.mockResolvedValue({ count: 4 })
    m.teamAssignment.deleteMany.mockResolvedValue({ count: 6 })
    m.tournament.findMany.mockResolvedValue([{ id: 't-1' }])
    m.tournamentTeam.deleteMany.mockResolvedValue({ count: 2 })
    m.tournament.deleteMany.mockResolvedValue({ count: 1 })
    m.announcement.deleteMany.mockResolvedValue({ count: 1 })
    m.season.delete.mockResolvedValue(mockSeason)

    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)

    // Verify deletion order: payments → memberFees → feeTypes → registrations → assignments → tournamentTeams → tournaments → announcement → season
    const calls = [
      m.payment.deleteMany,
      m.memberFee.deleteMany,
      m.feeType.deleteMany,
      m.seasonRegistration.deleteMany,
      m.teamAssignment.deleteMany,
      m.tournamentTeam.deleteMany,
      m.tournament.deleteMany,
      m.announcement.deleteMany,
      m.season.delete,
    ]
    for (const fn of calls) {
      expect(fn).toHaveBeenCalled()
    }
  })

  it('deletes payments scoped to feeType IDs', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.feeType.findMany.mockResolvedValue([{ id: 'ft-1' }])
    m.payment.deleteMany.mockResolvedValue({ count: 0 })
    m.memberFee.deleteMany.mockResolvedValue({ count: 0 })
    m.feeType.deleteMany.mockResolvedValue({ count: 0 })
    m.seasonRegistration.deleteMany.mockResolvedValue({ count: 0 })
    m.teamAssignment.deleteMany.mockResolvedValue({ count: 0 })
    m.tournament.findMany.mockResolvedValue([])
    m.tournamentTeam.deleteMany.mockResolvedValue({ count: 0 })
    m.tournament.deleteMany.mockResolvedValue({ count: 0 })
    m.announcement.deleteMany.mockResolvedValue({ count: 0 })
    m.season.delete.mockResolvedValue(mockSeason)

    const app = await buildApp()
    await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}`, headers: { authorization: token() } })

    expect(m.payment.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ memberFee: { feeTypeId: { in: ['ft-1'] } } }) })
    )
  })
})

describe('GET /clubs/:clubId/seasons/:seasonId/registrations', () => {
  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns registrations list', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.seasonRegistration.findMany.mockResolvedValue([
      { id: REG_ID, clubMemberId: MEMBER_ID, status: 'active', clubMember: { user: { fullName: 'Test' }, roles: [] } },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('POST /clubs/:clubId/seasons/:seasonId/registrations', () => {
  it('returns 409 on duplicate registration', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.seasonRegistration.findFirst.mockResolvedValue({ id: REG_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: MEMBER_ID, memberType: 'regular' }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('auto-assigns student role when registering as student', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    m.seasonRegistration.create.mockResolvedValue({ id: REG_ID, status: 'active', clubMember: { user: {} } })
    m.clubMemberRole.findFirst.mockResolvedValue(null)
    m.clubMemberRole.create.mockResolvedValue({ role: 'student' })
    m.feeType.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: MEMBER_ID, memberType: 'student' }),
    })
    expect(res.statusCode).toBe(201)
    expect(m.clubMemberRole.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'student' }) })
    )
  })

  it('does not add duplicate student role if already has one', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    m.seasonRegistration.create.mockResolvedValue({ id: REG_ID, status: 'active', clubMember: { user: {} } })
    m.clubMemberRole.findFirst.mockResolvedValue({ role: 'student' })  // already has role
    m.feeType.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: MEMBER_ID, memberType: 'student' }),
    })
    expect(m.clubMemberRole.create).not.toHaveBeenCalled()
  })

  it('auto-assigns registration fee at student rate when applicable', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    m.seasonRegistration.create.mockResolvedValue({ id: REG_ID, status: 'active', clubMember: { user: {} } })
    m.clubMemberRole.findFirst.mockResolvedValue(null)
    m.clubMemberRole.create.mockResolvedValue({})
    m.feeType.findFirst.mockResolvedValue({ id: 'ft-1', amount: 100, studentAmount: 50, isRegistrationFee: true })
    m.memberFee.create.mockResolvedValue({ id: 'mf-1' })
    const app = await buildApp()
    await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: MEMBER_ID, memberType: 'student' }),
    })
    expect(m.memberFee.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountDue: 50 }) })
    )
  })
})

describe('PATCH /clubs/:clubId/seasons/:seasonId/registrations/:registrationId/status', () => {
  it('returns 404 when registration not found', async () => {
    m.seasonRegistration.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations/${REG_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('updates registration status', async () => {
    m.seasonRegistration.findFirst.mockResolvedValue({ id: REG_ID })
    m.seasonRegistration.update.mockResolvedValue({ id: REG_ID, status: 'inactive', clubMember: { user: {} } })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/registrations/${REG_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    })
    expect(res.statusCode).toBe(200)
  })
})
