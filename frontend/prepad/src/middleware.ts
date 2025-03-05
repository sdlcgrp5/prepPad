// middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes should be protected
const protectedRoutes = ['/resumeupload'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the requested route should be protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    // If there's no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Verify token
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      
      // Token is valid, continue to the protected route
      return NextResponse.next();
    } catch (error) {
      // Log the error for debugging purposes
      console.error('JWT verification failed:', error);

      // Token verification failed, redirect to login
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // If this is not a protected route, just continue
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