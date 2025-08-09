import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Rate limiting constants
const RATE_LIMIT_MAX_REQUESTS = 4;
const RATE_LIMIT_WINDOW_HOURS = 24;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  error?: string;
}

/**
 * Get the client IP address from the request
 */
function getClientIp(request: NextRequest): string {
  // Try various headers for IP address (for different proxy configurations)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback to a default IP (shouldn't happen in production)
  return 'unknown';
}

/**
 * Check if a user/IP has exceeded the rate limit for analysis requests
 */
export async function checkRateLimit(
  request: NextRequest,
  userId?: number
): Promise<RateLimitResult> {
  try {
    const ipAddress = getClientIp(request);
    const now = new Date();
    const windowStart = new Date(now.getTime() - (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    
    // First priority: Check by user ID if authenticated
    if (userId) {
      const userRateLimit = await prisma.rateLimit.findUnique({
        where: { userId }
      });
      
      if (userRateLimit) {
        // Check if the window has expired
        if (userRateLimit.windowStart < windowStart) {
          // Reset the rate limit window
          await prisma.rateLimit.update({
            where: { userId },
            data: {
              requestCount: 1,
              windowStart: now,
              updatedAt: now
            }
          });
          
          return {
            allowed: true,
            remaining: RATE_LIMIT_MAX_REQUESTS - 1,
            resetTime: new Date(now.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000))
          };
        }
        
        // Check if user has exceeded the limit
        if (userRateLimit.requestCount >= RATE_LIMIT_MAX_REQUESTS) {
          const resetTime = new Date(
            userRateLimit.windowStart.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
          );
          
          return {
            allowed: false,
            remaining: 0,
            resetTime,
            error: `Rate limit exceeded. You can make ${RATE_LIMIT_MAX_REQUESTS} analysis requests every ${RATE_LIMIT_WINDOW_HOURS} hours. Try again after ${resetTime.toLocaleString()}.`
          };
        }
        
        // User is within limits
        return {
          allowed: true,
          remaining: RATE_LIMIT_MAX_REQUESTS - userRateLimit.requestCount,
          resetTime: new Date(
            userRateLimit.windowStart.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
          )
        };
      }
    }
    
    // Fallback: Check by IP address for unauthenticated users or new authenticated users
    const ipRateLimit = await prisma.rateLimit.findUnique({
      where: { ipAddress }
    });
    
    if (ipRateLimit) {
      // Check if the window has expired
      if (ipRateLimit.windowStart < windowStart) {
        // Reset the rate limit window
        await prisma.rateLimit.update({
          where: { ipAddress },
          data: {
            requestCount: 1,
            windowStart: now,
            updatedAt: now
          }
        });
        
        return {
          allowed: true,
          remaining: RATE_LIMIT_MAX_REQUESTS - 1,
          resetTime: new Date(now.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000))
        };
      }
      
      // Check if IP has exceeded the limit
      if (ipRateLimit.requestCount >= RATE_LIMIT_MAX_REQUESTS) {
        const resetTime = new Date(
          ipRateLimit.windowStart.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
        );
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          error: `Rate limit exceeded. You can make ${RATE_LIMIT_MAX_REQUESTS} analysis requests every ${RATE_LIMIT_WINDOW_HOURS} hours. Try again after ${resetTime.toLocaleString()}.`
        };
      }
      
      // IP is within limits
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - ipRateLimit.requestCount,
        resetTime: new Date(
          ipRateLimit.windowStart.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
        )
      };
    }
    
    // No existing rate limit record - this is the first request
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: new Date(now.getTime() + (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000))
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    // In case of database error, allow the request but log the issue
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: new Date(),
      error: 'Rate limit check failed'
    };
  }
}

/**
 * Increment the rate limit counter after a successful analysis
 */
export async function incrementRateLimit(
  request: NextRequest,
  userId?: number
): Promise<void> {
  try {
    const ipAddress = getClientIp(request);
    const now = new Date();
    
    // First priority: Update by user ID if authenticated
    if (userId) {
      const existingUserRateLimit = await prisma.rateLimit.findUnique({
        where: { userId }
      });
      
      if (existingUserRateLimit) {
        // Update existing user rate limit
        await prisma.rateLimit.update({
          where: { userId },
          data: {
            requestCount: { increment: 1 },
            updatedAt: now
          }
        });
        return;
      } else {
        // Create new user rate limit record
        await prisma.rateLimit.create({
          data: {
            userId,
            requestCount: 1,
            windowStart: now,
            createdAt: now,
            updatedAt: now
          }
        });
        return;
      }
    }
    
    // Fallback: Update by IP address
    const existingIpRateLimit = await prisma.rateLimit.findUnique({
      where: { ipAddress }
    });
    
    if (existingIpRateLimit) {
      // Update existing IP rate limit
      await prisma.rateLimit.update({
        where: { ipAddress },
        data: {
          requestCount: { increment: 1 },
          updatedAt: now
        }
      });
    } else {
      // Create new IP rate limit record
      await prisma.rateLimit.create({
        data: {
          ipAddress,
          requestCount: 1,
          windowStart: now,
          createdAt: now,
          updatedAt: now
        }
      });
    }
    
  } catch (error) {
    console.error('Rate limit increment error:', error);
    // Don't throw error to avoid breaking the analysis flow
  }
}

/**
 * Clean up expired rate limit records (should be run periodically)
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    
    const deleted = await prisma.rateLimit.deleteMany({
      where: {
        windowStart: {
          lt: cutoffTime
        }
      }
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${deleted.count} expired rate limit records`);
    }
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}