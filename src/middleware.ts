import { NextRequest, NextResponse } from 'next/server';
import { auth0, isAuth0Configured } from '@/lib/auth0';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Convenience aliases for standard /api/auth routes -> /auth
  if (pathname === '/api/auth/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (pathname === '/api/auth/logout') {
    return NextResponse.redirect(new URL('/auth/logout', request.url));
  }
  if (pathname === '/api/auth/callback') {
    return NextResponse.redirect(new URL('/auth/callback', request.url));
  }

  // If Auth0 is fully configured, let Auth0 middleware handle /auth/* routes & session cookies
  if (isAuth0Configured()) {
    try {
      return await auth0.middleware(request);
    } catch (err) {
      console.error('Auth0 middleware error:', err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
