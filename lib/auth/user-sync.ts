// lib/auth/user-sync.ts
import { currentUser } from '@clerk/nextjs/server';
import { db, userHelpers } from '@/lib/db';

/**
 * Get or create user from Clerk authentication
 * This ensures the user exists in our database
 */
export async function getCurrentUserFromDB() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  try {
    // Try to find existing user first
    let dbUser = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    // If user doesn't exist, create them
    if (!dbUser) {
      const newUser = await userHelpers.syncUserFromClerk({
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses.map(email => ({
          emailAddress: email.emailAddress,
        })),
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });

      // Fetch the created user with includes
      dbUser = await db.user.findUnique({
        where: { id: newUser.id },
        include: {
          creditTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });
    } else {
      // Update lastActiveAt for existing users
      dbUser = await db.user.update({
        where: { id: dbUser.id },
        data: { lastActiveAt: new Date() },
        include: {
          creditTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });
    }

    return dbUser;
  } catch (error) {
    console.error('Error syncing user from Clerk:', error);
    throw error;
  }
}

/**
 * Require authenticated user for API routes
 */
export async function requireAuth() {
  const user = await getCurrentUserFromDB();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Get user ID from Clerk for API routes
 */
export async function getCurrentUserId(): Promise<string | null> {
  const clerkUser = await currentUser();
  return clerkUser?.id || null;
}