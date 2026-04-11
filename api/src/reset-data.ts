import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env['DIRECT_URL'] })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CLUB_ID = process.env['CLUB_ID'] || ''
const MY_EMAIL = process.env['MY_EMAIL'] || ''

if (!CLUB_ID || !MY_EMAIL) {
  console.error('Set CLUB_ID and MY_EMAIL env vars before running this script')
  process.exit(1)
}

async function main() {
  console.log('Starting data reset...')

  // Keep your own user ID
  const me = await prisma.user.findUnique({ where: { email: MY_EMAIL } })
  if (!me) throw new Error(`User ${MY_EMAIL} not found`)
  console.log(`Keeping user: ${me.fullName} (${me.email})`)

  const myMembership = await prisma.clubMember.findFirst({
    where: { userId: me.id, clubId: CLUB_ID },
  })
  if (!myMembership) throw new Error('Your club membership not found')

  // Delete everything in dependency order
  console.log('Deleting availability...')
  await prisma.memberAvailability.deleteMany({ where: { clubMember: { clubId: CLUB_ID } } })

  console.log('Deleting payment requests...')
  await prisma.paymentRequest.deleteMany({ where: { clubMember: { clubId: CLUB_ID } } })

  console.log('Deleting payments...')
  await prisma.payment.deleteMany({ where: { memberFee: { clubMember: { clubId: CLUB_ID } } } })

  console.log('Deleting member fees...')
  await prisma.memberFee.deleteMany({ where: { clubMember: { clubId: CLUB_ID } } })

  console.log('Deleting fee types...')
  await prisma.feeType.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('Deleting team assignments...')
  await prisma.teamAssignment.deleteMany({ where: { season: { clubId: CLUB_ID } } })

  console.log('Deleting tournament teams...')
  await prisma.tournamentTeam.deleteMany({ where: { tournament: { clubId: CLUB_ID } } })

  console.log('Deleting tournaments...')
  await prisma.tournament.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('Deleting season registrations...')
  await prisma.seasonRegistration.deleteMany({ where: { season: { clubId: CLUB_ID } } })

  console.log('Deleting seasons...')
  await prisma.season.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('Deleting announcements...')
  await prisma.announcement.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('Deleting documents...')
  await prisma.clubDocument.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('Deleting teams...')
  await prisma.team.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('Deleting other members (keeping you)...')
  const otherMembers = await prisma.clubMember.findMany({
    where: { clubId: CLUB_ID, id: { not: myMembership.id } },
  })

  for (const m of otherMembers) {
    await prisma.clubMemberCustomRole.deleteMany({ where: { clubMemberId: m.id } })
    await prisma.clubMemberRole.deleteMany({ where: { clubMemberId: m.id } })
    await prisma.clubMember.delete({ where: { id: m.id } })
    // Delete the user if they have no other memberships
    const otherMemberships = await prisma.clubMember.count({ where: { userId: m.userId } })
    if (otherMemberships === 0) {
      await prisma.user.delete({ where: { id: m.userId } })
    }
  }

  console.log('Deleting custom roles...')
  await prisma.clubCustomRole.deleteMany({ where: { clubId: CLUB_ID } })

  console.log('✅ Done! Club and your account are intact.')
  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
