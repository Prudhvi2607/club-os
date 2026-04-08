import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  // Placeholder — JWT parsing is handled per-route via parseJwtPayload
  app.decorate('authenticate', async (_req: FastifyRequest, _reply: FastifyReply) => {})
})
