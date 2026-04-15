import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'
import { ExpenseCategory } from '@prisma/client'

export default async function treasuryRoutes(app: FastifyInstance) {

  // ── Sponsors ───────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/sponsors
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId/sponsors',
    async (req) => {
      const { clubId } = req.params
      return prisma.sponsor.findMany({
        where: { clubId },
        include: {
          contributions: {
            orderBy: { receivedAt: 'desc' },
          },
          _count: { select: { contributions: true } },
        },
        orderBy: { name: 'asc' },
      })
    }
  )

  // POST /clubs/:clubId/sponsors
  app.post<{
    Params: { clubId: string }
    Body: { name: string; contactName?: string; contactEmail?: string; notes?: string }
  }>('/clubs/:clubId/sponsors', async (req, reply) => {
    const { clubId } = req.params
    const { name, contactName, contactEmail, notes } = req.body
    const sponsor = await prisma.sponsor.create({
      data: { clubId, name, contactName, contactEmail, notes },
    })
    return reply.code(201).send(sponsor)
  })

  // DELETE /clubs/:clubId/sponsors/:sponsorId
  app.delete<{ Params: { clubId: string; sponsorId: string } }>(
    '/clubs/:clubId/sponsors/:sponsorId',
    async (req, reply) => {
      const { clubId, sponsorId } = req.params
      const sponsor = await prisma.sponsor.findFirst({ where: { id: sponsorId, clubId } })
      if (!sponsor) return reply.code(404).send({ error: 'Sponsor not found' })
      await prisma.sponsor.delete({ where: { id: sponsorId } })
      return reply.code(204).send()
    }
  )

  // ── Sponsor Contributions ──────────────────────────────────────────────────

  // POST /clubs/:clubId/sponsors/:sponsorId/contributions
  app.post<{
    Params: { clubId: string; sponsorId: string }
    Body: { amount: number; description?: string; seasonId?: string; receivedAt?: string; recordedById: string }
  }>('/clubs/:clubId/sponsors/:sponsorId/contributions', async (req, reply) => {
    const { clubId, sponsorId } = req.params
    const { amount, description, seasonId, receivedAt, recordedById } = req.body

    const sponsor = await prisma.sponsor.findFirst({ where: { id: sponsorId, clubId } })
    if (!sponsor) return reply.code(404).send({ error: 'Sponsor not found' })

    const contribution = await prisma.sponsorContribution.create({
      data: {
        clubId,
        sponsorId,
        amount,
        description,
        seasonId: seasonId || null,
        recordedById,
        ...(receivedAt ? { receivedAt: new Date(receivedAt) } : {}),
      },
    })
    return reply.code(201).send(contribution)
  })

  // DELETE /clubs/:clubId/sponsors/:sponsorId/contributions/:contributionId
  app.delete<{ Params: { clubId: string; sponsorId: string; contributionId: string } }>(
    '/clubs/:clubId/sponsors/:sponsorId/contributions/:contributionId',
    async (req, reply) => {
      const { clubId, contributionId } = req.params
      const contribution = await prisma.sponsorContribution.findFirst({
        where: { id: contributionId, clubId },
      })
      if (!contribution) return reply.code(404).send({ error: 'Contribution not found' })
      await prisma.sponsorContribution.delete({ where: { id: contributionId } })
      return reply.code(204).send()
    }
  )

  // ── Expenses ───────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/expenses
  app.get<{ Params: { clubId: string }; Querystring: { seasonId?: string } }>(
    '/clubs/:clubId/expenses',
    async (req) => {
      const { clubId } = req.params
      const { seasonId } = req.query
      return prisma.expense.findMany({
        where: { clubId, ...(seasonId ? { seasonId } : {}) },
        orderBy: { paidAt: 'desc' },
      })
    }
  )

  // POST /clubs/:clubId/expenses
  app.post<{
    Params: { clubId: string }
    Body: {
      category: ExpenseCategory
      description: string
      amount: number
      seasonId?: string
      paidAt?: string
      notes?: string
      recordedById: string
    }
  }>('/clubs/:clubId/expenses', async (req, reply) => {
    const { clubId } = req.params
    const { category, description, amount, seasonId, paidAt, notes, recordedById } = req.body

    const expense = await prisma.expense.create({
      data: {
        clubId,
        category,
        description,
        amount,
        seasonId: seasonId || null,
        notes,
        recordedById,
        ...(paidAt ? { paidAt: new Date(paidAt) } : {}),
      },
    })
    return reply.code(201).send(expense)
  })

  // DELETE /clubs/:clubId/expenses/:expenseId
  app.delete<{ Params: { clubId: string; expenseId: string } }>(
    '/clubs/:clubId/expenses/:expenseId',
    async (req, reply) => {
      const { clubId, expenseId } = req.params
      const expense = await prisma.expense.findFirst({ where: { id: expenseId, clubId } })
      if (!expense) return reply.code(404).send({ error: 'Expense not found' })
      await prisma.expense.delete({ where: { id: expenseId } })
      return reply.code(204).send()
    }
  )

  // ── Summary ────────────────────────────────────────────────────────────────

  // GET /clubs/:clubId/treasury/summary
  app.get<{ Params: { clubId: string }; Querystring: { seasonId?: string } }>(
    '/clubs/:clubId/treasury/summary',
    async (req) => {
      const { clubId } = req.params
      const { seasonId } = req.query

      const [contributions, expenses, payments] = await Promise.all([
        prisma.sponsorContribution.findMany({
          where: { clubId, ...(seasonId ? { seasonId } : {}) },
        }),
        prisma.expense.findMany({
          where: { clubId, ...(seasonId ? { seasonId } : {}) },
        }),
        prisma.payment.findMany({
          where: {
            memberFee: {
              feeType: {
                clubId,
                ...(seasonId ? { seasonId } : {}),
              },
            },
          },
        }),
      ])

      const totalSponsorIncome = contributions.reduce((sum, c) => sum + Number(c.amount), 0)
      const totalMemberFees = payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const totalIncome = totalSponsorIncome + totalMemberFees

      return {
        totalSponsorIncome,
        totalMemberFees,
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
      }
    }
  )
}
