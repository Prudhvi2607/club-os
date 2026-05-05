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
const T_ID = 'tournament-1'
const TEAM_ID = 'team-1'

const mockSeason = { id: SEASON_ID, clubId: CLUB }
const mockTournament = { id: T_ID, seasonId: SEASON_ID, clubId: CLUB, name: 'Spring Cup', startDate: new Date(), endDate: new Date(), teams: [] }

describe('GET /clubs/:clubId/seasons/:seasonId/tournaments', () => {
  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns tournament list', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.tournament.findMany.mockResolvedValue([mockTournament])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('POST /clubs/:clubId/seasons/:seasonId/tournaments', () => {
  it('creates tournament and returns 201', async () => {
    m.season.findFirst.mockResolvedValue(mockSeason)
    m.tournament.create.mockResolvedValue(mockTournament)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Spring Cup', startDate: '2025-04-01', endDate: '2025-04-07', createdById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Cup', startDate: '2025-04-01', endDate: '2025-04-07', createdById: 'user-1' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId', () => {
  it('deletes tournament and cascades team assignments', async () => {
    m.tournament.findFirst.mockResolvedValue(mockTournament)
    m.tournamentTeam.deleteMany.mockResolvedValue({ count: 1 })
    m.tournament.delete.mockResolvedValue(mockTournament)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${T_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
    expect(m.tournamentTeam.deleteMany).toHaveBeenCalled()
  })

  it('returns 404 when not found', async () => {
    m.tournament.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${T_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams', () => {
  it('adds team to tournament', async () => {
    m.tournament.findFirst.mockResolvedValue(mockTournament)
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID, clubId: CLUB })
    m.tournamentTeam.findUnique.mockResolvedValue(null)
    m.tournamentTeam.create.mockResolvedValue({ tournamentId: T_ID, teamId: TEAM_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${T_ID}/teams`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ teamId: TEAM_ID }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 409 when team already in tournament', async () => {
    m.tournament.findFirst.mockResolvedValue(mockTournament)
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID, clubId: CLUB })
    m.tournamentTeam.findUnique.mockResolvedValue({ tournamentId: T_ID, teamId: TEAM_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${T_ID}/teams`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ teamId: TEAM_ID }),
    })
    expect(res.statusCode).toBe(409)
  })
})
