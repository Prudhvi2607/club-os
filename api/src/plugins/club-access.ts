import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import prisma from '../lib/prisma.js'

declare module 'fastify' {
  interface FastifyInstance {
    requireClubMember: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async function clubAccessPlugin(app: FastifyInstance) {
  app.decorate('requireClubMember', async (req: FastifyRequest, reply: FastifyReply) => {
    const { clubId } = req.params as { clubId?: string }
    if (!clubId) return // route doesn't have a clubId param — skip

    const userId = (req.user as { id: string }).id

    const membership = await prisma.clubMember.findFirst({
      where: {
        clubId,
        user: { supabaseId: userId },
      },
      select: { id: true },
    })

    if (!membership) {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  })
})
