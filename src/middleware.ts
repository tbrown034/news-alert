import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function hasSignedSessionShape(value: string): boolean {
  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }

  const signatureStart = decoded.lastIndexOf('.');
  if (signatureStart < 1) return false;

  const signature = decoded.slice(signatureStart + 1);
  return signature.length === 44 && signature.endsWith('=');
}

export function middleware(request: NextRequest) {
  // Coarse /admin gate. The Node layout does the DB-backed session and admin
  // allowlist check; middleware rejects missing or obviously forged cookies.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('better-auth.session_token')
      || request.cookies.get('__Secure-better-auth.session_token');

    if (!sessionToken || !hasSignedSessionShape(sessionToken.value)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
