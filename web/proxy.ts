import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let Auth.js and debug routes through
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/debug')) {
    return NextResponse.next({ request })
  }

  const isAuthPage = pathname.startsWith('/login')

  if (!isAuthPage) {
    // Check for Auth.js session cookie
    const hasSession =
      request.cookies.has('authjs.session-token') ||
      request.cookies.has('__Secure-authjs.session-token') ||
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token')

    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
