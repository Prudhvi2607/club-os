import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'
import { makeToken } from './helpers.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

beforeEach(() => vi.clearAllMocks())

const CLUB = 'club-1'
const DOC_ID = 'doc-1'
const boardToken = () => `Bearer ${makeToken({ sub: 'board-supa' })}`
const memberToken = () => `Bearer ${makeToken({ sub: 'member-supa' })}`

const mockDoc = {
  id: DOC_ID, clubId: CLUB, title: 'Handbook', fileUrl: 'https://example.com/doc.pdf',
  category: 'general', visibility: 'club', uploadedAt: new Date(),
  uploadedBy: { fullName: 'Admin' },
}

describe('GET /clubs/:clubId/documents', () => {
  it('board user query does not filter by visibility', async () => {
    m.user.findFirst.mockResolvedValue({ clubMemberships: [{ roles: [{ role: 'board' }] }] })
    m.clubDocument.findMany.mockResolvedValue([mockDoc])
    const app = await buildApp()
    await app.inject({ method: 'GET', url: `/clubs/${CLUB}/documents`, headers: { authorization: boardToken() } })
    const callArg = m.clubDocument.findMany.mock.calls[0][0]
    expect(callArg.where.visibility).toBeUndefined()
  })

  it('non-board user query filters to club visibility only', async () => {
    m.user.findFirst.mockResolvedValue({ clubMemberships: [{ roles: [{ role: 'member' }] }] })
    m.clubDocument.findMany.mockResolvedValue([mockDoc])
    const app = await buildApp()
    await app.inject({ method: 'GET', url: `/clubs/${CLUB}/documents`, headers: { authorization: memberToken() } })
    const callArg = m.clubDocument.findMany.mock.calls[0][0]
    expect(callArg.where.visibility).toBe('club')
  })
})

describe('POST /clubs/:clubId/documents', () => {
  it('creates document and returns 201', async () => {
    m.clubDocument.create.mockResolvedValue(mockDoc)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/documents`,
      headers: { authorization: boardToken(), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Handbook', fileUrl: 'https://example.com/doc.pdf', category: 'general', uploadedById: 'user-1' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('PATCH /clubs/:clubId/documents/:docId', () => {
  it('returns 404 when doc not found', async () => {
    m.clubDocument.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/documents/${DOC_ID}`,
      headers: { authorization: boardToken(), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('renames document', async () => {
    m.clubDocument.findFirst.mockResolvedValue(mockDoc)
    m.clubDocument.update.mockResolvedValue({ ...mockDoc, title: 'New Title' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'PATCH', url: `/clubs/${CLUB}/documents/${DOC_ID}`,
      headers: { authorization: boardToken(), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('DELETE /clubs/:clubId/documents/:docId', () => {
  it('returns 204 on success', async () => {
    m.clubDocument.findFirst.mockResolvedValue(mockDoc)
    m.clubDocument.delete.mockResolvedValue(mockDoc)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/documents/${DOC_ID}`, headers: { authorization: boardToken() } })
    expect(res.statusCode).toBe(204)
  })
})
