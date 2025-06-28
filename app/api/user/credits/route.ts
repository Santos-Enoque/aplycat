import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/utils/api-response';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user's current credit balance
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        credits: true,
        updatedAt: true,
      }
    });

    return createSuccessResponse({
      credits: userData?.credits || 0,
      lastUpdated: userData?.updatedAt,
    });

  } catch (error) {
    return handleApiError(error, 'USER_CREDITS');
  }
} 