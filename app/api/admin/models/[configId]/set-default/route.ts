import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { db } from '@/lib/db';

async function POST_HANDLER(request: NextRequest, user: any) {
  // Extract configId from the URL path
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const configId = pathSegments[pathSegments.indexOf('models') + 1];
  console.log('[ADMIN_SET_DEFAULT_MODEL] Setting model configuration as default:', configId, 'by admin user:', user.id);

  try {
    // First, remove default status from all other configurations
    await db.modelConfiguration.updateMany({
      where: { isDefault: true },
      data: { isDefault: false, isActive: false },
    });

    // Set the specified configuration as default and active
    const updatedConfig = await db.modelConfiguration.update({
      where: { id: configId },
      data: { 
        isDefault: true, 
        isActive: true,
        updatedAt: new Date(),
      },
      include: {
        prompts: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    console.log('[ADMIN_SET_DEFAULT_MODEL] Successfully set default configuration:', updatedConfig.id);

    // Trigger cache invalidation webhook
    await triggerCacheInvalidation('model_default_changed', configId, [], user.id);

    return NextResponse.json({
      success: true,
      configuration: updatedConfig,
      message: 'Model configuration set as default successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ADMIN_SET_DEFAULT_MODEL] Error setting default configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set default configuration',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to trigger cache invalidation
async function triggerCacheInvalidation(
  type: string,
  configurationId: string,
  promptIds: string[],
  userId: string
) {
  try {
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/admin/webhook/cache-invalidate`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/webhook/cache-invalidate`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        type,
        configurationId,
        promptIds,
        userId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('[ADMIN_SET_DEFAULT_MODEL] Cache invalidation webhook failed:', response.status);
    } else {
      console.log('[ADMIN_SET_DEFAULT_MODEL] Cache invalidation webhook triggered successfully');
    }
  } catch (error) {
    console.error('[ADMIN_SET_DEFAULT_MODEL] Error triggering cache invalidation:', error);
    // Don't fail the main operation if webhook fails
  }
}

// Export the handler
export const POST = withAdminAuth(POST_HANDLER); 