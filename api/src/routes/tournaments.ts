import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'

export default async function tournamentsRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/seasons/:seasonId/tournaments
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/tournaments',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      return prisma.tournament.findMany({
        where: { seasonId, clubId },
        include: { teams: { include: { team: true } } },
        orderBy: { startDate: 'asc' },
      })
    }
  )

  // GET /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId
  app.get<{ Params: { clubId: string; seasonId: string; tournamentId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId',
    async (req, reply) => {
      const { clubId, seasonId, tournamentId } = req.params
      const tournament = await prisma.tournament.findFirst({
        where: { id: tournamentId, seasonId, clubId },
        include: {
          teams: {
            include: {
              team: {
                include: {
                  assignments: {
                    where: { seasonId, removedAt: null },
                    include: { clubMember: { include: { user: true } } },
                    orderBy: { assignedAt: 'asc' },
                  },
                },
              },
            },
          },
        },
      })
      if (!tournament) return reply.code(404).send({ error: 'Tournament not found' })
      return tournament
    }
  )

  // POST /clubs/:clubId/seasons/:seasonId/tournaments
  app.post<{
    Params: { clubId: string; seasonId: string }
    Body: { name: string; startDate: string; endDate: string; createdById: string }
  }>('/clubs/:clubId/seasons/:seasonId/tournaments', async (req, reply) => {
    const { clubId, seasonId } = req.params
    const { name, startDate, endDate, createdById } = req.body

    const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
    if (!season) return reply.code(404).send({ error: 'Season not found' })

    const tournament = await prisma.tournament.create({
      data: {
        clubId,
        seasonId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById,
      },
      include: { teams: { include: { team: true } } },
    })
    return reply.code(201).send(tournament)
  })

  // DELETE /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId
  app.delete<{ Params: { clubId: string; seasonId: string; tournamentId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId',
    async (req, reply) => {
      const { clubId, seasonId, tournamentId } = req.params

      const tournament = await prisma.tournament.findFirst({
        where: { id: tournamentId, seasonId, clubId },
      })
      if (!tournament) return reply.code(404).send({ error: 'Tournament not found' })

      await prisma.tournamentTeam.deleteMany({ where: { tournamentId } })
      await prisma.tournament.delete({ where: { id: tournamentId } })
      return reply.code(204).send()
    }
  )

  // POST /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams
  app.post<{
    Params: { clubId: string; seasonId: string; tournamentId: string }
    Body: { teamId: string }
  }>(
    '/clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams',
    async (req, reply) => {
      const { clubId, seasonId, tournamentId } = req.params
      const { teamId } = req.body

      const [tournament, team] = await Promise.all([
        prisma.tournament.findFirst({ where: { id: tournamentId, seasonId, clubId } }),
        prisma.team.findFirst({ where: { id: teamId, clubId } }),
      ])
      if (!tournament) return reply.code(404).send({ error: 'Tournament not found' })
      if (!team) return reply.code(404).send({ error: 'Team not found' })

      const existing = await prisma.tournamentTeam.findUnique({
        where: { tournamentId_teamId: { tournamentId, teamId } },
      })
      if (existing) return reply.code(409).send({ error: 'Team already in this tournament' })

      await prisma.tournamentTeam.create({ data: { tournamentId, teamId } })
      return reply.code(201).send({ tournamentId, teamId })
    }
  )

  // DELETE /clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams/:teamId
  app.delete<{ Params: { clubId: string; seasonId: string; tournamentId: string; teamId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/tournaments/:tournamentId/teams/:teamId',
    async (req, reply) => {
      const { clubId, seasonId, tournamentId, teamId } = req.params

      const tournament = await prisma.tournament.findFirst({ where: { id: tournamentId, seasonId, clubId } })
      if (!tournament) return reply.code(404).send({ error: 'Tournament not found' })

      await prisma.tournamentTeam.deleteMany({ where: { tournamentId, teamId } })
      return reply.code(204).send()
    }
  )
}
