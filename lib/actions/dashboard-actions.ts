'use server';

import { db } from '@/lib/db';
import { getCurrentUserFromDB, getCurrentUserFromDBForAPI } from '@/lib/auth/user-sync';
import { getCachedData, cacheKeys, cacheTTL, dashboardCache } from '@/lib/redis-cache';
import { revalidatePath } from 'next/cache';

// Type definitions for return data
export interface UserEssentials {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  credits: number;
  isPremium: boolean;
  totalCreditsUsed: number;
}

export interface DashboardStats {
  totalAnalyses: number;
  totalImprovements: number;
  totalResumes: number;
  currentCredits: number;
}

export interface RecentActivity {
  recentAnalyses: Array<{
    id: string;
    overallScore: number;
    atsScore: number;
    createdAt: Date;
    resume: {
      fileName: string;
      id: string;
    };
  }>;
  recentImprovements: Array<{
    id: string;
    versionName: string | null;
    targetRole: string | null;
    createdAt: Date;
    improvedScore: number | null;
    originalScore: number | null;
    resume: {
      fileName: string;
      id: string;
    };
  }>;
}

/**
 * Get user essential information (fastest loading)
 */
export async function getUserEssentials(): Promise<UserEssentials | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.userEssentials(user.id),
      async () => {
        const userData = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            credits: true,
            isPremium: true,
            totalCreditsUsed: true,
          },
        });
        return userData;
      },
      cacheTTL.userEssentials
    );
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error getting user essentials:', error);
    return null;
  }
}

/**
 * Get dashboard statistics with caching
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.dashboardStats(user.id),
      async () => {
        const [analysesCount, improvementsCount, resumesCount, userCredits] = await Promise.all([
          db.analysis.count({ 
            where: { userId: user.id, isCompleted: true } 
          }),
          db.improvedResume.count({ 
            where: { userId: user.id, isCompleted: true } 
          }),
          db.resume.count({ 
            where: { userId: user.id, isActive: true } 
          }),
          db.user.findUnique({
            where: { id: user.id },
            select: { credits: true }
          })
        ]);

        return {
          totalAnalyses: analysesCount,
          totalImprovements: improvementsCount,
          totalResumes: resumesCount,
          currentCredits: userCredits?.credits || 0,
        };
      },
      cacheTTL.dashboardStats
    );
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error getting dashboard stats:', error);
    return null;
  }
}

/**
 * Get recent user activity with caching
 */
export async function getRecentActivity(): Promise<RecentActivity | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.recentActivity(user.id),
      async () => {
        const [recentAnalyses, recentImprovements] = await Promise.all([
          db.analysis.findMany({
            where: { userId: user.id, isCompleted: true },
            include: {
              resume: {
                select: { fileName: true, id: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3, // Just show recent 3
          }),
          db.improvedResume.findMany({
            where: { userId: user.id, isCompleted: true },
            select: {
              id: true,
              versionName: true,
              targetRole: true,
              createdAt: true,
              improvedScore: true,
              originalScore: true,
              resume: {
                select: { fileName: true, id: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3, // Just show recent 3
          }),
        ]);

        return { recentAnalyses, recentImprovements };
      },
      cacheTTL.recentActivity
    );
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error getting recent activity:', error);
    return null;
  }
}

/**
 * Get complete dashboard data in one call (for initial load)
 */
export async function getDashboardData() {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) {
      return {
        userEssentials: null,
        stats: null,
        activity: null,
        error: 'User not authenticated'
      };
    }

    // Load user essentials immediately for fast UI update
    const userEssentials = await getUserEssentials();
    
    // Return essentials first, let other data load progressively
    return {
      userEssentials,
      stats: null,
      activity: null,
      error: null
    };
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error getting dashboard data:', error);
    return {
      userEssentials: null,
      stats: null,
      activity: null,
      error: 'Failed to load dashboard data'
    };
  }
}

/**
 * Invalidate dashboard cache (call after user actions)
 */
export async function invalidateDashboardCache(): Promise<void> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return;

    // Clear cache
    await dashboardCache.invalidateUser(user.id);

    // Revalidate dashboard page
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error invalidating cache:', error);
  }
}

/**
 * Get user credit balance (lightweight action)
 */
export async function getUserCredits(): Promise<number> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return 0;

    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true }
    });

    return userData?.credits || 0;
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error getting user credits:', error);
    return 0;
  }
}

/**
 * Get complete dashboard data with full user details (for the polished dashboard)
 */
export async function getCompleteDashboardData() {
  try {
    const user = await getCurrentUserFromDBForAPI();
    if (!user) {
      return null;
    }

    // Fetch comprehensive user data with all relationships
    const userData = await db.user.findUnique({
      where: { id: user.id },
      include: {
        resumes: {
          where: { isActive: true }, // Only include active resumes
          include: {
            analyses: {
              orderBy: { createdAt: "desc" },
              take: 1, // Get latest analysis for each resume
            },
            improvedResumes: {
              orderBy: { createdAt: "desc" },
              take: 1, // Get latest improvement for each resume
            },
          },
          orderBy: { createdAt: "desc" },
        },
        analyses: {
          include: {
            resume: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Recent analyses
        },
        improvedResumes: {
          include: {
            resume: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Recent improvements
        },
        creditTransactions: {
          orderBy: { createdAt: "desc" },
          take: 5, // Recent transactions
        },
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return userData;
  } catch (error) {
    console.error('[DASHBOARD_ACTIONS] Error getting complete dashboard data:', error);
    return null;
  }
} 