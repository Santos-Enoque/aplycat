import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromDBForAPI } from '@/lib/auth/user-sync';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromDBForAPI();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user's current credit balance
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        credits: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      credits: userData?.credits || 0,
      lastUpdated: userData?.updatedAt,
    });

  } catch (error) {
    console.error('[USER_CREDITS] Error getting user credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 