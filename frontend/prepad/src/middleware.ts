// middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { auth } from '../auth';

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
  
  // Get the JWT token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Check for NextAuth session
  const session = await auth();
  
  // Check if the requested route should be protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname === route);
  
  // Add debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE]', {
      pathname,
      hasJWT: !!token,
      hasNextAuthSession: !!session?.user,
      userEmail: session?.user?.email || 'none',
      isProtectedRoute,
      isPublicOnlyRoute
    });
  }
  
  // Check if user is authenticated (either JWT or NextAuth session)
  const isAuthenticated = !!token || !!session?.user;
  
  // If there's no authentication and the route is protected, redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MIDDLEWARE] No authentication found, redirecting to signin');
    }
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  // If user is authenticated, handle accordingly
  if (isAuthenticated) {
    // If the user is on a public-only route (like signin) and is authenticated,
    // redirect them to the dashboard
    if (isPublicOnlyRoute) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[MIDDLEWARE] Authenticated user on public route, redirecting to dashboard');
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Handle JWT token authentication
    if (token) {
      try {
        // Verify token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        
        // Token is valid and route is protected, attach user info to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.id as string);
        requestHeaders.set('x-user-email', payload.email as string);
        requestHeaders.set('x-auth-method', 'jwt');
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[MIDDLEWARE] JWT authenticated, continuing to protected route');
        }
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        console.error('[MIDDLEWARE] JWT verification failed:', error);
        
        // If NextAuth session exists, continue with that instead
        if (session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[MIDDLEWARE] JWT failed but NextAuth session exists, continuing');
          }
        } else {
          // If on a protected route with invalid token and no NextAuth session, redirect to login
          if (isProtectedRoute) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[MIDDLEWARE] Invalid JWT and no NextAuth session, redirecting to signin');
            }
            const response = NextResponse.redirect(new URL('/signin', request.url));
            response.cookies.delete('auth_token');
            response.cookies.delete('user');
            return response;
          }
        }
      }
    }
    
    // Handle NextAuth session authentication
    if (session?.user) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', session.user.id as string);
      requestHeaders.set('x-user-email', session.user.email as string);
      requestHeaders.set('x-auth-method', 'nextauth');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[MIDDLEWARE] NextAuth authenticated, continuing to protected route');
      }
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
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