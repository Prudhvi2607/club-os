import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`
const CLUB_ID = 'club-1'

describe('GET /clubs', () => {
  it('returns list of clubs', async () => {
    m.club.findMany.mockResolvedValue([{ id: CLUB_ID, name: 'Test Club', sport: 'cricket', slug: 'test' }])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/clubs', headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })

  it('returns empty array when no clubs', async () => {
    m.club.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/clubs', headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(0)
  })
})

describe('GET /clubs/:clubId', () => {
  it('returns club with counts when found', async () => {
    m.club.findUnique.mockResolvedValue({
      id: CLUB_ID, name: 'Test Club', sport: 'cricket', slug: 'test',
      _count: { members: 10, seasons: 2, teams: 3 },
    })
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(CLUB_ID)
    expect(res.json()._count.members).toBe(10)
  })

  it('returns 404 when club not found', async () => {
    m.club.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/nonexistent`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /clubs', () => {
  it('creates club and returns 201', async () => {
    m.club.findUnique.mockResolvedValue(null)
    m.club.create.mockResolvedValue({ id: CLUB_ID, name: 'New Club', sport: 'cricket', slug: 'new-club' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: '/clubs',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'New Club', sport: 'cricket', slug: 'new-club' }),
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().slug).toBe('new-club')
  })

  it('returns 409 when slug already taken', async () => {
    m.club.findUnique.mockResolvedValue({ id: 'other-club' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: '/clubs',
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate', sport: 'cricket', slug: 'taken-slug' }),
    })
    expect(res.statusCode).toBe(409)
  })
})
