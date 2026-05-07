import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`
const CLUB = 'club-1'
const TEAM_ID = 'team-1'
const MEMBER_ID = 'member-1'
const SEASON_ID = 'season-1'
const ASSIGNMENT_ID = 'assign-1'

const mockTeam = { id: TEAM_ID, clubId: CLUB, name: 'Team A', createdAt: new Date() }

describe('GET /clubs/:clubId/teams', () => {
  it('returns teams list with assignment counts', async () => {
    m.team.findMany.mockResolvedValue([
      { id: TEAM_ID, name: 'A Team', _count: { assignments: 5 } },
      { id: 'team-2', name: 'B Team', _count: { assignments: 3 } },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/teams`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(2)
  })
})

describe('POST /clubs/:clubId/teams', () => {
  it('creates team and returns 201', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.team.create.mockResolvedValue(mockTeam)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/teams`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Team A' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 404 when club not found', async () => {
    m.club.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/teams`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Team A' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /clubs/:clubId/teams/:teamId', () => {
  it('returns 404 when team not found', async () => {
    m.team.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/teams/${TEAM_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('renames team and returns 200', async () => {
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID, name: 'Old Name' })
    m.team.update.mockResolvedValue({ id: TEAM_ID, name: 'New Name' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/teams/${TEAM_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('New Name')
  })
})

describe('DELETE /clubs/:clubId/teams/:teamId', () => {
  it('returns 404 when team not found', async () => {
    m.team.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/teams/${TEAM_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('deletes team and removes assignments', async () => {
    m.team.findFirst.mockResolvedValue(mockTeam)
    m.teamAssignment.deleteMany.mockResolvedValue({ count: 2 })
    m.team.delete.mockResolvedValue(mockTeam)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/teams/${TEAM_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
    expect(m.teamAssignment.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { teamId: TEAM_ID } }))
    expect(m.team.delete).toHaveBeenCalled()
  })
})

describe('GET /clubs/:clubId/teams/:teamId/squad', () => {
  it('returns 400 when seasonId missing', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 when team not found', async () => {
    m.team.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad?seasonId=${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns squad for team and season', async () => {
    m.team.findFirst.mockResolvedValue({ id: TEAM_ID })
    m.teamAssignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, clubMember: { user: { fullName: 'Player 1' }, roles: [] } },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad?seasonId=${SEASON_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('POST /clubs/:clubId/teams/:teamId/squad', () => {
  it('assigns member to team', async () => {
    m.team.findFirst.mockResolvedValue(mockTeam)
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID, clubId: CLUB })
    m.season.findFirst.mockResolvedValue({ id: SEASON_ID, clubId: CLUB })
    m.teamAssignment.findFirst.mockResolvedValue(null)
    m.teamAssignment.create.mockResolvedValue({ id: 'a-1', clubMember: { user: {} } })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: MEMBER_ID, seasonId: SEASON_ID, assignedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 409 when member already on team this season', async () => {
    m.team.findFirst.mockResolvedValue(mockTeam)
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID, clubId: CLUB })
    m.season.findFirst.mockResolvedValue({ id: SEASON_ID, clubId: CLUB })
    m.teamAssignment.findFirst.mockResolvedValue({ id: 'existing' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ clubMemberId: MEMBER_ID, seasonId: SEASON_ID, assignedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(409)
  })
})

describe('DELETE /clubs/:clubId/teams/:teamId/squad/:assignmentId', () => {
  it('returns 404 when assignment not found', async () => {
    m.teamAssignment.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad/${ASSIGNMENT_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('soft-deletes by setting removedAt', async () => {
    m.teamAssignment.findFirst.mockResolvedValue({ id: ASSIGNMENT_ID, teamId: TEAM_ID })
    m.teamAssignment.update.mockResolvedValue({ id: ASSIGNMENT_ID, removedAt: new Date() })
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/teams/${TEAM_ID}/squad/${ASSIGNMENT_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
    expect(m.teamAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ removedAt: expect.any(Date) }) })
    )
  })
})

describe('GET /clubs/:clubId/seasons/:seasonId/squads', () => {
  it('returns 404 when season not found', async () => {
    m.season.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/squads`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns all teams with their rosters', async () => {
    m.season.findFirst.mockResolvedValue({ id: SEASON_ID })
    m.team.findMany.mockResolvedValue([
      { id: TEAM_ID, name: 'A Team', assignments: [{ clubMember: { user: {}, roles: [] } }] },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/seasons/${SEASON_ID}/squads`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(res.json()[0].assignments).toHaveLength(1)
  })
})
