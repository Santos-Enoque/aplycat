/**
 * Centralized API Response Utilities
 * 
 * Provides consistent response formatting across all API routes
 * following CLAUDE.md standards
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Common error responses with predefined messages and status codes
 */
export const CommonErrors = {
  // Authentication & Authorization (400-403)
  unauthorized: () => createErrorResponse(
    'Authentication required',
    401,
    'UNAUTHORIZED'
  ),
  
  forbidden: () => createErrorResponse(
    'Insufficient permissions',
    403,
    'FORBIDDEN'
  ),
  
  invalidAuth: () => createErrorResponse(
    'Invalid authentication credentials',
    401,
    'INVALID_AUTH'
  ),

  // Validation (400, 422)
  invalidInput: (details?: unknown) => createErrorResponse(
    'Invalid input provided',
    400,
    'INVALID_INPUT',
    details
  ),
  
  missingFields: (fields: string[]) => createErrorResponse(
    `Missing required fields: ${fields.join(', ')}`,
    400,
    'MISSING_FIELDS',
    { missingFields: fields }
  ),
  
  validationError: (details: unknown) => createErrorResponse(
    'Validation failed',
    422,
    'VALIDATION_ERROR',
    details
  ),

  // Resources (404, 409)
  notFound: (resource?: string) => createErrorResponse(
    resource ? `${resource} not found` : 'Resource not found',
    404,
    'NOT_FOUND'
  ),
  
  alreadyExists: (resource?: string) => createErrorResponse(
    resource ? `${resource} already exists` : 'Resource already exists',
    409,
    'ALREADY_EXISTS'
  ),

  // Rate limiting (429)
  rateLimited: (retryAfter?: number) => {
    const response = createErrorResponse(
      'Rate limit exceeded',
      429,
      'RATE_LIMITED'
    );
    
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }
    
    return response;
  },

  // Credits & Billing (402, 403)
  insufficientCredits: () => createErrorResponse(
    'Insufficient credits to perform this action',
    402,
    'INSUFFICIENT_CREDITS'
  ),
  
  paymentRequired: () => createErrorResponse(
    'Payment required to access this feature',
    402,
    'PAYMENT_REQUIRED'
  ),

  // Server errors (500-503)
  internalError: (details?: unknown) => createErrorResponse(
    'Internal server error',
    500,
    'INTERNAL_ERROR',
    details
  ),
  
  serviceUnavailable: (service?: string) => createErrorResponse(
    service ? `${service} is currently unavailable` : 'Service temporarily unavailable',
    503,
    'SERVICE_UNAVAILABLE'
  ),
  
  databaseError: () => createErrorResponse(
    'Database operation failed',
    500,
    'DATABASE_ERROR'
  ),

  // Method not allowed (405)
  methodNotAllowed: (allowedMethods: string[]) => {
    const response = createErrorResponse(
      'Method not allowed',
      405,
      'METHOD_NOT_ALLOWED',
      { allowedMethods }
    );
    response.headers.set('Allow', allowedMethods.join(', '));
    return response;
  },
} as const;

/**
 * Handles and formats errors consistently across API routes
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  // Log the error for debugging
  console.error(`[API_ERROR${context ? ` ${context}` : ''}]:`, error);

  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('Unauthorized')) {
      return CommonErrors.unauthorized();
    }
    
    if (error.message.includes('Not found')) {
      return CommonErrors.notFound();
    }
    
    if (error.message.includes('already exists')) {
      return CommonErrors.alreadyExists();
    }
    
    if (error.message.includes('Insufficient credits')) {
      return CommonErrors.insufficientCredits();
    }
    
    if (error.message.includes('Rate limit')) {
      return CommonErrors.rateLimited();
    }
    
    // Generic error with message
    return createErrorResponse(
      error.message,
      500,
      'ERROR'
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return createErrorResponse(error, 500, 'ERROR');
  }

  // Default internal server error
  return CommonErrors.internalError();
}

/**
 * Utility to validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  return requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });
}

/**
 * Wrapper for API route handlers with consistent error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}