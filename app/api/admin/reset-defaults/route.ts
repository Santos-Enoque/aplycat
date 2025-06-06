import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { promptCache } from '@/lib/cache/prompt-cache';

async function POST_HANDLER(request: NextRequest, user: any) {
  console.log('[ADMIN_RESET] Resetting to defaults by admin user:', user.id);
  
  try {
    // Reset to default configuration and prompts
    await promptCache.resetToDefaults();

    console.log('[ADMIN_RESET] Successfully reset to defaults');

    return NextResponse.json({
      success: true,
      message: 'System reset to default configuration and prompts successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ADMIN_RESET] Error resetting to defaults:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset to defaults',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(POST_HANDLER); 