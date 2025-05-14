// Export the middleware function provided by next-auth
import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Use withAuth for better customization
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Returns true if the user is authenticated
    },
    pages: {
      signIn: '/auth/login-signup', // Use a relative path that works with any base URL
    },
  }
);

// Define which routes should be protected by the middleware
// See https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (login/signup pages)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth|logo.png|manifest.json).*)',
  ],
}; 