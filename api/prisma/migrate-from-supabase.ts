import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const SRC = new Pool({ connectionString: process.env.SUPABASE_URL, ssl: { rejectUnauthorized: false } })
const DST = new Pool({ connectionString: process.env.DIRECT_URL, ssl: { rejectUnauthorized: false } })

const TABLES = [
  'User', 'Club', 'ClubMember', 'ClubMemberRole', 'ClubCustomRole',
  'ClubMemberCustomRole', 'Season', 'SeasonRegistration', 'Team',
  'TeamAssignment', 'Tournament', 'TournamentTeam', 'FeeType', 'MemberFee',
  'Payment', 'MemberAvailability', 'PaymentRequest', 'Sponsor',
  'SponsorContribution', 'Expense', 'Announcement', 'ClubDocument',
]

// Neon's User table already existed (seeded separately) with its own ids,
// correlated to Supabase users only by email. Remap these FK columns per
// table before inserting so they point at Neon's ids instead of Supabase's.
const USER_COLS: Record<string, string[]> = {
  ClubMember: ['userId'],
  Season: ['createdBy'],
  TeamAssignment: ['assignedById'],
  Tournament: ['createdById'],
  FeeType: ['createdById'],
  Payment: ['recordedById'],
  SponsorContribution: ['recordedById'],
  Expense: ['recordedById'],
  Announcement: ['sentById'],
  ClubDocument: ['uploadedById'],
}

// Same story for ClubMember: the admin's row pre-existed under a different id.
const CLUB_MEMBER_COLS: Record<string, string[]> = {
  ClubMemberRole: ['clubMemberId'],
  ClubMemberCustomRole: ['clubMemberId'],
  SeasonRegistration: ['clubMemberId'],
  TeamAssignment: ['clubMemberId'],
  MemberFee: ['clubMemberId'],
  PaymentRequest: ['clubMemberId'],
  MemberAvailability: ['clubMemberId'],
}

const userIdMap = new Map<string, string>()
const clubMemberIdMap = new Map<string, string>()

async function buildUserIdMap() {
  const { rows: src } = await SRC.query('SELECT id, email FROM "User"')
  const { rows: dst } = await DST.query('SELECT id, email FROM "User"')
  const byEmail = new Map(dst.filter(r => r.email).map(r => [r.email.toLowerCase(), r.id]))
  for (const r of src) {
    const neonId = r.email && byEmail.get(r.email.toLowerCase())
    if (neonId) userIdMap.set(r.id, neonId)
  }
}

async function buildClubMemberIdMap() {
  const { rows: src } = await SRC.query('SELECT id, "userId", "clubId" FROM "ClubMember"')
  const { rows: dst } = await DST.query('SELECT id, "userId", "clubId" FROM "ClubMember"')
  const byKey = new Map(dst.map(r => [`${r.userId}:${r.clubId}`, r.id]))
  for (const r of src) {
    const neonUserId = userIdMap.get(r.userId) ?? r.userId
    const neonId = byKey.get(`${neonUserId}:${r.clubId}`)
    if (neonId) clubMemberIdMap.set(r.id, neonId)
  }
}

async function copyTable(table: string) {
  const { rows } = await SRC.query(`SELECT * FROM "${table}"`)
  if (!rows.length) { console.log(`  ${table}: empty`); return }

  const userCols = USER_COLS[table] || []
  const clubMemberCols = CLUB_MEMBER_COLS[table] || []
  for (const row of rows) {
    for (const col of userCols) {
      if (row[col] && userIdMap.has(row[col])) row[col] = userIdMap.get(row[col])
    }
    for (const col of clubMemberCols) {
      if (row[col] && clubMemberIdMap.has(row[col])) row[col] = clubMemberIdMap.get(row[col])
    }
  }

  const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ')
  const placeholders = rows.map((_, i) =>
    `(${Object.keys(rows[0]).map((_, j) => `$${i * Object.keys(rows[0]).length + j + 1}`).join(', ')})`
  ).join(', ')
  const values = rows.flatMap(r => Object.values(r))

  await DST.query(
    `INSERT INTO "${table}" (${cols}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
    values
  )
  console.log(`  ${table}: ${rows.length} rows`)
}

async function main() {
  if (!process.env.SUPABASE_URL) { console.error('Set SUPABASE_URL in .env'); process.exit(1) }
  if (!process.env.DIRECT_URL)   { console.error('Set DIRECT_URL in .env'); process.exit(1) }

  console.log('Migrating data from Supabase → Neon...\n')
  for (const table of TABLES) {
    try {
      await copyTable(table)
      if (table === 'User') await buildUserIdMap()
      if (table === 'ClubMember') await buildClubMemberIdMap()
    }
    catch (e: any) { console.error(`  ${table}: ERROR - ${e.message}`) }
  }
  console.log('\nDone.')
  await SRC.end(); await DST.end()
}

main().catch(e => { console.error(e); process.exit(1) })
