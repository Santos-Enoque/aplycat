'use server';

import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardCache } from './dashboard-actions';
import { getCachedData, cacheKeys, cacheTTL, dashboardCache } from '@/lib/redis-cache';

// Type definitions
export interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  credits: number;
  isPremium: boolean;
  totalCreditsUsed: number;
  createdAt: Date;
  lastActiveAt: Date;
}

/**
 * Get user's credit transactions with pagination
 */
export async function getUserCreditTransactions(
  limit: number = 10,
  offset: number = 0
): Promise<{ transactions: CreditTransaction[]; total: number } | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.userTransactions(user.id, limit, offset),
      async () => {
        const [transactions, total] = await Promise.all([
          db.creditTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              type: true,
              amount: true,
              description: true,
              createdAt: true,
            },
          }),
          db.creditTransaction.count({
            where: { userId: user.id },
          }),
        ]);

        return { transactions, total };
      },
      cacheTTL.userTransactions
    );
  } catch (error) {
    console.error('[USER_ACTIONS] Error getting credit transactions:', error);
    return null;
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.userProfile(user.id),
      async () => {
        const profile = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            credits: true,
            isPremium: true,
            totalCreditsUsed: true,
            createdAt: true,
            lastActiveAt: true,
          },
        });

        return profile;
      },
      cacheTTL.userProfile
    );
  } catch (error) {
    console.error('[USER_ACTIONS] Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  firstName?: string,
  lastName?: string
): Promise<boolean> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return false;

    await db.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        updatedAt: new Date(),
      },
    });

    // Invalidate caches
    await dashboardCache.invalidateUser(user.id);
    revalidatePath('/dashboard');
    revalidatePath('/profile');

    return true;
  } catch (error) {
    console.error('[USER_ACTIONS] Error updating user profile:', error);
    return false;
  }
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkUserCredits(requiredCredits: number): Promise<boolean> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return false;

    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    return (userData?.credits || 0) >= requiredCredits;
  } catch (error) {
    console.error('[USER_ACTIONS] Error checking user credits:', error);
    return false;
  }
}

/**
 * Deduct credits from user account
 */
export async function deductUserCredits(
  amount: number,
  description: string,
  type: 'ANALYSIS_USE' | 'IMPROVEMENT_USE',
  relatedId?: string
): Promise<boolean> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return false;

    // Check if user has enough credits
    const hasCredits = await checkUserCredits(amount);
    if (!hasCredits) return false;

    // Deduct credits in a transaction
    await db.$transaction(async (tx) => {
      // Update user credits
      await tx.user.update({
        where: { id: user.id },
        data: {
          credits: { decrement: amount },
          totalCreditsUsed: { increment: amount },
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type,
          amount: -amount, // Negative for deduction
          description,
          relatedAnalysisId: type === 'ANALYSIS_USE' ? relatedId : undefined,
          relatedImprovementId: type === 'IMPROVEMENT_USE' ? relatedId : undefined,
        },
      });
    });

    // Invalidate caches
    await dashboardCache.invalidateUser(user.id);
    revalidatePath('/dashboard');

    return true;
  } catch (error) {
    console.error('[USER_ACTIONS] Error deducting credits:', error);
    return false;
  }
}

/**
 * Add credits to user account
 */
export async function addUserCredits(
  amount: number,
  description: string,
  type: 'BONUS_CREDIT' | 'PURCHASE' | 'SUBSCRIPTION_CREDIT' | 'REFUND' = 'PURCHASE'
): Promise<boolean> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return false;

    // Add credits in a transaction
    await db.$transaction(async (tx) => {
      // Update user credits
      await tx.user.update({
        where: { id: user.id },
        data: {
          credits: { increment: amount },
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type,
          amount, // Positive for addition
          description,
        },
      });
    });

    // Invalidate caches
    await dashboardCache.invalidateUser(user.id);
    revalidatePath('/dashboard');

    return true;
  } catch (error) {
    console.error('[USER_ACTIONS] Error adding credits:', error);
    return false;
  }
}

/**
 * Update user's last active timestamp
 */
export async function updateUserActivity(): Promise<void> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return;

    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
  } catch (error) {
    console.error('[USER_ACTIONS] Error updating user activity:', error);
  }
} 