/**
 * Club setup script — run once when onboarding a new club.
 *
 * Usage:
 *   DIRECT_URL=<your-db-url> npx ts-node --esm src/setup.ts
 *
 * What it does:
 *   1. Creates the Club record
 *   2. Creates the admin User
 *   3. Adds them as a board member
 *   4. Prints the CLUB_ID to put in your env vars
 */

import 'dotenv/config'
import * as readline from 'readline'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env['DIRECT_URL'] })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve))

async function main() {
  console.log('\n=== club-os setup ===\n')

  const clubName = (await ask('Club name (e.g. UC Cricket Club): ')).trim()
  if (!clubName) throw new Error('Club name is required')

  const sport = (await ask('Sport (e.g. cricket): ')).trim() || 'cricket'

  const slugBase = clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const slugInput = (await ask(`Club slug [${slugBase}]: `)).trim()
  const slug = slugInput || slugBase

  const adminName = (await ask('Your full name: ')).trim()
  if (!adminName) throw new Error('Admin name is required')

  const adminEmail = (await ask('Your email (must match Google login): ')).trim().toLowerCase()
  if (!adminEmail) throw new Error('Admin email is required')

  rl.close()

  // Check slug not taken
  const existing = await prisma.club.findUnique({ where: { slug } })
  if (existing) throw new Error(`Slug "${slug}" already taken — re-run and choose a different slug`)

  console.log('\nCreating club...')

  const { club } = await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: { name: clubName, sport, slug },
    })

    // Check if user already exists (re-running setup)
    let user = await tx.user.findUnique({ where: { email: adminEmail } })
    if (!user) {
      user = await tx.user.create({
        data: { fullName: adminName, email: adminEmail },
      })
    }

    // Check if already a member
    let member = await tx.clubMember.findFirst({ where: { userId: user.id, clubId: club.id } })
    if (!member) {
      member = await tx.clubMember.create({
        data: {
          userId: user.id,
          clubId: club.id,
          roles: { create: [{ role: 'board' }, { role: 'member' }] },
        },
        include: { roles: true },
      })
    }

    return { club }
  })

  console.log('\n✅ Done!\n')
  console.log('─────────────────────────────────────────')
  console.log(`Club:     ${club.name}`)
  console.log(`Admin:    ${adminName} (${adminEmail})`)
  console.log(`Club ID:  ${club.id}`)
  console.log('─────────────────────────────────────────')
  console.log('\nAdd these to your env vars:\n')
  console.log(`  NEXT_PUBLIC_CLUB_NAME=${club.name}`)
  console.log(`  NEXT_PUBLIC_CLUB_ID=${club.id}`)
  console.log(`  CLUB_NAME=${club.name}`)
  console.log('\nThen deploy and log in with', adminEmail)
  console.log()
}

main()
  .catch((e) => { console.error('\n❌', e.message); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
