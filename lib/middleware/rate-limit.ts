/**
 * Redis-based Rate Limiting Middleware
 * 
 * Provides scalable rate limiting across multiple server instances
 * using Redis as the backend store
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-cache';
import { CommonErrors } from '@/lib/utils/api-response';

export interface RateLimitOptions {
  /** Maximum number of requests allowed */
  max: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Unique identifier for the rate limit (e.g., 'api:analyze', 'api:improve') */
  keyPrefix: string;
  /** Skip rate limiting for certain conditions */
  skip?: (request: NextRequest) => boolean | Promise<boolean>;
  /** Custom message for rate limit exceeded */
  message?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count */
  count: number;
  /** Maximum requests allowed */
  limit: number;
  /** Time until reset in seconds */
  resetTime: number;
  /** Remaining requests */
  remaining: number;
}

/**
 * Create a rate limiter function with the specified options
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { max, windowSeconds, keyPrefix, skip, message } = options;

  return async function rateLimiter(
    request: NextRequest,
    identifier?: string
  ): Promise<{ allowed: boolean; response?: NextResponse }> {
    try {
      // Check if we should skip rate limiting
      if (skip && await skip(request)) {
        return { allowed: true };
      }

      // Generate rate limit key
      const key = await generateRateLimitKey(request, keyPrefix, identifier);
      
      // Check rate limit
      const result = await checkRateLimit(key, max, windowSeconds);

      if (!result.allowed) {
        const response = CommonErrors.rateLimited(result.resetTime);
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + result.resetTime).toString());
        
        // Note: Custom message override would require creating a new response
        // For now, we use the default message from CommonErrors.rateLimited

        return { allowed: false, response };
      }

      return { allowed: true };
    } catch (error) {
      console.error('[RATE_LIMIT] Error checking rate limit:', error);
      // Fail open - allow the request if Redis is down
      return { allowed: true };
    }
  };
}

/**
 * Generate a unique rate limit key for the request
 */
async function generateRateLimitKey(
  request: NextRequest,
  keyPrefix: string,
  identifier?: string
): Promise<string> {
  if (identifier) {
    return `rate_limit:${keyPrefix}:${identifier}`;
  }

  // Try to get user ID from headers or IP as fallback
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `rate_limit:${keyPrefix}:user:${userId}`;
  }

  // Fall back to IP address
  const ip = getClientIP(request);
  return `rate_limit:${keyPrefix}:ip:${ip}`;
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSeconds) * windowSeconds;
  const windowKey = `${key}:${window}`;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    
    // Increment counter
    pipeline.incr(windowKey);
    
    // Set expiration if this is the first request in the window
    pipeline.expire(windowKey, windowSeconds);
    
    // Execute pipeline
    const results = await pipeline.exec();
    
    if (!results || results.length < 1) {
      throw new Error('Redis pipeline failed');
    }
    
    const count = results[0][1] as number;
    const resetTime = windowSeconds - (now - window);
    const remaining = Math.max(0, max - count);
    const allowed = count <= max;

    return {
      allowed,
      count,
      limit: max,
      resetTime,
      remaining,
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Redis error:', error);
    
    // Fallback to in-memory rate limiting if Redis fails
    return await fallbackRateLimit(key, max, windowSeconds);
  }
}

/**
 * Fallback in-memory rate limiting (not recommended for production)
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

async function fallbackRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const window = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
  const windowKey = `${key}:${window}`;
  
  const existing = memoryStore.get(windowKey);
  const count = existing ? existing.count + 1 : 1;
  
  memoryStore.set(windowKey, {
    count,
    resetTime: window + windowSeconds * 1000,
  });
  
  // Clean up old entries
  for (const [memKey, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(memKey);
    }
  }
  
  const resetTime = Math.ceil((window + windowSeconds * 1000 - now) / 1000);
  const remaining = Math.max(0, max - count);
  const allowed = count <= max;

  return {
    allowed,
    count,
    limit: max,
    resetTime,
    remaining,
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP if there are multiple
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default value
  return 'unknown';
}

/**
 * Common rate limit configurations
 */
export const RateLimitPresets = {
  // AI Analysis endpoints (expensive operations)
  analysis: {
    max: 10,
    windowSeconds: 60, // 10 requests per minute
    keyPrefix: 'api:analysis',
    message: 'Too many analysis requests. Please wait before trying again.',
  },

  // Free analysis (more restrictive)
  freeAnalysis: {
    max: 3,
    windowSeconds: 60, // 3 requests per minute
    keyPrefix: 'api:free-analysis',
    message: 'Rate limit exceeded for free analysis. Please upgrade or wait.',
  },

  // Resume improvement (very expensive)
  improvement: {
    max: 5,
    windowSeconds: 120, // 5 requests per 2 minutes
    keyPrefix: 'api:improvement',
    message: 'Too many improvement requests. Please wait before trying again.',
  },

  // Payment endpoints
  payment: {
    max: 5,
    windowSeconds: 60, // 5 payment attempts per minute
    keyPrefix: 'api:payment',
    message: 'Too many payment attempts. Please wait before trying again.',
  },

  // File uploads
  upload: {
    max: 20,
    windowSeconds: 60, // 20 uploads per minute
    keyPrefix: 'api:upload',
    message: 'Too many upload requests. Please wait before trying again.',
  },

  // General API rate limit
  general: {
    max: 100,
    windowSeconds: 60, // 100 requests per minute
    keyPrefix: 'api:general',
    message: 'Rate limit exceeded. Please slow down your requests.',
  },
} as const;

/**
 * Rate limiting middleware for specific operations
 */
export const rateLimiters = {
  analysis: createRateLimiter(RateLimitPresets.analysis),
  freeAnalysis: createRateLimiter(RateLimitPresets.freeAnalysis),
  improvement: createRateLimiter(RateLimitPresets.improvement),
  payment: createRateLimiter(RateLimitPresets.payment),
  upload: createRateLimiter(RateLimitPresets.upload),
  general: createRateLimiter(RateLimitPresets.general),
};

/**
 * Helper function to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + result.resetTime).toString());
  
  return response;
}