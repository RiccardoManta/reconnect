// Export the middleware function provided by next-auth
export { default } from "next-auth/middleware"

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
     * - login (if you had a custom login page at /login)
     * - signup (if you had a custom signup page at /signup)
     * You might want to exclude other public pages here too.
     */
    // Protect the root route, database route, and admin route
    '/', 
    '/database/:path*', // Protect /database and any sub-paths
    '/admin/:path*',    // Protect /admin and any sub-paths
    // Add other routes to protect here, e.g.: 
    // '/dashboard/:path*',
    // '/profile',
  ],
}; 