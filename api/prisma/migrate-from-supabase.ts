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

async function copyTable(table: string) {
  const { rows } = await SRC.query(`SELECT * FROM "${table}"`)
  if (!rows.length) { console.log(`  ${table}: empty`); return }

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
    try { await copyTable(table) }
    catch (e: any) { console.error(`  ${table}: ERROR - ${e.message}`) }
  }
  console.log('\nDone.')
  await SRC.end(); await DST.end()
}

main().catch(e => { console.error(e); process.exit(1) })
