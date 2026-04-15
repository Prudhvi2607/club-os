import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'
import { PaymentMethod, FeeStatus } from '@prisma/client'

export default async function paymentsRoutes(app: FastifyInstance) {
  // ── Fee Types ──────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/seasons/:seasonId/fee-types
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/fee-types',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      return prisma.feeType.findMany({
        where: { seasonId, clubId },
        include: { _count: { select: { memberFees: true } } },
        orderBy: { createdAt: 'asc' },
      })
    }
  )

  // POST /clubs/:clubId/seasons/:seasonId/fee-types
  app.post<{
    Params: { clubId: string; seasonId: string }
    Body: {
      name: string
      amount: number
      studentAmount?: number
      allowsInstallments?: boolean
      createdById: string
    }
  }>('/clubs/:clubId/seasons/:seasonId/fee-types', async (req, reply) => {
    const { clubId, seasonId } = req.params
    const { name, amount, studentAmount, allowsInstallments = false, createdById } = req.body

    const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
    if (!season) return reply.code(404).send({ error: 'Season not found' })

    const feeType = await prisma.feeType.create({
      data: { clubId, seasonId, name, amount, studentAmount, allowsInstallments, createdById },
    })
    return reply.code(201).send(feeType)
  })

  // POST /clubs/:clubId/seasons/:seasonId/fee-types/:feeTypeId/assign-all
  // Assign this fee to all active members who don't already have it
  app.post<{
    Params: { clubId: string; seasonId: string; feeTypeId: string }
  }>('/clubs/:clubId/seasons/:seasonId/fee-types/:feeTypeId/assign-all', async (req, reply) => {
    const { clubId, seasonId, feeTypeId } = req.params

    const feeType = await prisma.feeType.findFirst({ where: { id: feeTypeId, clubId, seasonId } })
    if (!feeType) return reply.code(404).send({ error: 'Fee type not found' })

    const activeMembers = await prisma.clubMember.findMany({
      where: { clubId, status: 'active' },
      include: { roles: true },
    })

    const existing = await prisma.memberFee.findMany({
      where: { feeTypeId, clubMemberId: { in: activeMembers.map((m) => m.id) } },
      select: { clubMemberId: true },
    })
    const existingIds = new Set(existing.map((e) => e.clubMemberId))
    const toAssign = activeMembers.filter((m) => !existingIds.has(m.id))

    if (toAssign.length === 0) return reply.send({ assigned: 0 })

    await prisma.memberFee.createMany({
      data: toAssign.map((m) => {
        const isStudent = m.roles.some((r) => (r.role as string) === 'student')
        const amountDue = isStudent && feeType.studentAmount ? feeType.studentAmount : feeType.amount
        return { feeTypeId, clubMemberId: m.id, amountDue }
      }),
    })

    return reply.send({ assigned: toAssign.length })
  })

  // ── Member Fees ────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/members/:memberId/fees
  // All fees for a member (optionally filtered by season)
  app.get<{
    Params: { clubId: string; memberId: string }
    Querystring: { seasonId?: string }
  }>('/clubs/:clubId/members/:memberId/fees', async (req, reply) => {
    const { clubId, memberId } = req.params
    const { seasonId } = req.query

    const member = await prisma.clubMember.findFirst({ where: { id: memberId, clubId } })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    return prisma.memberFee.findMany({
      where: {
        clubMemberId: memberId,
        ...(seasonId ? { feeType: { seasonId } } : {}),
      },
      include: {
        feeType: true,
        payments: { orderBy: { paidAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    })
  })

  // POST /clubs/:clubId/members/:memberId/fees
  // Assign a fee type to a member
  app.post<{
    Params: { clubId: string; memberId: string }
    Body: { feeTypeId: string; amountDue?: number }
  }>('/clubs/:clubId/members/:memberId/fees', async (req, reply) => {
    const { clubId, memberId } = req.params
    const { feeTypeId, amountDue } = req.body

    const [member, feeType] = await Promise.all([
      prisma.clubMember.findFirst({ where: { id: memberId, clubId } }),
      prisma.feeType.findFirst({ where: { id: feeTypeId, clubId } }),
    ])
    if (!member) return reply.code(404).send({ error: 'Member not found' })
    if (!feeType) return reply.code(404).send({ error: 'Fee type not found' })

    const existing = await prisma.memberFee.findFirst({ where: { feeTypeId, clubMemberId: memberId } })
    if (existing) return reply.code(409).send({ error: 'Fee already assigned to this member' })

    const fee = await prisma.memberFee.create({
      data: {
        feeTypeId,
        clubMemberId: memberId,
        amountDue: amountDue ?? feeType.amount,
      },
      include: { feeType: true },
    })
    return reply.code(201).send(fee)
  })

  // ── Payments ───────────────────────────────────────────────────────────────

  // POST /clubs/:clubId/members/:memberId/fees/:feeId/payments
  // Record a payment against a member fee
  app.post<{
    Params: { clubId: string; memberId: string; feeId: string }
    Body: { amount: number; method: PaymentMethod; recordedById: string; notes?: string; paidAt?: string }
  }>('/clubs/:clubId/members/:memberId/fees/:feeId/payments', async (req, reply) => {
    const { clubId, memberId, feeId } = req.params
    const { amount, method, recordedById, notes, paidAt } = req.body

    const member = await prisma.clubMember.findFirst({ where: { id: memberId, clubId } })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const memberFee = await prisma.memberFee.findFirst({
      where: { id: feeId, clubMemberId: memberId },
      include: { feeType: true },
    })
    if (!memberFee) return reply.code(404).send({ error: 'Fee not found' })

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          memberFeeId: feeId,
          amount,
          method,
          recordedById,
          notes,
          ...(paidAt ? { paidAt: new Date(paidAt) } : {}),
        },
      })

      const newAmountPaid = Number(memberFee.amountPaid) + amount
      const newStatus: FeeStatus =
        newAmountPaid >= Number(memberFee.amountDue) ? 'paid'
        : newAmountPaid > 0 ? 'partial'
        : 'pending'

      await tx.memberFee.update({
        where: { id: feeId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      })

      // Auto-register member when registration fee is fully paid
      if (newStatus === 'paid' && memberFee.feeType.isRegistrationFee) {
        const seasonId = memberFee.feeType.seasonId
        const existing = await tx.seasonRegistration.findFirst({
          where: { seasonId, clubMemberId: memberId },
        })
        if (!existing) {
          await tx.seasonRegistration.create({
            data: { seasonId, clubMemberId: memberId, memberType: 'regular', status: 'active' },
          })
        } else if (existing.status !== 'active') {
          await tx.seasonRegistration.update({
            where: { id: existing.id },
            data: { status: 'active' },
          })
        }
      }

      return payment
    })

    return reply.code(201).send(result)
  })

  // DELETE /clubs/:clubId/members/:memberId/fees/:feeId/payments/:paymentId
  // Undo a recorded payment
  app.delete<{
    Params: { clubId: string; memberId: string; feeId: string; paymentId: string }
  }>('/clubs/:clubId/members/:memberId/fees/:feeId/payments/:paymentId', async (req, reply) => {
    const { clubId, memberId, feeId, paymentId } = req.params

    const member = await prisma.clubMember.findFirst({ where: { id: memberId, clubId } })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const payment = await prisma.payment.findFirst({ where: { id: paymentId, memberFeeId: feeId } })
    if (!payment) return reply.code(404).send({ error: 'Payment not found' })

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: paymentId } })

      const remaining = await tx.payment.aggregate({
        where: { memberFeeId: feeId },
        _sum: { amount: true },
      })

      const memberFee = await tx.memberFee.findUnique({ where: { id: feeId } })
      if (!memberFee) throw new Error('Fee not found')

      const newAmountPaid = Number(remaining._sum.amount ?? 0)
      const newStatus: FeeStatus =
        newAmountPaid >= Number(memberFee.amountDue) ? 'paid'
        : newAmountPaid > 0 ? 'partial'
        : 'pending'

      await tx.memberFee.update({
        where: { id: feeId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      })
    })

    return reply.code(204).send()
  })

  // ── Payment Requests ───────────────────────────────────────────────────────

  // POST /clubs/:clubId/members/:memberId/fees/:feeId/payment-requests
  // Member reports they've made a payment
  app.post<{
    Params: { clubId: string; memberId: string; feeId: string }
    Body: { amount: number; method: PaymentMethod; notes?: string }
  }>('/clubs/:clubId/members/:memberId/fees/:feeId/payment-requests', async (req, reply) => {
    const { clubId, memberId, feeId } = req.params
    const { amount, method, notes } = req.body

    const member = await prisma.clubMember.findFirst({ where: { id: memberId, clubId } })
    if (!member) return reply.code(404).send({ error: 'Member not found' })

    const memberFee = await prisma.memberFee.findFirst({ where: { id: feeId, clubMemberId: memberId } })
    if (!memberFee) return reply.code(404).send({ error: 'Fee not found' })

    const request = await prisma.paymentRequest.create({
      data: { memberFeeId: feeId, clubMemberId: memberId, amount, method, notes },
      include: { memberFee: { include: { feeType: true } }, clubMember: { include: { user: true } } },
    })
    return reply.code(201).send(request)
  })

  // GET /clubs/:clubId/payment-requests
  // Board: list all pending payment requests
  app.get<{ Params: { clubId: string }; Querystring: { status?: string } }>(
    '/clubs/:clubId/payment-requests',
    async (req) => {
      const { clubId } = req.params
      const { status = 'pending' } = req.query
      return prisma.paymentRequest.findMany({
        where: {
          clubMember: { clubId },
          status: status as any,
        },
        include: {
          memberFee: { include: { feeType: true } },
          clubMember: { include: { user: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
    }
  )

  // PATCH /clubs/:clubId/payment-requests/:requestId
  // Board: confirm or reject a payment request
  app.patch<{
    Params: { clubId: string; requestId: string }
    Body: { action: 'confirm' | 'reject'; recordedById: string }
  }>('/clubs/:clubId/payment-requests/:requestId', async (req, reply) => {
    const { clubId, requestId } = req.params
    const { action, recordedById } = req.body

    const request = await prisma.paymentRequest.findFirst({
      where: { id: requestId, clubMember: { clubId } },
      include: { memberFee: true },
    })
    if (!request) return reply.code(404).send({ error: 'Request not found' })
    if (request.status !== 'pending') return reply.code(409).send({ error: 'Request already resolved' })

    if (action === 'reject') {
      await prisma.paymentRequest.update({ where: { id: requestId }, data: { status: 'rejected' } })
      return reply.send({ status: 'rejected' })
    }

    // Confirm: record the payment and update fee status
    await prisma.$transaction(async (tx) => {
      await tx.paymentRequest.update({ where: { id: requestId }, data: { status: 'confirmed' } })

      await tx.payment.create({
        data: {
          memberFeeId: request.memberFeeId,
          amount: request.amount,
          method: request.method,
          recordedById,
          notes: request.notes ?? undefined,
        },
      })

      const newAmountPaid = Number(request.memberFee.amountPaid) + Number(request.amount)
      const newStatus: FeeStatus =
        newAmountPaid >= Number(request.memberFee.amountDue) ? 'paid'
        : newAmountPaid > 0 ? 'partial'
        : 'pending'

      await tx.memberFee.update({
        where: { id: request.memberFeeId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      })
    })

    return reply.send({ status: 'confirmed' })
  })

  // ── Treasurer dashboard ────────────────────────────────────────────────────

  // GET /clubs/:clubId/seasons/:seasonId/payments/summary
  // All member fees for a season with payment status — treasurer view
  app.get<{ Params: { clubId: string; seasonId: string } }>(
    '/clubs/:clubId/seasons/:seasonId/payments/summary',
    async (req, reply) => {
      const { clubId, seasonId } = req.params
      const season = await prisma.season.findFirst({ where: { id: seasonId, clubId } })
      if (!season) return reply.code(404).send({ error: 'Season not found' })

      const fees = await prisma.memberFee.findMany({
        where: {
          feeType: { seasonId, clubId },
          // Exclude pending fees for inactive/alumni members — keep paid/partial history
          NOT: {
            AND: [
              { status: 'pending' },
              { clubMember: { status: 'inactive' } },
            ],
          },
        },
        include: {
          feeType: true,
          clubMember: { include: { user: true } },
          payments: true,
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      })

      const totalDue = fees.reduce((sum, f) => sum + Number(f.amountDue), 0)
      const totalPaid = fees.reduce((sum, f) => sum + Number(f.amountPaid), 0)

      return {
        totalDue,
        totalPaid,
        totalOutstanding: totalDue - totalPaid,
        byStatus: {
          paid: fees.filter((f) => f.status === 'paid').length,
          partial: fees.filter((f) => f.status === 'partial').length,
          pending: fees.filter((f) => f.status === 'pending').length,
        },
        fees,
      }
    }
  )
}
