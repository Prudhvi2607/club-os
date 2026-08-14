import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CLUB_NAME = process.env.SEED_CLUB_NAME ?? 'My Cricket Club'
const CLUB_SLUG = process.env.SEED_CLUB_SLUG ?? 'my-cricket-club'
const CLUB_SPORT = process.env.SEED_CLUB_SPORT ?? 'Cricket'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL!
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Admin'

async function main() {
  if (!ADMIN_EMAIL) {
    console.error('SEED_ADMIN_EMAIL is required')
    process.exit(1)
  }

  const club = await prisma.club.upsert({
    where: { slug: CLUB_SLUG },
    update: {},
    create: { name: CLUB_NAME, sport: CLUB_SPORT, slug: CLUB_SLUG },
  })
  console.log(`Club: ${club.name} (${club.id})`)

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { fullName: ADMIN_NAME, email: ADMIN_EMAIL },
  })
  console.log(`User: ${user.fullName} (${user.id})`)

  const member = await prisma.clubMember.upsert({
    where: { userId_clubId: { userId: user.id, clubId: club.id } },
    update: {},
    create: { userId: user.id, clubId: club.id, status: 'active' },
  })
  console.log(`Member: ${member.id}`)

  await prisma.clubMemberRole.upsert({
    where: { clubMemberId_role: { clubMemberId: member.id, role: 'board' } },
    update: {},
    create: { clubMemberId: member.id, role: 'board' },
  })
  console.log(`Role: board`)

  console.log('\nDone. Set NEXT_PUBLIC_CLUB_ID=' + club.id)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
