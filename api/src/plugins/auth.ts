import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string        // Supabase user ID
      email?: string
      role?: string
      aud?: string
    }
    user: {
      id: string
      email?: string
      role?: string
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  const secret = process.env['SUPABASE_JWT_SECRET']
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')

  await app.register(fastifyJwt, { secret, verify: { allowedAud: 'authenticated' } })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
      // Remap sub → id for convenience
      const payload = req.user as unknown as { sub: string; email?: string; role?: string }
      ;(req as any).user = { id: payload.sub, email: payload.email, role: payload.role }
    } catch {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
})
