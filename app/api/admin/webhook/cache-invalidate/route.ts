// app/api/admin/webhook/cache-invalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promptCache } from '@/lib/cache/prompt-cache';
import { modelService } from '@/lib/models-updated';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[ADMIN_WEBHOOK] Cache invalidation webhook triggered');
  
  try {
    // Verify webhook signature/token for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_WEBHOOK_SECRET;
    
    if (!expectedToken) {
      console.error('[ADMIN_WEBHOOK] ADMIN_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not properly configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.log('[ADMIN_WEBHOOK] Invalid or missing authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[ADMIN_WEBHOOK] Webhook payload:', body);

    const { type, configurationId, promptIds, userId } = body;

    // Log the admin action
    console.log(`[ADMIN_WEBHOOK] Cache invalidation requested by admin user: ${userId}`);
    console.log(`[ADMIN_WEBHOOK] Invalidation type: ${type}`);

    // Invalidate prompt cache
    console.log('[ADMIN_WEBHOOK] Invalidating prompt cache...');
    await promptCache.invalidateCache();

    // Refresh model service configuration
    console.log('[ADMIN_WEBHOOK] Refreshing model service configuration...');
    await modelService.refreshConfig();

    const processingTime = Date.now() - startTime;
    
    console.log(`[ADMIN_WEBHOOK] Cache invalidation completed successfully in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated successfully',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      invalidatedComponents: [
        'prompt_cache',
        'model_service_config'
      ]
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[ADMIN_WEBHOOK] Error after ${processingTime}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Cache invalidation failed',
        details: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}