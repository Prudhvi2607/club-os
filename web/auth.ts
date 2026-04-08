import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { SignJWT } from 'jose'

async function mintApiToken(sub: string, email: string | null | undefined): Promise<string> {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
  return new SignJWT({ sub, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret)
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
        ;(session as any).accessToken = await mintApiToken(token.sub!, token.email)
      }
      return session
    },
  },
})
