import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

const mockUser = {
  id: 'user-1',
  supabaseId: 'supa-1',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: null,
  avatarUrl: null,
  playingRole: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  emergencyContactRelationship: null,
  studentId: null,
  studentEmail: null,
  studentProgram: null,
  jerseyNumber: null,
  tshirtSize: null,
  cricclubsUrl: null,
  createdAt: new Date(),
  clubMemberships: [{ id: 'm-1', userId: 'user-1', clubId: 'club-1', status: 'active', isMultiClub: false, joinedAt: new Date(), roles: [], club: { id: 'club-1', name: 'Test Club' } }],
}

vi.mock('../lib/prisma.js', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const { default: prisma } = await import('../lib/prisma.js')

beforeEach(() => vi.clearAllMocks())

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
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(mockUser as any)
    const app = await buildApp()
    const token = makeToken({ sub: 'supa-1', email: 'test@example.com' })
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    expect(res.json().email).toBe('test@example.com')
  })

  it('returns 404 when user not found and no email match', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
    const app = await buildApp()
    const token = makeToken({ sub: 'unknown-id', email: 'nobody@example.com' })
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(404)
  })

  it('links supabaseId on first login via case-insensitive email match', async () => {
    // First findFirst (by supabaseId) returns null — not linked yet
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce(null)
      // Second findFirst (case-insensitive email) returns the pre-created record
      .mockResolvedValueOnce({ ...mockUser, supabaseId: null, email: 'Test@Example.com' } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any)

    const app = await buildApp()
    const token = makeToken({ sub: 'new-supa-id', email: 'test@example.com' })
    const res = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${token}` } })

    expect(res.statusCode).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ supabaseId: 'new-supa-id' }) })
    )
  })
})
