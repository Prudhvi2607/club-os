import crypto from 'node:crypto'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

function verifyJwt(token: string, secret: string): { sub: string; email?: string } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  if (expected !== signature) return null
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (decoded.exp && decoded.exp < Date.now() / 1000) return null
    return decoded
  } catch {
    return null
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  const secret = process.env['SUPABASE_JWT_SECRET']
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return reply.code(401).send({ error: 'Unauthorized' })
    const token = auth.slice(7)
    const payload = verifyJwt(token, secret)
    if (!payload) return reply.code(401).send({ error: 'Unauthorized' })
    ;(req as any).user = { id: payload.sub, email: payload.email }
  })
})
