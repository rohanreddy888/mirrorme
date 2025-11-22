import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = ['/']

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/chat']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if user has CDP authentication cookie/session
  // CDP typically stores authentication data in cookies or localStorage
  // We'll check for the CDP session cookie
  const cdpSession = request.cookies.get('cdp-session')
  const cdpAuth = request.cookies.get('cdp-auth-token')
  
  // Consider user authenticated if either cookie exists
  const isAuthenticated = !!(cdpSession || cdpAuth)
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Redirect unauthenticated users from protected routes to home page
  if (isProtectedRoute && !isAuthenticated) {
    const homeUrl = new URL('/', request.url)
    homeUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(homeUrl)
  }
  
  return NextResponse.next()
}

// Configure which routes should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}

