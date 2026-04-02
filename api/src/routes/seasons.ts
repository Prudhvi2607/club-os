import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'
import { SeasonStatus, RegistrationStatus, MemberType } from '@prisma/client'

export default async function seasonsRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/seasons
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId/seasons',
    async (req) => {
      const { clubId } = req.params
      return prisma.season.findMany({
        where: { clubId },
        include: { _count: { select: { registrations: true } } },
        orderBy: { year: 'desc' },
      })
    }
  )

  // GET /clubs/:clubId/seasons/:seasonId
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({
        where: { id: seasonId, clubId },
        include: {
          registrations: {
            include: { clubMember: { include: { user: true } } },
          },
          _count: { select: { registrations: true } },
        },
      })
      if (!season) return reply.code(404).send({ error: 'Season not found' })
      return season
    }
  )

  // POST /clubs/:clubId/seasons
  app.post<{
    Params: { clubId: string }
    Body: {
      name: string
      year: number
      startDate: string
      endDate: string
      createdBy: string
      registrationFee?: number
      registrationStudentFee?: number
    }
  }>('/clubs/:clubId/seasons', async (req, reply) => {
    const { clubId } = req.params
    const { name, year, startDate, endDate, createdBy, registrationFee, registrationStudentFee } = req.body

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return reply.code(404).send({ error: 'Club not found' })

    const season = await prisma.season.create({
      data: {
        clubId,
        name,
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy,
      },
    })

    if (registrationFee) {
      await prisma.feeType.create({
        data: {
          clubId,
          seasonId: season.id,
          name: 'Registration Fee',
          amount: registrationFee,
          studentAmount: registrationStudentFee ?? null,
          isRegistrationFee: true,
          createdById: createdBy,
        },
      })
    }

    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    await prisma.announcement.create({
      data: {
        clubId,
        sentById: createdBy,
        audience: 'club',
        subject: `${year} Season Registration Now Open`,
        body: `The ${year} season has been created and registration is now open. The season runs from ${start} to ${end}. Head to your dashboard to register.`,
      },
    })

    return reply.code(201).send(season)
  })

  // DELETE /clubs/:clubId/seasons/:seasonId
  app.delete<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      // Delete in FK dependency order
      const feeTypes = await prisma.feeType.findMany({ where: { seasonId }, select: { id: true } })
      const feeTypeIds = feeTypes.map((f) => f.id)

      await prisma.payment.deleteMany({ where: { memberFee: { feeTypeId: { in: feeTypeIds } } } })
      await prisma.memberFee.deleteMany({ where: { feeTypeId: { in: feeTypeIds } } })
      await prisma.feeType.deleteMany({ where: { seasonId } })
      await prisma.seasonRegistration.deleteMany({ where: { seasonId } })
      await prisma.teamAssignment.deleteMany({ where: { seasonId } })
      const tournamentIds = await prisma.tournament.findMany({ where: { seasonId }, select: { id: true } }).then(ts => ts.map(t => t.id))
      await prisma.tournamentTeam.deleteMany({ where: { tournamentId: { in: tournamentIds } } })
      await prisma.tournament.deleteMany({ where: { seasonId } })
      await prisma.announcement.deleteMany({
        where: { clubId, subject: `${season.year} Season Registration Now Open` },
      })
      await prisma.season.delete({ where: { id: seasonId } })

      return reply.code(204).send()
    }
  )

  // PATCH /clubs/:clubId/seasons/:seasonId/status
  app.patch<{
    Params: { clubId: string; seasonId: string }
    Body: { status: SeasonStatus }
  }>('/clubs/:clubId/seasons/:seasonId/status', async (req, reply) => {
    const { clubId, seasonId } = req.params
    const { status } = req.body

    const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
    if (!season) return reply.code(404).send({ error: 'Season not found' })

    return prisma.season.update({ where: { id: seasonId }, data: { status } })
  })

  // ── Registrations ──────────────────────────────────────────────────────────

  // GET /clubs/:clubId/seasons/:seasonId/registrations
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/registrations',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      return prisma.seasonRegistration.findMany({
        where: { seasonId },
        include: { clubMember: { include: { user: true, roles: true } } },
        orderBy: { registeredAt: 'asc' },
      })
    }
  )

  // POST /clubs/:clubId/seasons/:seasonId/registrations
  // Register a member for a season
  app.post<{
    Params: { clubId: string; seasonId: string }
    Body: {
      clubMemberId: string
      memberType: MemberType
      availabilityNotes?: string
    }
  }>('/clubs/:clubId/seasons/:seasonId/registrations', async (req, reply) => {
    const { clubId, seasonId } = req.params
    const { clubMemberId, memberType, availabilityNotes } = req.body

    const [season, member] = await Promise.all([
      prisma.season.findFirst({ where: { id: seasonId, clubId } }),
      prisma.clubMember.findFirst({ where: { id: clubMemberId, clubId } }),
    ])
    if (!season) return reply.code(404).send({ error: 'Season not found' })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    // Prevent duplicate registration
    const existing = await prisma.seasonRegistration.findFirst({ where: { seasonId, clubMemberId } })
    if (existing) return reply.code(409).send({ error: 'Already registered for this season' })

    const registration = await prisma.seasonRegistration.create({
      data: { seasonId, clubMemberId, memberType, availabilityNotes, status: 'active' },
      include: { clubMember: { include: { user: true } } },
    })

    // Auto-assign student role if registering as student
    if (memberType === 'student') {
      const hasStudentRole = await prisma.clubMemberRole.findFirst({
        where: { clubMemberId, role: 'student' },
      })
      if (!hasStudentRole) {
        await prisma.clubMemberRole.create({
          data: { clubMemberId, role: 'student' },
        })
      }
    }

    // Auto-assign registration fee if one exists for this season
    const regFeeType = await prisma.feeType.findFirst({
      where: { seasonId, isRegistrationFee: true },
    })
    if (regFeeType) {
      const amount = memberType === 'student' && regFeeType.studentAmount
        ? regFeeType.studentAmount
        : regFeeType.amount
      await prisma.memberFee.create({
        data: {
          clubMemberId,
          feeTypeId: regFeeType.id,
          amountDue: amount,
        },
      })
    }

    return reply.code(201).send(registration)
  })

  // PATCH /clubs/:clubId/seasons/:seasonId/registrations/:registrationId/status
  app.patch<{
    Params: { clubId: string; seasonId: string; registrationId: string }
    Body: { status: RegistrationStatus }
  }>(
    '/clubs/:clubId/seasons/:seasonId/registrations/:registrationId/status',
    async (req, reply) => {
      const { seasonId, registrationId } = req.params
      const { status } = req.body

      const reg = await prisma.seasonRegistration.findFirst({
        where: { id: registrationId, seasonId },
      })
      if (!reg) return reply.code(404).send({ error: 'Registration not found' })

      return prisma.seasonRegistration.update({
        where: { id: registrationId },
        data: { status },
        include: { clubMember: { include: { user: true } } },
      })
    }
  )
}
