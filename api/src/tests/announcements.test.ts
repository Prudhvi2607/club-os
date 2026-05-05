import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
vi.mock('../lib/email.js', () => ({ sendAnnouncementEmail: vi.fn().mockResolvedValue(undefined) }))

import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const token = () => `Bearer ${makeToken({ sub: 'supa-1' })}`
const CLUB = 'club-1'
const ANN_ID = 'ann-1'

const mockAnnouncement = {
  id: ANN_ID, clubId: CLUB, subject: 'Test', body: 'Body', audience: 'club',
  sentAt: new Date(), teamId: null,
  sentBy: { id: 'user-1', fullName: 'Test User', avatarUrl: null },
  team: null,
}

describe('GET /clubs/:clubId/announcements', () => {
  it('returns announcement list', async () => {
    m.announcement.findMany.mockResolvedValue([mockAnnouncement])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/announcements`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('POST /clubs/:clubId/announcements', () => {
  it('creates announcement and returns 201', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.announcement.create.mockResolvedValue(mockAnnouncement)
    m.clubMember.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/announcements`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ subject: 'Test', body: 'Body', audience: 'club', sentById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 400 when team announcement has no teamId', async () => {
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/announcements`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ subject: 'Test', body: 'Body', audience: 'team', sentById: 'user-1' }),
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 when club not found', async () => {
    m.club.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/announcements`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ subject: 'Test', body: 'Body', audience: 'club', sentById: 'user-1' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 404 when teamId not found', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.team.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/announcements`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ subject: 'Test', body: 'Body', audience: 'team', teamId: 'bad-team', sentById: 'user-1' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /clubs/:clubId/announcements/:announcementId', () => {
  it('returns 204 on success', async () => {
    m.announcement.findFirst.mockResolvedValue(mockAnnouncement)
    m.announcement.delete.mockResolvedValue(mockAnnouncement)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/announcements/${ANN_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })

  it('returns 404 when not found', async () => {
    m.announcement.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/announcements/${ANN_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })
})
