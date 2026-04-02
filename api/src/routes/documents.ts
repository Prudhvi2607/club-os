import type { FastifyInstance, FastifyRequest } from 'fastify'
import prisma from '../lib/prisma.js'

function getSubFromRequest(req: FastifyRequest): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const [, payloadB64] = token.split('.')
  if (!payloadB64) return null
  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString()).sub ?? null
  } catch {
    return null
  }
}

async function getCallerRoles(supabaseId: string, clubId: string): Promise<string[]> {
  const user = await prisma.user.findFirst({
    where: { supabaseId },
    include: { clubMemberships: { where: { clubId }, include: { roles: true } } },
  })
  return user?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
}

export default async function documentsRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/documents
  app.get<{ Params: { clubId: string } }>(
    '/clubs/:clubId/documents',
    async (req) => {
      const { clubId } = req.params
      const supabaseId = getSubFromRequest(req) ?? ''
      const roles = await getCallerRoles(supabaseId, clubId)
      const isBoard = roles.includes('board')

      return prisma.clubDocument.findMany({
        where: { clubId, ...(!isBoard ? { visibility: 'club' } : {}) },
        include: { uploadedBy: { select: { fullName: true } } },
        orderBy: { uploadedAt: 'desc' },
      })
    }
  )

  // POST /clubs/:clubId/documents
  app.post<{
    Params: { clubId: string }
    Body: { title: string; fileUrl: string; category: string; visibility?: string; uploadedById: string }
  }>('/clubs/:clubId/documents', async (req, reply) => {
    const { clubId } = req.params
    const { title, fileUrl, category, visibility = 'club', uploadedById } = req.body

    const doc = await prisma.clubDocument.create({
      data: { clubId, title, fileUrl, category: category as any, visibility: visibility as any, uploadedById },
      include: { uploadedBy: { select: { fullName: true } } },
    })
    return reply.code(201).send(doc)
  })

  // PATCH /clubs/:clubId/documents/:docId — rename
  app.patch<{
    Params: { clubId: string; docId: string }
    Body: { title: string }
  }>('/clubs/:clubId/documents/:docId', async (req, reply) => {
    const { clubId, docId } = req.params
    const { title } = req.body
    const doc = await prisma.clubDocument.findFirst({ where: { id: docId, clubId } })
    if (!doc) return reply.code(404).send({ error: 'Document not found' })
    const updated = await prisma.clubDocument.update({
      where: { id: docId },
      data: { title },
      include: { uploadedBy: { select: { fullName: true } } },
    })
    return updated
  })

  // DELETE /clubs/:clubId/documents/:docId
  app.delete<{ Params: { clubId: string; docId: string } }>(
    '/clubs/:clubId/documents/:docId',
    async (req, reply) => {
      const { clubId, docId } = req.params
      const doc = await prisma.clubDocument.findFirst({ where: { id: docId, clubId } })
      if (!doc) return reply.code(404).send({ error: 'Document not found' })
      await prisma.clubDocument.delete({ where: { id: docId } })
      return reply.code(204).send()
    }
  )
}
