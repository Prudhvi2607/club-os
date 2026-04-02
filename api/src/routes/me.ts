import type { FastifyInstance, FastifyRequest } from 'fastify'
import prisma from '../lib/prisma.js'

function parseJwtPayload(req: FastifyRequest): { sub: string; email?: string } | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const [, payloadB64] = token.split('.')
  if (!payloadB64) return null
  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
  } catch {
    return null
  }
}

export default async function meRoutes(app: FastifyInstance) {
  // GET /me
  // Returns the current user's profile + club membership + roles
  // Creates a User record on first login if one matches by email
  app.get('/me', async (req: FastifyRequest, reply) => {
    const payload = parseJwtPayload(req)
    if (!payload) return reply.code(401).send({ error: 'Unauthorized' })
    const authUser = { id: payload.sub, email: payload.email }

    // Look up by supabaseId first, then fall back to email
    let user = await prisma.user.findFirst({
      where: { supabaseId: authUser.id },
      include: {
        clubMemberships: {
          include: { roles: true, club: true },
        },
      },
    })

    if (!user && authUser.email) {
      // Try matching an existing record by email (board pre-created them)
      const byEmail = await prisma.user.findUnique({
        where: { email: authUser.email },
        include: {
          clubMemberships: {
            include: { roles: true, club: true },
          },
        },
      })

      if (byEmail) {
        // Link their Supabase account to the existing record
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { supabaseId: authUser.id },
          include: {
            clubMemberships: {
              include: { roles: true, club: true },
            },
          },
        })
      }
    }

    if (!user) {
      return reply.code(404).send({ error: 'No club membership found for this account.' })
    }

    return user
  })

  // PATCH /me — update own profile
  app.patch<{
    Body: {
      fullName?: string
      phone?: string
      avatarUrl?: string
      playingRole?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      emergencyContactRelationship?: string
      jerseyNumber?: number | null
      tshirtSize?: string | null
      cricclubsUrl?: string | null
    }
  }>('/me', async (req: FastifyRequest, reply) => {
    const payload = parseJwtPayload(req)
    if (!payload) return reply.code(401).send({ error: 'Unauthorized' })
    const authUser = { id: payload.sub }

    const user = await prisma.user.findFirst({
      where: { supabaseId: authUser.id },
      include: { clubMemberships: { select: { clubId: true } } },
    })
    if (!user) return reply.code(404).send({ error: 'User not found' })

    const { jerseyNumber } = req.body
    if (jerseyNumber != null) {
      const clubId = user.clubMemberships[0]?.clubId
      if (clubId) {
        const conflict = await prisma.user.findFirst({
          where: {
            jerseyNumber,
            id: { not: user.id },
            clubMemberships: { some: { clubId } },
          },
        })
        if (conflict) return reply.code(409).send({ error: `Jersey #${jerseyNumber} is already taken` })
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: req.body as any,
    })
    return updated
  })
}
