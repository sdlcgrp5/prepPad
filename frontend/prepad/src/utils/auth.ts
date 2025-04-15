import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// User interface representing the JWT token payload
export interface TokenUser {
  id: number;
  email: string;
  iat: number;
  exp: number;
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
    
    // Verify and decode the token
    const secret = process.env.JWT_SECRET as string;
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
  const secret = process.env.JWT_SECRET as string;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
}

/**
 * Checks if a token is expired
 * @param token - The JWT token to check
 * @returns Boolean indicating if the token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const decoded = jwt.verify(token, secret) as TokenUser;
    const currentTime = Math.floor(Date.now() / 1000);
    
    return decoded.exp < currentTime;
  } catch (error) {
    // If verification fails, consider the token expired
    return true;
  }
}