/**
 * Centralized Authentication Middleware
 * 
 * Provides consistent authentication patterns across all API routes
 * following CLAUDE.md standards
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { CommonErrors } from '@/lib/utils/api-response';
import type { User } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  credits: number;
  isActive: boolean;
  isPremium: boolean;
}

export interface AuthResult {
  user: AuthenticatedUser;
  isValid: boolean;
}

/**
 * Get current authenticated user from Clerk
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        credits: true,
        isActive: true,
        isPremium: true,
      },
    });

    return user;
  } catch (error) {
    console.error('[AUTH] Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication and return user or throw error response
 * Use this in API routes that require authentication
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (!user.isActive) {
    throw new Error('Forbidden');
  }

  return user;
}

/**
 * Get current authenticated user with full database details
 * Includes relations for dashboard/admin operations
 */
export async function getCurrentUserWithDetails(): Promise<User | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    return user;
  } catch (error) {
    console.error('[AUTH] Error getting current user with details:', error);
    return null;
  }
}

/**
 * Require authentication and return full user details
 */
export async function requireAuthWithDetails(): Promise<User> {
  const user = await getCurrentUserWithDetails();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (!user.isActive) {
    throw new Error('Forbidden');
  }

  return user;
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function requireCredits(
  userId: string, 
  requiredCredits: number
): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw CommonErrors.unauthorized();
    }

    if (user.credits < requiredCredits) {
      throw CommonErrors.insufficientCredits();
    }

    return true;
  } catch (error) {
    console.error('[AUTH] Error checking credits:', error);
    throw error;
  }
}

/**
 * Admin authentication check
 * Verifies user is admin (implement based on your admin logic)
 */
export async function requireAdminAuth(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  // Get Clerk user to check for admin role
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw CommonErrors.unauthorized();
  }

  // Check if user has admin role in Clerk metadata
  const isAdmin = clerkUser.publicMetadata?.role === 'admin' || 
                  clerkUser.privateMetadata?.role === 'admin';

  if (!isAdmin) {
    throw CommonErrors.forbidden();
  }

  return user;
}

/**
 * Update user's last active timestamp
 * Call this in frequently used API routes to track user activity
 */
export async function updateLastActive(userId: string): Promise<void> {
  try {
    await db.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  } catch (error) {
    // Don't throw error for this non-critical operation
    console.error('[AUTH] Error updating last active:', error);
  }
}

/**
 * Deduct credits from user account with transaction safety
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  relatedAnalysisId?: string,
  relatedImprovementId?: string,
  relatedImprovedResumeId?: string
): Promise<{ success: boolean; remainingCredits: number }> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Check current credits
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      if (user.credits < amount) {
        throw new Error('Insufficient credits');
      }

      // Deduct credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          credits: { decrement: amount },
          totalCreditsUsed: { increment: amount },
        },
        select: { credits: true },
      });

      // Log the transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'ANALYSIS_USE', // or 'IMPROVEMENT_USE' based on context
          amount: -amount, // Negative for deductions
          description,
          relatedAnalysisId,
          relatedImprovementId,
          relatedImprovedResumeId,
        },
      });

      return { remainingCredits: updatedUser.credits };
    });

    return { success: true, remainingCredits: result.remainingCredits };
  } catch (error) {
    console.error('[AUTH] Error deducting credits:', error);
    
    if (error instanceof Error && error.message === 'Insufficient credits') {
      throw CommonErrors.insufficientCredits();
    }
    
    throw CommonErrors.databaseError();
  }
}

/**
 * Check if user exists in database and create if missing (for webhooks)
 */
export async function ensureUserExists(clerkId: string): Promise<User> {
  try {
    // First, try to find existing user
    let user = await db.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      return user;
    }

    // User doesn't exist, get details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser || clerkUser.id !== clerkId) {
      throw new Error('Clerk user not found or ID mismatch');
    }

    // Create new user
    user = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber,
        credits: 5, // Default free credits
      },
    });

    return user;
  } catch (error) {
    console.error('[AUTH] Error ensuring user exists:', error);
    throw CommonErrors.databaseError();
  }
}

/**
 * Wrapper for API handlers that require authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requireAuth();
      
      // Update last active timestamp
      updateLastActive(user.id).catch(() => {
        // Ignore errors for non-critical operation
      });
      
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      throw error;
    }
  };
}

/**
 * Wrapper for API handlers that require admin authentication
 */
export function withAdminAuth<T extends unknown[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requireAdminAuth();
      
      // Update last active timestamp
      updateLastActive(user.id).catch(() => {
        // Ignore errors for non-critical operation
      });
      
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      throw error;
    }
  };
}