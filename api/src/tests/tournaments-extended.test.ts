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
const TOURNAMENT_ID = 'tournament-1'
const TEAM_ID = 'team-1'

describe('GET /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId', () => {
  it('returns 404 when tournament not found', async () => {
    m.tournament.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns tournament with team rosters', async () => {
    m.tournament.findFirst.mockResolvedValue({
      id: TOURNAMENT_ID, name: 'Summer Cup',
      teams: [{ team: { id: TEAM_ID, name: 'A Team', assignments: [{ clubMember: { user: {} } }] } }],
    })
    const app = await buildApp()
    const res = await app.inject({
      method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().teams).toHaveLength(1)
    expect(res.json().teams[0].team.assignments).toHaveLength(1)
  })
})

describe('DELETE /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId', () => {
  it('returns 404 when tournament not found', async () => {
    m.tournament.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(404)
  })

  it('deletes tournament teams then tournament and returns 204', async () => {
    m.tournament.findFirst.mockResolvedValue({ id: TOURNAMENT_ID })
    m.tournamentTeam.deleteMany.mockResolvedValue({ count: 2 })
    m.tournament.delete.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({
      method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(204)
    expect(m.tournamentTeam.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tournamentId: TOURNAMENT_ID } }))
    expect(m.tournament.delete).toHaveBeenCalled()
  })
})

describe('POST /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams', () => {
  const url = `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}/teams`

  it('returns 404 when tournament not found', async () => {
    m.tournament.findFirst.mockResolvedValue(null)
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ teamId: TEAM_ID }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 409 when team already in tournament', async () => {
    m.tournament.findFirst.mockResolvedValue({ id: TOURNAMENT_ID })
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID })
    m.tournamentTeam.findUnique.mockResolvedValue({ tournamentId: TOURNAMENT_ID, teamId: TEAM_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ teamId: TEAM_ID }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('adds team to tournament and returns 201', async () => {
    m.tournament.findFirst.mockResolvedValue({ id: TOURNAMENT_ID })
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID })
    m.tournamentTeam.findUnique.mockResolvedValue(null)
    m.tournamentTeam.create.mockResolvedValue({ tournamentId: TOURNAMENT_ID, teamId: TEAM_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ teamId: TEAM_ID }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('DELETE /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams/:teamId', () => {
  it('returns 404 when tournament not found', async () => {
    m.tournament.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}/teams/${TEAM_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(404)
  })

  it('removes team from tournament and returns 204', async () => {
    m.tournament.findFirst.mockResolvedValue({ id: TOURNAMENT_ID })
    m.tournamentTeam.deleteMany.mockResolvedValue({ count: 1 })
    const app = await buildApp()
    const res = await app.inject({
      method: 'DELETE', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/tournaments/${TOURNAMENT_ID}/teams/${TEAM_ID}`,
      headers: { authorization: token() },
    })
    expect(res.statusCode).toBe(204)
    expect(m.tournamentTeam.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tournamentId: TOURNAMENT_ID, teamId: TEAM_ID } })
    )
  })
})
