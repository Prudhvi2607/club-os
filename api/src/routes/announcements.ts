import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'
import { AnnouncementAudience } from '@prisma/client'
import { sendAnnouncementEmail } from '../lib/email.js'

async function sendEmailsForAnnouncement({
  clubId,
  announcement,
  teamId,
}: {
  clubId: string
  announcement: { subject: string; body: string; audience: AnnouncementAudience; sentBy: { fullName: string } }
  teamId?: string
}) {
  let emails: string[] = []

  if (announcement.audience === 'club') {
    const members = await prisma.clubMember.findMany({
      where: { clubId, status: 'active' },
      include: { user: { select: { email: true } } },
    })
    emails = members.map((m) => m.user.email).filter(Boolean) as string[]
  } else if (announcement.audience === 'team' && teamId) {
    const assignments = await prisma.teamAssignment.findMany({
      where: { teamId },
      include: { clubMember: { include: { user: { select: { email: true } } } } },
    })
    emails = assignments.map((a: { clubMember: { user: { email: string | null } } }) => a.clubMember.user.email).filter(Boolean) as string[]
  } else if (announcement.audience === 'board') {
    const members = await prisma.clubMember.findMany({
      where: {
        clubId,
        status: 'active',
        roles: { some: { role: { in: ['board', 'captain', 'vice_captain'] } } },
      },
      include: { user: { select: { email: true } } },
    })
    emails = members.map((m) => m.user.email).filter(Boolean) as string[]
  }

  await sendAnnouncementEmail({
    to: emails,
    subject: announcement.subject,
    body: announcement.body,
    sentByName: announcement.sentBy.fullName,
  })
}

export default async function announcementsRoutes(app: FastifyInstance) {
  // GET /clubs/:clubId/announcements
  // Members see club + team announcements; board sees all
  app.get<{
    Params: { clubId: string }
    Querystring: { audience?: AnnouncementAudience; teamId?: string; limit?: string }
  }>('/clubs/:clubId/announcements', async (req) => {
    const { clubId } = req.params
    const { audience, teamId, limit } = req.query

    return prisma.announcement.findMany({
      where: {
        clubId,
        ...(audience ? { audience } : {}),
        ...(teamId ? { teamId } : {}),
      },
      include: {
        sentBy: { select: { id: true, fullName: true, avatarUrl: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { sentAt: 'desc' },
      take: limit ? parseInt(limit) : 50,
    })
  })

  // GET /clubs/:clubId/announcements/:announcementId
  app.get<{ Params: { clubId: string; announcementId: string } }>(
    '/clubs/:clubId/announcements/:announcementId',
    async (req, reply) => {
      const { clubId, announcementId } = req.params
      const announcement = await prisma.announcement.findFirst({
        where: { id: announcementId, clubId },
        include: {
          sentBy: { select: { id: true, fullName: true, avatarUrl: true } },
          team: { select: { id: true, name: true } },
        },
      })
      if (!announcement) return reply.code(404).send({ error: 'Announcement not found' })
      return announcement
    }
  )

  // POST /clubs/:clubId/announcements
  app.post<{
    Params: { clubId: string }
    Body: {
      subject: string
      body: string
      audience: AnnouncementAudience
      teamId?: string
      sentById: string
    }
  }>('/clubs/:clubId/announcements', async (req, reply) => {
    const { clubId } = req.params
    const { subject, body, audience, teamId, sentById } = req.body

    // If audience is team, teamId is required
    if (audience === 'team' && !teamId) {
      return reply.code(400).send({ error: 'teamId is required for team announcements' })
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return reply.code(404).send({ error: 'Club not found' })

    if (teamId) {
      const team = await prisma.team.findFirst({ where: { id: teamId, clubId } })
      if (!team) return reply.code(404).send({ error: 'Team not found' })
    }

    const announcement = await prisma.announcement.create({
      data: { clubId, subject, body, audience, teamId, sentById },
      include: {
        sentBy: { select: { id: true, fullName: true, avatarUrl: true } },
        team: { select: { id: true, name: true } },
      },
    })

    // Send emails in background — don't block the response
    sendEmailsForAnnouncement({ clubId, announcement, teamId }).catch((err) =>
      console.error('Failed to send announcement emails:', err)
    )

    return reply.code(201).send(announcement)
  })

  // DELETE /clubs/:clubId/announcements/:announcementId
  app.delete<{ Params: { clubId: string; announcementId: string } }>(
    '/clubs/:clubId/announcements/:announcementId',
    async (req, reply) => {
      const { clubId, announcementId } = req.params
      const announcement = await prisma.announcement.findFirst({
        where: { id: announcementId, clubId },
      })
      if (!announcement) return reply.code(404).send({ error: 'Announcement not found' })

      await prisma.announcement.delete({ where: { id: announcementId } })
      return reply.code(204).send()
    }
  )
}
