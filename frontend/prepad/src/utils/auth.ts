import { NextRequest } from 'next/server';
import jwt, {Secret} from 'jsonwebtoken';
import { auth } from '../../auth';

// User interface representing the JWT token payload
export interface TokenUser {
  id: number;
  email: string;
  iat: number;
  exp: number;
  // Support both formats for compatibility
  user_id?: number;
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

    // Check if this is a 'nextauth' placeholder token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (token === 'nextauth') {
      
      // For nextauth users, try to get user data from request body or headers
      let userData = null;
      
      // Try to extract user data from a custom header (if the frontend sends it)
      const userHeader = request.headers.get('X-User-Data');
      if (userHeader) {
        try {
          userData = JSON.parse(userHeader);
        } catch (e) {
          // Ignore header parsing errors
        }
      }
      
      // If header approach fails, try to parse request body to look for user info
      if (!userData) {
        try {
          // Try to parse as FormData first (for file uploads)
          const clonedRequest = request.clone();
          try {
            const formData = await clonedRequest.formData();
            const userId = formData.get('userId');
            const userEmail = formData.get('userEmail');
            
            if (userId && userEmail) {
              userData = {
                id: Number(userId),
                email: userEmail.toString()
              };
            }
          } catch (formError) {
            // If FormData parsing fails, try JSON
            const clonedRequest2 = request.clone();
            const body = await clonedRequest2.json();
            
            // Look for user data in the request body
            if (body.userId && body.userEmail) {
              userData = {
                id: Number(body.userId),
                email: body.userEmail
              };
            }
          }
        } catch (e) {
          // Ignore parsing errors - no user data available
        }
      }
      
      if (userData && userData.id && userData.email) {
        const userResponse = {
          id: Number(userData.id),
          email: userData.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        return userResponse;
      }
    }

    // Fallback to NextAuth session (this might not work in API routes)
    let session = null;
    try {
      session = await auth();
    } catch (error) {
      // NextAuth session not available in API route context
    }
    
    if (session?.user?.id && session?.user?.email) {
      const userId = Number(session.user.id);
      
      if (!isNaN(userId)) {
        const userData = {
          id: userId,
          email: session.user.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        return userData;
      }
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
    
    const decoded = jwt.verify(token, secret) as any;
    
    // Handle both 'id' and 'user_id' formats for compatibility
    const userId = decoded.id || decoded.user_id;
    if (!userId) {
      console.error('JWT token missing user ID field (both id and user_id are undefined)');
      return null;
    }
    
    return {
      id: Number(userId),
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
      user_id: decoded.user_id
    };
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