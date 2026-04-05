import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Private members can only access their own page and API
    if (token?.role === 'PRIVATE_MEMBER') {
      const allowedPaths = ['/private/me', '/api/private', '/api/upload', '/api/fleet', '/settings'];
      const isAllowed = allowedPaths.some((p) => path.startsWith(p));

      if (!isAllowed && !path.startsWith('/api/auth')) {
        return NextResponse.redirect(new URL('/private/me', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/fleet/:path*',
    '/crushers/:path*',
    '/commercial/:path*',
    '/private/:path*',
    '/settings/:path*',
    '/api/fleet/:path*',
    '/api/crushers/:path*',
    '/api/commercial/:path*',
    '/api/private/:path*',
    '/api/dashboard/:path*',
    '/api/settings/:path*',
    '/api/upload/:path*',
  ],
};
