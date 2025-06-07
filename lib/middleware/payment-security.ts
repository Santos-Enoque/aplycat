// lib/middleware/payment-security.ts
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';

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

// Webhook signature verification using Node.js crypto
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// Input validation schemas
export const createCheckoutSchema = z.object({
  packageType: z.enum(['starter', 'professional', 'premium']),
});

export const webhookSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    test_mode: z.boolean(),
    webhook_id: z.string(),
    custom_data: z.object({
      userId: z.string(),
      packageType: z.enum(['starter', 'professional', 'premium']),
      credits: z.number().positive(),
    }).optional(),
  }),
  data: z.object({
    id: z.string(),
    type: z.literal('orders'),
    attributes: z.object({
      store_id: z.number(),
      customer_id: z.number(),
      identifier: z.string(),
      order_number: z.number(),
      user_name: z.string(),
      user_email: z.string().email(),
      currency: z.string(),
      total: z.number(),
      status: z.enum(['pending', 'paid', 'void', 'refunded', 'partial_refund']),
      first_order_item: z.object({
        variant_id: z.number(),
        product_name: z.string(),
        variant_name: z.string(),
        price: z.number(),
      }),
    }),
  }),
});

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

// Request logging
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

// Error handling and monitoring
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export function handlePaymentError(error: unknown, context: string): PaymentError {
  console.error(`[PAYMENT_ERROR] ${context}:`, error);

  if (error instanceof PaymentError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new PaymentError(
      'Invalid request data',
      'VALIDATION_ERROR',
      400,
      error.errors
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      return new PaymentError(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_ERROR',
        429
      );
    }

    if (error.message.includes('unauthorized')) {
      return new PaymentError(
        'Unauthorized access',
        'AUTH_ERROR',
        401
      );
    }

    return new PaymentError(
      error.message,
      'UNKNOWN_ERROR',
      500
    );
  }

  return new PaymentError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  );
}

// Environment validation
export function validatePaymentEnvironment() {
  const requiredEnvVars = [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_STARTER_VARIANT_ID',
    'LEMONSQUEEZY_PROFESSIONAL_VARIANT_ID',
    'LEMONSQUEEZY_PREMIUM_VARIANT_ID',
  ];

  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate API key format
  const apiKey = process.env.LEMONSQUEEZY_API_KEY!;
  if (!apiKey.startsWith('lmsq_sk_')) {
    throw new Error('Invalid Lemon Squeezy API key format');
  }

  // Validate webhook secret format
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  if (webhookSecret.length < 32) {
    throw new Error('Webhook secret must be at least 32 characters long');
  }
}

// Initialize payment security on startup
export function initializePaymentSecurity() {
  try {
    validatePaymentEnvironment();
    console.log('[PAYMENT_SECURITY] Environment validation passed');
  } catch (error) {
    console.error('[PAYMENT_SECURITY] Environment validation failed:', error);
    throw error;
  }
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

// Database connection health check for payment operations
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[PAYMENT_SECURITY] Database health check failed:', error);
    return false;
  }
}