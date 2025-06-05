import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, dashboardCache } from '@/lib/redis-cache';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    // Only allow authenticated users to view cache stats
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const stats = await getCacheStats();
    
    return NextResponse.json({
      success: true,
      cache: {
        provider: 'Upstash Redis',
        stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[CACHE_MONITORING] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

// Clear user cache (for testing/admin)
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (action === 'clear-all') {
      // Dangerous operation - only for development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Operation not allowed in production' },
          { status: 403 }
        );
      }
      
      await dashboardCache.clearAll();
      return NextResponse.json({
        success: true,
        message: 'All cache cleared',
      });
    }

    if (userId) {
      await dashboardCache.invalidateUser(userId);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for user: ${userId}`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing userId' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[CACHE_MONITORING] Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
} 