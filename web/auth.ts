import crypto from 'node:crypto'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

function mintApiToken(sub: string, email: string | null | undefined): string {
  const secret = process.env.AUTH_SECRET!
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        ;(session as any).accessToken = mintApiToken(token.sub!, token.email)
      }
      return session
    },
  },
})
