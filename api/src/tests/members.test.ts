import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`
const CLUB = 'club-1'
const MEMBER_ID = 'member-1'

const mockMember = {
  id: MEMBER_ID, userId: 'user-1', clubId: CLUB, status: 'active',
  isMultiClub: false, joinedAt: new Date(),
  user: { id: 'user-1', fullName: 'Test User', email: 'test@example.com' },
  roles: [], customRoles: [],
}

describe('GET /clubs/:clubId/members', () => {
  it('returns member list', async () => {
    m.clubMember.findMany.mockResolvedValue([mockMember])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('GET /clubs/:clubId/members/:memberId', () => {
  it('returns 404 when not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns member when found', async () => {
    m.clubMember.findFirst.mockResolvedValue({ ...mockMember, seasonRegistrations: [], memberFees: [] })
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(MEMBER_ID)
  })
})

describe('GET /clubs/:clubId/members/jersey-numbers', () => {
  it('returns only members who have jersey numbers', async () => {
    m.clubMember.findMany.mockResolvedValue([
      { user: { id: 'u-1', jerseyNumber: 5 } },
      { user: { id: 'u-2', jerseyNumber: null } },
      { user: { id: 'u-3', jerseyNumber: 10 } },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/jersey-numbers`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveLength(2)
    expect(body.map((b: any) => b.jerseyNumber)).toEqual([5, 10])
  })

  it('returns empty array when no jersey numbers assigned', async () => {
    m.clubMember.findMany.mockResolvedValue([{ user: { id: 'u-1', jerseyNumber: null } }])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/jersey-numbers`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(0)
  })
})

describe('POST /clubs/:clubId/members', () => {
  it('creates member and returns 201', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.$transaction.mockResolvedValue({ ...mockMember })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test User', email: 'test@example.com', roles: ['member'] }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 404 when club not found', async () => {
    m.club.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test', email: 'x@x.com' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 409 on duplicate email', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    const { Prisma } = await import('@prisma/client')
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '0' })
    m.$transaction.mockRejectedValue(err)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test', email: 'dup@example.com' }),
    })
    expect(res.statusCode).toBe(409)
  })
})

describe('PATCH /clubs/:clubId/members/:memberId', () => {
  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/members/${MEMBER_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Updated' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('updates user profile fields and returns 200', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID, userId: 'user-1' })
    m.user.update.mockResolvedValue({ id: 'user-1', fullName: 'Updated Name', phone: '555-0000' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/members/${MEMBER_ID}`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Updated Name', phone: '555-0000' }),
    })
    expect(res.statusCode).toBe(200)
    expect(m.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fullName: 'Updated Name' }) })
    )
  })
})

describe('PATCH /clubs/:clubId/members/:memberId/status', () => {
  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/members/${MEMBER_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('cancels pending fees when member goes inactive', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.clubMember.update.mockResolvedValue({ ...mockMember, status: 'inactive' })
    m.memberFee.deleteMany.mockResolvedValue({ count: 2 })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/members/${MEMBER_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    })
    expect(res.statusCode).toBe(200)
    expect(m.memberFee.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clubMemberId: MEMBER_ID, status: 'pending' }) })
    )
  })

  it('does not cancel fees when status is active', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.clubMember.update.mockResolvedValue({ ...mockMember, status: 'active' })
    const app = await buildApp()
    await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/members/${MEMBER_ID}/status`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    expect(m.memberFee.deleteMany).not.toHaveBeenCalled()
  })
})

describe('POST /clubs/:clubId/members/:memberId/roles', () => {
  it('returns 400 if assigning captain to a vice captain', async () => {
    m.clubMember.findFirst.mockResolvedValue({ ...mockMember, roles: [{ role: 'vice_captain' }] })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'captain' }),
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 if assigning vice captain to a captain', async () => {
    m.clubMember.findFirst.mockResolvedValue({ ...mockMember, roles: [{ role: 'captain' }] })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'vice_captain' }),
    })
    expect(res.statusCode).toBe(400)
  })

  it('creates role and returns 201', async () => {
    m.clubMember.findFirst.mockResolvedValue({ ...mockMember, roles: [] })
    m.clubMemberRole.create.mockResolvedValue({ id: 'r-1', role: 'board' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'board' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('DELETE /clubs/:clubId/members/:memberId/roles/:role', () => {
  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/members/${MEMBER_ID}/roles/captain`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('deletes role and returns 204', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.clubMemberRole.deleteMany.mockResolvedValue({ count: 1 })
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/members/${MEMBER_ID}/roles/captain`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
    expect(m.clubMemberRole.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clubMemberId: MEMBER_ID, role: 'captain' }) })
    )
  })
})

describe('DELETE /clubs/:clubId/members/:memberId', () => {
  it('returns 204 on success', async () => {
    m.clubMember.findFirst.mockResolvedValue(mockMember)
    m.clubMember.delete.mockResolvedValue(mockMember)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/members/${MEMBER_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })

  it('returns 404 when not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/members/${MEMBER_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /clubs/:clubId/members/:memberId/teams', () => {
  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}/teams`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns team assignments with tournaments', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.teamAssignment.findMany.mockResolvedValue([
      {
        teamId: 'team-1', seasonId: 'season-1', assignedAt: new Date(),
        team: { name: 'A Team' },
        season: { name: '2025 Season', status: 'active' },
      },
    ])
    m.tournament.findMany.mockResolvedValue([{ id: 't-1', name: 'Cup', availability: [] }])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}/teams`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveLength(1)
    expect(body[0].teamName).toBe('A Team')
    expect(body[0].tournaments).toHaveLength(1)
  })

  it('returns empty array when member has no assignments', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.teamAssignment.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/members/${MEMBER_ID}/teams`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(0)
  })
})
