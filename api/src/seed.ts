import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding...')

  // Club
  const club = await prisma.club.upsert({
    where: { slug: 'uc-cc' },
    update: {},
    create: { name: 'UC Cricket Club', sport: 'cricket', slug: 'uc-cc' },
  })
  console.log(`Club: ${club.name} (${club.id})`)

  // Board member (you)
  const you = await prisma.user.create({
    data: {
      fullName: 'Prudhvi',
      clubMemberships: {
        create: {
          clubId: club.id,
          roles: { create: [{ role: 'board' }] },
        },
      },
    },
    include: { clubMemberships: true },
  })
  console.log(`User: ${you.fullName} (${you.id})`)

  const yourMembership = you.clubMemberships[0]!

  // Season
  const season = await prisma.season.create({
    data: {
      clubId: club.id,
      name: '2025 Season',
      year: 2025,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-10-31'),
      status: 'active',
      createdBy: you.id,
    },
  })
  console.log(`Season: ${season.name} (${season.id})`)

  // Teams
  const [team1, team2] = await Promise.all([
    prisma.team.create({ data: { clubId: club.id, name: 'Team A' } }),
    prisma.team.create({ data: { clubId: club.id, name: 'Team B' } }),
  ])
  console.log(`Teams: ${team1.name} (${team1.id}), ${team2.name} (${team2.id})`)

  // Fee types
  const membershipFee = await prisma.feeType.create({
    data: {
      clubId: club.id,
      seasonId: season.id,
      name: 'Membership Fee',
      amount: 200,
      studentAmount: 100,
      allowsInstallments: true,
      createdById: you.id,
    },
  })
  console.log(`Fee type: ${membershipFee.name} (${membershipFee.id})`)

  // Assign membership fee to yourself
  await prisma.memberFee.create({
    data: {
      feeTypeId: membershipFee.id,
      clubMemberId: yourMembership.id,
      amountDue: 200,
    },
  })

  // Register for season
  await prisma.seasonRegistration.create({
    data: {
      seasonId: season.id,
      clubMemberId: yourMembership.id,
      memberType: 'regular',
      status: 'active',
    },
  })

  // Assign to Team A
  await prisma.teamAssignment.create({
    data: {
      teamId: team1.id,
      seasonId: season.id,
      clubMemberId: yourMembership.id,
      assignedById: you.id,
    },
  })

  console.log('\nDone! IDs to save:')
  console.log(`  CLUB_ID=${club.id}`)
  console.log(`  SEASON_ID=${season.id}`)
  console.log(`  YOUR_USER_ID=${you.id}`)
  console.log(`  YOUR_MEMBER_ID=${yourMembership.id}`)
  console.log(`  TEAM_A_ID=${team1.id}`)
  console.log(`  TEAM_B_ID=${team2.id}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
