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
