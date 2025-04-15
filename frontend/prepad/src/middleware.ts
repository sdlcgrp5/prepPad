// middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes should be protected
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/resumeupload',
  '/resume'
];

// Public routes that should redirect to dashboard if user is authenticated
const publicOnlyRoutes = [
  '/',
  '/signin'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Check if the requested route should be protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname === route);
  
  // If there's no token and the route is protected, redirect to login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  // If there is a token
  if (token) {
    try {
      // Verify token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      // If the user is on a public-only route (like signin) and is authenticated,
      // redirect them to the dashboard
      if (isPublicOnlyRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Token is valid and route is protected, attach user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.id as string);
      requestHeaders.set('x-user-email', payload.email as string);
      
      // Continue to the protected route with user info attached
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('JWT verification failed:', error);
      
      // If on a protected route with invalid token, redirect to login
      if (isProtectedRoute) {
        // Clear the invalid token cookie
        const response = NextResponse.redirect(new URL('/signin', request.url));
        response.cookies.delete('auth_token');
        response.cookies.delete('user');
        return response;
      }
    }
  }
  
  // For all other cases, continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - static files (e.g. /favicon.ico, /images/*)
     * - public assets (/_next/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};