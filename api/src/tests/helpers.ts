import crypto from 'node:crypto'

export function makeToken(payload: Record<string, unknown>, secret = 'test-secret-that-is-long-enough-for-hmac') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload })).toString('base64url')
  const sig = crypto.createHmac('sha256', Buffer.from(secret, 'utf8')).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}
