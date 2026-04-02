import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'

export default async function squadsRoutes(app: FastifyInstance) {
  // ── Teams ──────────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/teams
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId/teams',
    async (req) => {
      const { clubId } = req.params
      return prisma.team.findMany({
        where: { clubId },
        include: { _count: { select: { assignments: true } } },
        orderBy: { createdAt: 'asc' },
      })
    }
  )

  // POST /clubs/:clubId/teams
  app.post<{
    Params: { clubId: string }
    Body: { name: string }
  }>('/clubs/:clubId/teams', async (req, reply) => {
    const { clubId } = req.params
    const { name } = req.body

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return reply.code(404).send({ error: 'Club not found' })

    const team = await prisma.team.create({ data: { clubId, name } })
    return reply.code(201).send(team)
  })

  // PATCH /clubs/:clubId/teams/:teamId
  app.patch<{
    Params: { clubId: string; teamId: string }
    Body: { name: string }
  }>('/clubs/:clubId/teams/:teamId', async (req, reply) => {
    const { clubId, teamId } = req.params
    const { name } = req.body

    const team = await prisma.team.findFirst({ where: { id: teamId, clubId } })
    if (!team) return reply.code(404).send({ error: 'Team not found' })

    return prisma.team.update({ where: { id: teamId }, data: { name } })
  })

  // DELETE /clubs/:clubId/teams/:teamId
  app.delete<{
    Params: { clubId: string; teamId: string }
  }>('/clubs/:clubId/teams/:teamId', async (req, reply) => {
    const { clubId, teamId } = req.params

    const team = await prisma.team.findFirst({ where: { id: teamId, clubId } })
    if (!team) return reply.code(404).send({ error: 'Team not found' })

    await prisma.teamAssignment.deleteMany({ where: { teamId } })
    await prisma.team.delete({ where: { id: teamId } })

    return reply.code(204).send()
  })

  // ── Assignments ────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/teams/:teamId/squad?seasonId=
  // Current active roster for a team in a season
  app.get<{
    Params: { clubId: string; teamId: string }
    Querystring: { seasonId: string }
  }>('/clubs/:clubId/teams/:teamId/squad', async (req, reply) => {
    const { clubId, teamId } = req.params
    const { seasonId } = req.query

    if (!seasonId) return reply.code(400).send({ error: 'seasonId is required' })

    const team = await prisma.team.findFirst({ where: { id: teamId, clubId } })
    if (!team) return reply.code(404).send({ error: 'Team not found' })

    return prisma.teamAssignment.findMany({
      where: { teamId, seasonId, removedAt: null },
      include: {
        clubMember: { include: { user: true, roles: true } },
      },
      orderBy: { assignedAt: 'asc' },
    })
  })

  // POST /clubs/:clubId/teams/:teamId/squad
  // Assign a member to a team for a season
  app.post<{
    Params: { clubId: string; teamId: string }
    Body: { clubMemberId: string; seasonId: string; assignedById: string; notes?: string }
  }>('/clubs/:clubId/teams/:teamId/squad', async (req, reply) => {
    const { clubId, teamId } = req.params
    const { clubMemberId, seasonId, assignedById, notes } = req.body

    const [team, member, season] = await Promise.all([
      prisma.team.findFirst({ where: { id: teamId, clubId } }),
      prisma.clubMember.findFirst({ where: { id: clubMemberId, clubId } }),
      prisma.season.findFirst({ where: { id: seasonId, clubId } }),
    ])
    if (!team) return reply.code(404).send({ error: 'Team not found' })
    if (!member) return reply.code(404).send({ error: 'Member not found' })
    if (!season) return reply.code(404).send({ error: 'Season not found' })

    // Check not already on this team this season
    const existing = await prisma.teamAssignment.findFirst({
      where: { teamId, seasonId, clubMemberId, removedAt: null },
    })
    if (existing) return reply.code(409).send({ error: 'Member already assigned to this team' })

    const assignment = await prisma.teamAssignment.create({
      data: { teamId, seasonId, clubMemberId, assignedById, notes },
      include: { clubMember: { include: { user: true } } },
    })
    return reply.code(201).send(assignment)
  })

  // DELETE /clubs/:clubId/teams/:teamId/squad/:assignmentId
  // Remove a member from the squad (soft delete)
  app.delete<{
    Params: { clubId: string; teamId: string; assignmentId: string }
  }>('/clubs/:clubId/teams/:teamId/squad/:assignmentId', async (req, reply) => {
    const { clubId, teamId, assignmentId } = req.params

    const assignment = await prisma.teamAssignment.findFirst({
      where: { id: assignmentId, teamId, team: { clubId } },
    })
    if (!assignment) return reply.code(404).send({ error: 'Assignment not found' })

    await prisma.teamAssignment.update({
      where: { id: assignmentId },
      data: { removedAt: new Date() },
    })
    return reply.code(204).send()
  })

  // GET /clubs/:clubId/seasons/:seasonId/squads
  // All teams + their rosters for a season — captain/board overview
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/squads',
    async (req, reply) => {
      const { clubId, seasonId } = req.params

      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      const teams = await prisma.team.findMany({
        where: { clubId },
        include: {
          assignments: {
            where: { seasonId, removedAt: null },
            include: { clubMember: { include: { user: true, roles: true } } },
            orderBy: { assignedAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      return teams
    }
  )
}
