import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Simple password gate for the portal.
 * Set PORTAL_PASSWORD in your environment variables (Vercel / .env.local).
 * If not set, no protection is applied (useful for local development).
 *
 * Uses HTTP Basic Auth — the browser will show a username/password prompt.
 * Username: anything (e.g. "admin")
 * Password: the value of PORTAL_PASSWORD
 */
export function middleware(request: NextRequest) {
  const password = process.env.PORTAL_PASSWORD
  if (!password) return NextResponse.next()

  // Skip API routes (used internally)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const encoded = authHeader.split(' ')[1]
    const decoded = atob(encoded)
    const [, pwd] = decoded.split(':')
    if (pwd === password) return NextResponse.next()
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="MRN Group Portal", charset="UTF-8"',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
