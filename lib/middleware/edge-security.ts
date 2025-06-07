import { NextRequest } from 'next/server';

// Rate limiting for payment endpoints
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10; // Max requests per window

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

// Utility to get client IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  return '127.0.0.1'; // Fallback
}

// Request logging for Edge Runtime
export interface PaymentRequestLog {
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: number;
  userId?: string;
  success: boolean;
  error?: string;
}

const requestLogs: PaymentRequestLog[] = [];
const MAX_LOGS = 1000;

export function logPaymentRequest(log: PaymentRequestLog) {
  requestLogs.unshift(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.splice(MAX_LOGS);
  }
}

export function getRecentPaymentLogs(limit: number = 50): PaymentRequestLog[] {
  return requestLogs.slice(0, limit);
}

// Sanitize user input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000); // Limit string length
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === 'string' && key.length <= 100) {
        sanitized[key] = sanitizeInput(value);
      }
    }
    return sanitized;
  }
  return input;
} 