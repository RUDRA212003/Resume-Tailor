import { NextRequest, NextResponse } from 'next/server';
import { auth0, isAuth0Configured } from '@/lib/auth0';

const protectedPages = [
  '/profile',
  '/tailor',
  '/applications',
  '/history',
  '/settings',
  '/templates',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Convenience aliases for standard /api/auth routes -> /auth
  if (pathname === '/api/auth/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (pathname === '/api/auth/logout') {
    return NextResponse.redirect(new URL('/auth/logout', request.url));
  }
  if (pathname === '/api/auth/callback') {
    return NextResponse.redirect(new URL('/auth/callback', request.url));
  }

  // 2. Auth0 internal route handler (/auth/login, /auth/logout, /auth/callback, etc.)
  if (pathname.startsWith('/auth')) {
    if (isAuth0Configured()) {
      try {
        return await auth0.middleware(request);
      } catch (err) {
        console.error('Auth0 middleware error:', err);
      }
    }
    return NextResponse.next();
  }

  // 3. Server-side Route Guard for protected application pages
  const isProtected = protectedPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  if (isProtected && isAuth0Configured()) {
    try {
      const session = await auth0.getSession(request);
      if (!session || !session.user) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Default passthrough for other routes and API endpoints
  if (isAuth0Configured()) {
    try {
      return await auth0.middleware(request);
    } catch (err) {
      console.error('Auth0 middleware session sync error:', err);
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
