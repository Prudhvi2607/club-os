import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'

export default async function availabilityRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/seasons/:seasonId/availability
  // Board view — all members' availability per tournament for a season
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/availability',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      const [registrations, tournaments, availability] = await Promise.all([
        prisma.seasonRegistration.findMany({
          where: { seasonId },
          include: { clubMember: { include: { user: true } } },
          orderBy: { registeredAt: 'asc' },
        }),
        prisma.tournament.findMany({
          where: { seasonId },
          orderBy: { startDate: 'asc' },
        }),
        prisma.memberAvailability.findMany({
          where: { seasonId },
        }),
      ])

      return { registrations, tournaments, availability }
    }
  )

  // GET /clubs/:clubId/members/:memberId/availability?seasonId=
  app.get<{ Params: { clubId: string; memberId: string }; Querystring: { seasonId: string } }>(
    '/clubs/:clubId/members/:memberId/availability',
    async (req, reply) => {
      const { clubId, memberId } = req.params
      const { seasonId } = req.query
      if (!seasonId) return reply.code(400).send({ error: 'seasonId required' })

      const member = await prisma.clubMember.findFirst({ where: { id: memberId, clubId } })
      if (!member) return reply.code(404).send({ error: 'Member not found' })

      const [tournaments, availability] = await Promise.all([
        prisma.tournament.findMany({
          where: { seasonId },
          orderBy: { startDate: 'asc' },
        }),
        prisma.memberAvailability.findMany({
          where: { clubMemberId: memberId, seasonId },
        }),
      ])

      return { tournaments, availability }
    }
  )

  // PUT /clubs/:clubId/members/:memberId/availability
  // Upsert availability for a tournament
  app.put<{
    Params: { clubId: string; memberId: string }
    Body: { seasonId: string; tournamentId: string; status: string; notes?: string }
  }>('/clubs/:clubId/members/:memberId/availability', async (req, reply) => {
    const { clubId, memberId } = req.params
    const { seasonId, tournamentId, status, notes } = req.body

    const member = await prisma.clubMember.findFirst({ where: { id: memberId, clubId } })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const record = await prisma.memberAvailability.upsert({
      where: { clubMemberId_tournamentId: { clubMemberId: memberId, tournamentId } },
      create: { clubMemberId: memberId, seasonId, tournamentId, status: status as any, notes },
      update: { status: status as any, notes },
    })

    return record
  })
}
