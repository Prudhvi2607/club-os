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
const ROLE_ID = 'role-1'

describe('GET /clubs/:clubId/custom-roles', () => {
  it('returns list of custom roles for the club', async () => {
    m.clubCustomRole.findMany.mockResolvedValue([
      { id: ROLE_ID, clubId: CLUB, name: 'Scorer' },
      { id: 'role-2', clubId: CLUB, name: 'Umpire' },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/custom-roles`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(2)
  })

  it('returns empty array when no custom roles exist', async () => {
    m.clubCustomRole.findMany.mockResolvedValue([])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: `/clubs/${CLUB}/custom-roles`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(0)
  })
})

describe('POST /clubs/:clubId/custom-roles', () => {
  it('creates role and returns 201', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.clubCustomRole.findFirst.mockResolvedValue(null)
    m.clubCustomRole.create.mockResolvedValue({ id: ROLE_ID, clubId: CLUB, name: 'Scorer' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Scorer' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 409 when role name already exists', async () => {
    m.club.findUnique.mockResolvedValue({ id: CLUB })
    m.clubCustomRole.findFirst.mockResolvedValue({ id: ROLE_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Scorer' }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('returns 404 when club not found', async () => {
    m.club.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Scorer' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /clubs/:clubId/custom-roles/:roleId', () => {
  it('returns 404 when not found', async () => {
    m.clubCustomRole.findFirst.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/custom-roles/${ROLE_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(404)
  })

  it('returns 204 on success', async () => {
    m.clubCustomRole.findFirst.mockResolvedValue({ id: ROLE_ID })
    m.clubCustomRole.delete.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/custom-roles/${ROLE_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })
})

describe('POST /clubs/:clubId/members/:memberId/custom-roles', () => {
  it('returns 409 when already assigned', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.clubCustomRole.findFirst.mockResolvedValue({ id: ROLE_ID })
    m.clubMemberCustomRole.findFirst.mockResolvedValue({ id: 'existing' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ customRoleId: ROLE_ID }),
    })
    expect(res.statusCode).toBe(409)
  })

  it('returns 404 when member not found', async () => {
    m.clubMember.findFirst.mockResolvedValue(null)
    m.clubCustomRole.findFirst.mockResolvedValue({ id: ROLE_ID })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ customRoleId: ROLE_ID }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 404 when custom role not found in this club', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.clubCustomRole.findFirst.mockResolvedValue(null) // scoped to clubId — role from other club returns null
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ customRoleId: 'role-from-other-club' }),
    })
    expect(res.statusCode).toBe(404)
  })

  it('assigns custom role and returns 201', async () => {
    m.clubMember.findFirst.mockResolvedValue({ id: MEMBER_ID })
    m.clubCustomRole.findFirst.mockResolvedValue({ id: ROLE_ID })
    m.clubMemberCustomRole.findFirst.mockResolvedValue(null)
    m.clubMemberCustomRole.create.mockResolvedValue({ id: 'cr-1' })
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST', url: `/clubs/${CLUB}/members/${MEMBER_ID}/custom-roles`,
      headers: { authorization: token(), 'content-type': 'application/json' },
      body: JSON.stringify({ customRoleId: ROLE_ID }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('DELETE /clubs/:clubId/members/:memberId/custom-roles/:customRoleId', () => {
  it('removes custom role assignment and returns 204', async () => {
    m.clubMemberCustomRole.deleteMany.mockResolvedValue({ count: 1 })
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/members/${MEMBER_ID}/custom-roles/${ROLE_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
    expect(m.clubMemberCustomRole.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clubMemberId: MEMBER_ID, customRoleId: ROLE_ID }) })
    )
  })

  it('returns 204 even when assignment did not exist (idempotent)', async () => {
    m.clubMemberCustomRole.deleteMany.mockResolvedValue({ count: 0 })
    const app = await buildApp()
    const res = await app.inject({ method: 'DELETE', url: `/clubs/${CLUB}/members/${MEMBER_ID}/custom-roles/${ROLE_ID}`, headers: { authorization: token() } })
    expect(res.statusCode).toBe(204)
  })
})
