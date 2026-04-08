import { auth } from '@/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let Auth.js handle its own routes — never intercept these
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next({ request })
  }

  const isAuthPage = pathname.startsWith('/login')

  // Only call auth() when we actually need to check session
  if (!isAuthPage) {
    const session = await auth()
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
