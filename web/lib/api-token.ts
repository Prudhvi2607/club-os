// Creates a simple JWT-shaped token for internal API calls.
// The API parses but does not verify the signature (internal trust).
export function makeApiToken(sub: string, email: string | null | undefined): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payload = btoa(JSON.stringify({ sub, email, exp: Math.floor(Date.now() / 1000) + 3600 }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${payload}.`
}
