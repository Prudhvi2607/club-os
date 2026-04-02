import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'

export default async function customRolesRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/custom-roles
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId/custom-roles',
    async (req) => {
      const { clubId } = req.params
      return prisma.clubCustomRole.findMany({
        where: { clubId },
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: 'asc' },
      })
    }
  )

  // POST /clubs/:clubId/custom-roles
  app.post<{
    Params: { clubId: string }
    Body: { name: string }
  }>('/clubs/:clubId/custom-roles', async (req, reply) => {
    const { clubId } = req.params
    const { name } = req.body

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return reply.code(404).send({ error: 'Club not found' })

    const existing = await prisma.clubCustomRole.findFirst({ where: { clubId, name } })
    if (existing) return reply.code(409).send({ error: 'Role already exists' })

    const role = await prisma.clubCustomRole.create({ data: { clubId, name } })
    return reply.code(201).send(role)
  })

  // DELETE /clubs/:clubId/custom-roles/:roleId
  app.delete<{ Params: { clubId: string; roleId: string } }>(
    '/clubs/:clubId/custom-roles/:roleId',
    async (req, reply) => {
      const { clubId, roleId } = req.params
      const role = await prisma.clubCustomRole.findFirst({ where: { id: roleId, clubId } })
      if (!role) return reply.code(404).send({ error: 'Role not found' })
      await prisma.clubCustomRole.delete({ where: { id: roleId } })
      return reply.code(204).send()
    }
  )

  // POST /clubs/:clubId/members/:memberId/custom-roles
  app.post<{
    Params: { clubId: string; memberId: string }
    Body: { customRoleId: string }
  }>('/clubs/:clubId/members/:memberId/custom-roles', async (req, reply) => {
    const { clubId, memberId } = req.params
    const { customRoleId } = req.body

    const [member, customRole] = await Promise.all([
      prisma.clubMember.findFirst({ where: { id: memberId, clubId } }),
      prisma.clubCustomRole.findFirst({ where: { id: customRoleId, clubId } }),
    ])
    if (!member) return reply.code(404).send({ error: 'Member not found' })
    if (!customRole) return reply.code(404).send({ error: 'Role not found' })

    const existing = await prisma.clubMemberCustomRole.findFirst({
      where: { clubMemberId: memberId, customRoleId },
    })
    if (existing) return reply.code(409).send({ error: 'Already assigned' })

    const result = await prisma.clubMemberCustomRole.create({
      data: { clubMemberId: memberId, customRoleId },
    })
    return reply.code(201).send(result)
  })

  // DELETE /clubs/:clubId/members/:memberId/custom-roles/:customRoleId
  app.delete<{ Params: { clubId: string; memberId: string; customRoleId: string } }>(
    '/clubs/:clubId/members/:memberId/custom-roles/:customRoleId',
    async (req, reply) => {
      const { clubId, memberId, customRoleId } = req.params
      await prisma.clubMemberCustomRole.deleteMany({
        where: { clubMemberId: memberId, customRoleId },
      })
      return reply.code(204).send()
    }
  )
}
