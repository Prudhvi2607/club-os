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

describe('GET /clubs/:clubId/seasons/:seasonId/availability', () => {
  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/availability`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns availability data with correct shape', async () => {
    m.season.findFirst.mockResolvedValue({ id: SEASON_ID })
    m.seasonRegistration.findMany.mockResolvedValue([])
    m.tournament.findMany.mockResolvedValue([{ id: 't-1', name: 'Cup' }])
    m.memberAvailability.findMany.mockResolvedValue([{ id: 'av-1', status: 'available' }])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/availability`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ registrations: [], tournaments: [{ id: 't-1' }], availability: [{ id: 'av-1' }] })
  })
})

describe('GET /clubs/:clubId/members/:memberId/availability', () => {
  it('returns 400 when seasonId missing', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}/availability`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}/availability?seasonId=${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns tournaments and availability', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.tournament.findMany.mockResolvedValue([{ id: 't-1', name: 'Cup' }])
    m.memberAvailability.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}/availability?seasonId=${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().tournaments).toHaveLength(1)
  })
})

describe('PUT /clubs/:clubId/members/:memberId/availability', () => {
  it('upserts availability record', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.memberAvailability.upsert.mockResolvedValue({ id: 'av-1', status: 'available' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PUT', url: `/clubs/${CLUB}/members/${MEMBER_ID}/availability`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ seasonId: SEASON_ID, tournamentId: 't-1', status: 'available' }),
    })
    expect(res.statusCode).toBe(200)
    expect(m.memberAvailability.upsert).toHaveBeenCalled()
  })

  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PUT', url: `/clubs/${CLUB}/members/${MEMBER_ID}/availability`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ seasonId: SEASON_ID, tournamentId: 't-1', status: 'available' }),
    })
    expect(res.statusCode).toBe(404)
  })
})
