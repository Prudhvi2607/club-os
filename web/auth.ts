import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

function makeToken(sub: string, email: string | null | undefined): string {
  const header = b64url({ alg: 'none', typ: 'JWT' })
  const payload = b64url({ sub, email, exp: Math.floor(Date.now() / 1000) + 3600 })
  return `${header}.${payload}.unsigned`
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
        // profile is only present on the initial sign-in, not on session refreshes
        console.log(JSON.stringify({ event: 'login', email: profile.email, sub: token.sub, time: new Date().toISOString() }))
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.accessToken = makeToken(token.sub!, token.email)
      }
      return session
    },
  },
})
