import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'

export default async function clubsRoutes(app: FastifyInstance) {
  // GET /clubs
  app.get('/clubs', async () => {
    return prisma.club.findMany({ orderBy: { createdAt: 'asc' } })
  })

  // GET /clubs/:clubId
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId',
    async (req, reply) => {
      const club = await prisma.club.findUnique({
        where: { id: req.params.clubId },
        include: { _count: { select: { members: true, seasons: true, teams: true } } },
      })
      if (!club) return reply.code(404).send({ error: 'Club not found' })
      return club
    }
  )

  // POST /clubs
  app.post<{
    Body: { name: string; sport: string; slug: string }
  }>('/clubs', async (req, reply) => {
    const { name, sport, slug } = req.body
    const existing = await prisma.club.findUnique({ where: { slug } })
    if (existing) return reply.code(409).send({ error: 'Slug already taken' })

    const club = await prisma.club.create({ data: { name, sport, slug } })
    return reply.code(201).send(club)
  })
}
