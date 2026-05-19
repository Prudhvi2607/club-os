import { describe, it, expect, vi } from 'vitest'
import { buildApp } from '../app.js'

vi.mock('../lib/prisma.js')
import prisma from '../lib/prisma.js'
const m = prisma as any

describe('GET /health', () => {
  it('returns ok and pings the database', async () => {
    m.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
    expect(m.$queryRaw).toHaveBeenCalled()
  })
})
