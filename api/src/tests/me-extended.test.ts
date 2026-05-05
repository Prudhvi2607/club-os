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
  jerseyNumber: null, clubMemberships: [{ clubId: 'club-1' }],
}

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
      .mockResolvedValueOnce({ id: 'user-2' })  // conflict user
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
      .mockResolvedValueOnce(null)  // no conflict (excludes self)
    m.user.update.mockResolvedValue({ ...userWithJersey })
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
    // conflict check not triggered for null
    expect(m.user.findFirst).toHaveBeenCalledTimes(1)
  })
})
