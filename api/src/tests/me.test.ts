import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`

const mockUser = {
  id: 'user-1', supabaseId: 'supa-1', email: 'test@example.com', fullName: 'Test User',
  phone: null, avatarUrl: null, playingRole: null, emergencyContactName: null,
  emergencyContactPhone: null, emergencyContactRelationship: null, studentId: null,
  studentEmail: null, studentProgram: null, jerseyNumber: null, tshirtSize: null,
  cricclubsUrl: null, createdAt: new Date(),
  clubMemberships: [{ id: 'm-1', userId: 'user-1', clubId: 'club-1', status: 'active', isMultiClub: false, joinedAt: new Date(), roles: [], club: { id: 'club-1', name: 'Test Club' } }],
}

describe('GET /me', () => {
  it('returns 401 with no token', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/me' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: 'Bearer bad.token.here' } })
    expect(res.statusCode).toBe(401)
  })

  it('returns user when found by supabaseId', async () => {
    m.user.findFirst.mockResolvedValueOnce(mockUser)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${makeToken({ sub: 'supa-1', email: 'test@example.com' })}` } })
    expect(res.statusCode).toBe(200)
    expect(res.json().email).toBe('test@example.com')
  })

  it('returns 404 when user not found and no email match', async () => {
    m.user.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${makeToken({ sub: 'unknown-id', email: 'nobody@example.com' })}` } })
    expect(res.statusCode).toBe(404)
  })

  it('links supabaseId on first login via case-insensitive email match', async () => {
    m.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...mockUser, supabaseId: null, email: 'Test@Example.com' })
    m.user.update.mockResolvedValueOnce(mockUser)
    const app = await buildApp()
    const logs: any[] = []
    app.log.info = (obj: any) => logs.push(obj)
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${makeToken({ sub: 'new-supa-id', email: 'test@example.com' })}` } })
    expect(res.statusCode).toBe(200)
    expect(m.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ supabaseId: 'new-supa-id' }) })
    )
    expect(logs.some(l => l.event === 'first_login' && l.email === 'test@example.com')).toBe(true)
  })

  it('logs login_unregistered warn when no match found', async () => {
    m.user.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const warns: any[] = []
    app.log.warn = (obj: any) => warns.push(obj)
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${makeToken({ sub: 'ghost-id', email: 'nobody@example.com' })}` } })
    expect(res.statusCode).toBe(404)
    expect(warns.some(w => w.event === 'login_unregistered' && w.email === 'nobody@example.com')).toBe(true)
  })
})

describe('PATCH /me', () => {
  it('returns 401 with no token', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'PATCH', url: '/me', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: 'Updated' }) })
    expect(res.statusCode).toBe(401)
  })

  it('returns 404 when user not found', async () => {
    m.user.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: '/me',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Updated' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('updates profile fields and returns 200', async () => {
    m.user.findFirst.mockResolvedValue(mockUser)
    m.user.update.mockResolvedValue({ ...mockUser, fullName: 'Updated Name', phone: '555-1234' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: '/me',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Updated Name', phone: '555-1234' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().fullName).toBe('Updated Name')
  })

  it('returns 409 when requested jersey number is taken by another member', async () => {
    m.user.findFirst
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({ id: 'user-2' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: '/me',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ jerseyNumber: 7 }),
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toMatch(/Jersey #7/)
  })

  it('allows updating own jersey number without conflict', async () => {
    const userWithJersey = { ...mockUser, jerseyNumber: 7 }
    m.user.findFirst
      .mockResolvedValueOnce(userWithJersey)
      .mockResolvedValueOnce(null)
    m.user.update.mockResolvedValue(userWithJersey)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: '/me',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ jerseyNumber: 7 }),
    })
    expect(res.statusCode).toBe(200)
  })

  it('skips jersey conflict check when setting jerseyNumber to null', async () => {
    m.user.findFirst.mockResolvedValue(mockUser)
    m.user.update.mockResolvedValue({ ...mockUser, jerseyNumber: null })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: '/me',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ jerseyNumber: null }),
    })
    expect(res.statusCode).toBe(200)
    expect(m.user.findFirst).toHaveBeenCalledTimes(1)
  })
})
