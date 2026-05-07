import { encode } from '@auth/core/jwt'
import fs from 'node:fs'
import path from 'node:path'

export const PLAYWRIGHT_AUTH_SECRET = 'playwright-test-auth-secret-must-be-32-chars-long'
const COOKIE_NAME = 'authjs.session-token'

async function writeStorageState(
  sub: string,
  email: string,
  name: string,
  outFile: string,
) {
  const value = await encode({
    token: { sub, email, name },
    secret: PLAYWRIGHT_AUTH_SECRET,
    salt: COOKIE_NAME,
  })

  const state = {
    cookies: [
      {
        name: COOKIE_NAME,
        value,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 86400 * 30,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(state, null, 2))
}

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), 'playwright/.auth')

  // Board member — can access all pages
  await writeStorageState(
    'test-board-supa-id',
    'board@testclub.com',
    'Alex Board',
    path.join(authDir, 'user.json'),
  )

  // Unknown user — not in the club, /me returns 404
  await writeStorageState(
    'no-member-supa-id',
    'unknown@example.com',
    'No Member',
    path.join(authDir, 'nomember.json'),
  )
}
