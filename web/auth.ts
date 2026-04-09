import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

function makeToken(sub: string, email: string | null | undefined): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
    sub,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
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
      if (profile?.email) token.email = profile.email
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        ;(session as any).accessToken = makeToken(token.sub!, token.email)
      }
      return session
    },
  },
})
