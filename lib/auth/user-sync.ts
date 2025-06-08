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
 * Decrements a user's credits and records the transaction.
 * @param clerkId The Clerk ID of the user.
 * @param amount The number of credits to deduct (should be positive).
 * @param description A description for the credit transaction.
 */
export async function decrementUserCredits(clerkId: string, amount: number, description?: string) {
  const user = await db.user.findUnique({ where: { clerkId } });

  if (!user) {
    throw new Error(`User with clerkId ${clerkId} not found.`);
  }

  if (user.credits < amount) {
    throw new Error('Insufficient credits.');
  }

  try {
    return await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: { decrement: amount },
          totalCreditsUsed: { increment: amount },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type: 'ANALYSIS_USE', // This might need to be more generic
          amount: -amount,
          description: description || `Service usage`,
        },
      });

      return updatedUser;
    });
  } catch (error) {
    console.error(`Failed to deduct ${amount} credits for user ${clerkId}:`, error);
    throw new Error('Credit deduction failed.');
  }
}

/**
 * Get user ID from Clerk for API routes
 */
export async function getCurrentUserId(): Promise<string | null> {
  const clerkUser = await currentUser();
  return clerkUser?.id || null;
}