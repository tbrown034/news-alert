import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect /admin routes — require auth session cookie
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('better-auth.session_token')
      || request.cookies.get('__Secure-better-auth.session_token');

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
