import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'
import { ClubRole, MemberStatus } from '@prisma/client'

export default async function membersRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/members
  app.get<{ Params: { clubId: string }; Querystring: { status?: MemberStatus } }>(
    '/clubs/:clubId/members',
    async (req) => {
      const { clubId } = req.params
      const { status } = req.query

      const members = await prisma.clubMember.findMany({
        where: {
          clubId,
          ...(status ? { status } : {}),
        },
        include: {
          user: true,
          roles: true,
          customRoles: { include: { customRole: true } },
        },
        orderBy: { joinedAt: 'asc' },
      })

      return members
    }
  )

  // GET /clubs/:clubId/members/jersey-numbers — returns taken jersey numbers in the club
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId/members/jersey-numbers',
    async (req) => {
      const { clubId } = req.params
      const members = await prisma.clubMember.findMany({
        where: { clubId },
        include: { user: { select: { jerseyNumber: true, id: true } } },
      })
      return members
        .filter((m) => m.user.jerseyNumber != null)
        .map((m) => ({ userId: m.user.id, jerseyNumber: m.user.jerseyNumber! }))
    }
  )

  // GET /clubs/:clubId/members/:memberId
  app.get<{ Params: { clubId: string; memberId: string } }>(
    '/clubs/:clubId/members/:memberId',
    async (req, reply) => {
      const { clubId, memberId } = req.params

      const member = await prisma.clubMember.findFirst({
        where: { id: memberId, clubId },
        include: {
          user: true,
          roles: true,
          seasonRegistrations: { include: { season: true } },
          memberFees: { include: { feeType: true, payments: true } },
        },
      })

      if (!member) return reply.code(404).send({ error: 'Member not found' })
      return member
    }
  )

  // POST /clubs/:clubId/members
  // Creates a new User + ClubMember in one shot
  app.post<{
    Params: { clubId: string }
    Body: {
      fullName: string
      email?: string
      phone?: string
      avatarUrl?: string
      playingRole?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      emergencyContactRelationship?: string
      studentId?: string
      studentEmail?: string
      studentProgram?: string
      roles?: ClubRole[]
    }
  }>('/clubs/:clubId/members', async (req, reply) => {
    const { clubId } = req.params
    const { roles = [], ...userFields } = req.body

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return reply.code(404).send({ error: 'Club not found' })

    const member = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: userFields as any })

      const clubMember = await tx.clubMember.create({
        data: {
          userId: user.id,
          clubId,
          roles: {
            create: roles.map((role) => ({ role })),
          },
        },
        include: { user: true, roles: true },
      })

      return clubMember
    })

    return reply.code(201).send(member)
  })

  // PATCH /clubs/:clubId/members/:memberId
  // Update user profile fields
  app.patch<{
    Params: { clubId: string; memberId: string }
    Body: {
      fullName?: string
      phone?: string
      avatarUrl?: string
      playingRole?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      emergencyContactRelationship?: string
      studentId?: string
      studentEmail?: string
      studentProgram?: string
    }
  }>('/clubs/:clubId/members/:memberId', async (req, reply) => {
    const { clubId, memberId } = req.params

    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
    })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const updated = await prisma.user.update({
      where: { id: member.userId },
      data: req.body as any,
    })

    return updated
  })

  // PATCH /clubs/:clubId/members/:memberId/status
  app.patch<{
    Params: { clubId: string; memberId: string }
    Body: { status: MemberStatus }
  }>('/clubs/:clubId/members/:memberId/status', async (req, reply) => {
    const { clubId, memberId } = req.params
    const { status } = req.body

    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
    })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const updated = await prisma.clubMember.update({
      where: { id: memberId },
      data: { status },
      include: { user: true, roles: true },
    })

    // Cancel pending fees when member goes inactive or alumni
    if (status === 'inactive') {
      await prisma.memberFee.deleteMany({
        where: { clubMemberId: memberId, status: 'pending' },
      })
    }

    return updated
  })

  // POST /clubs/:clubId/members/:memberId/roles
  app.post<{
    Params: { clubId: string; memberId: string }
    Body: { role: ClubRole }
  }>('/clubs/:clubId/members/:memberId/roles', async (req, reply) => {
    const { clubId, memberId } = req.params
    const { role } = req.body

    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
      include: { roles: true },
    })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const existingRoles = member.roles.map((r) => r.role)
    if (role === 'captain' && existingRoles.includes('vice_captain' as ClubRole)) {
      return reply.code(400).send({ error: 'Member is already Vice Captain' })
    }
    if (role === 'vice_captain' && existingRoles.includes('captain' as ClubRole)) {
      return reply.code(400).send({ error: 'Member is already Captain' })
    }

    const created = await prisma.clubMemberRole.create({
      data: { clubMemberId: memberId, role },
    })

    return reply.code(201).send(created)
  })

  // DELETE /clubs/:clubId/members/:memberId
  app.delete<{
    Params: { clubId: string; memberId: string }
  }>('/clubs/:clubId/members/:memberId', async (req, reply) => {
    const { clubId, memberId } = req.params

    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
    })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    await prisma.clubMember.delete({ where: { id: memberId } })

    return reply.code(204).send()
  })

  // DELETE /clubs/:clubId/members/:memberId/roles/:role
  app.delete<{
    Params: { clubId: string; memberId: string; role: ClubRole }
  }>('/clubs/:clubId/members/:memberId/roles/:role', async (req, reply) => {
    const { clubId, memberId, role } = req.params

    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
    })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    await prisma.clubMemberRole.deleteMany({
      where: { clubMemberId: memberId, role },
    })

    return reply.code(204).send()
  })
}
