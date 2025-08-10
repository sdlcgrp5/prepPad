import { NextRequest } from 'next/server';
import jwt, {Secret} from 'jsonwebtoken';
import { auth } from '../../auth';

// User interface representing the JWT token payload
export interface TokenUser {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Hybrid authentication function that supports both JWT and NextAuth sessions
 * @param request - The Next.js request object
 * @returns The user data from either JWT or NextAuth session, or null if neither is valid
 */
export async function getHybridAuthData(request: NextRequest): Promise<TokenUser | null> {
  try {
    // First, try JWT token authentication
    const jwtUser = getTokenData(request);
    if (jwtUser) {
      return jwtUser;
    }

    // Fallback to NextAuth session
    const session = await auth();
    if (session?.user?.id && session?.user?.email) {
      return {
        id: Number(session.user.id),
        email: session.user.email,
        iat: Math.floor(Date.now() / 1000), // Current timestamp
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
      };
    }

    return null;
  } catch (error) {
    console.error('Hybrid authentication error:', error);
    return null;
  }
}

/**
 * Extracts and validates the JWT token from the request
 * @param request - The Next.js request object
 * @returns The decoded token payload or null if invalid
 */
export function getTokenData(request: NextRequest): TokenUser | null {
  try {
    // Get the token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : request.cookies.get('auth_token')?.value || null;
    
    if (!token) {
      return null;
    }
    
    // Skip JWT validation for NextAuth placeholder tokens
    if (token === 'nextauth') {
      return null; // Let hybrid auth handle this via NextAuth session
    }
    
    // Verify and decode the token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET environment variable is not set');
      return null;
    }
    
    const decoded = jwt.verify(token, secret) as TokenUser;
    return decoded;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Creates a new JWT token for the user
 * @param user - The user object to encode in the token
 * @param expiresIn - Token expiration time (default: 7 days)
 * @returns The generated JWT token
 */
export function createToken(user: { id: number; email: string }, expiresIn = '7d'): string {
   const secret = process.env.JWT_SECRET;
   if (!secret) {
     throw new Error('JWT_SECRET environment variable is not set');
   }
   
   // Generate the token with the user ID and email
   // and set the expiration time
   // Cast the secret to the Secret type
   // to avoid TypeScript errors
   return jwt.sign(
     {
       id: user.id,
       email: user.email,
     },
     secret as Secret, // Explicitly cast the secret to the Secret type
     { expiresIn } as jwt.SignOptions // Ensure expiresIn is correctly typed
   );
 }

/**
 * Checks if a token is expired
 * @param token - The JWT token to check
 * @returns Boolean indicating if the token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const decoded = jwt.verify(token, secret) as TokenUser;
    const currentTime = Math.floor(Date.now() / 1000);
    
    return decoded.exp < currentTime;
  } catch (error) {
    // If verification fails, consider the token expired
    console.error('Token verification error:', error);
    return true;
  }
}