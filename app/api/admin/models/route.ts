import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { db } from '@/lib/db';

async function GET_HANDLER(request: NextRequest, user: any) {
  console.log('[ADMIN_MODELS] Getting all model configurations for admin user:', user.id);
  console.log('[ADMIN_MODELS] User details:', {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress,
    publicMetadata: user.publicMetadata,
  });
  
  try {
    console.log('[ADMIN_MODELS] Attempting to fetch model configurations...');
    
    const configurations = await db.modelConfiguration.findMany({
      include: {
        prompts: {
          select: {
            id: true,
            name: true,
            promptType: true,
            isActive: true,
            version: true,
          },
        },
        _count: {
          select: {
            prompts: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    console.log('[ADMIN_MODELS] Raw configurations from DB:', configurations);

    console.log(`[ADMIN_MODELS] Found ${configurations.length} model configurations`);

    return NextResponse.json({
      success: true,
      configurations,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ADMIN_MODELS] Error fetching model configurations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch model configurations',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function POST_HANDLER(request: NextRequest, user: any) {
  console.log('[ADMIN_MODELS] Creating new model configuration by admin user:', user.id);
  
  try {
    const body = await request.json();
    const {
      name,
      description,
      provider,
      modelName,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      isDefault,
    } = body;

    // Validate required fields
    if (!name || !provider || !modelName) {
      return NextResponse.json(
        { error: 'Name, provider, and model name are required' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['openai', 'gemini'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider must be either "openai" or "gemini"' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingConfig = await db.modelConfiguration.findFirst({
      where: { name },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'A model configuration with this name already exists' },
        { status: 409 }
      );
    }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await db.modelConfiguration.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the new configuration
    const newConfig = await db.modelConfiguration.create({
      data: {
        name,
        description,
        provider,
        modelName,
        temperature: temperature !== undefined ? temperature : 0.1,
        maxTokens: maxTokens || 4000,
        topP: topP !== undefined ? topP : 1.0,
        frequencyPenalty: frequencyPenalty || 0.0,
        presencePenalty: presencePenalty || 0.0,
        isActive: true,
        isDefault: isDefault || false,
        createdBy: user.id,
      },
    });

    console.log('[ADMIN_MODELS] Created new model configuration:', newConfig.id);

    // Trigger cache invalidation if this is the new default
    if (isDefault) {
      await triggerCacheInvalidation('model_config_updated', newConfig.id, [], user.id);
    }

    return NextResponse.json({
      success: true,
      configuration: newConfig,
      message: 'Model configuration created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ADMIN_MODELS] Error creating model configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create model configuration',
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
      console.error('[ADMIN_MODELS] Cache invalidation webhook failed:', response.status);
    } else {
      console.log('[ADMIN_MODELS] Cache invalidation webhook triggered successfully');
    }
  } catch (error) {
    console.error('[ADMIN_MODELS] Error triggering cache invalidation:', error);
    // Don't fail the main operation if webhook fails
  }
}

// Export the main handlers
export const GET = withAdminAuth(GET_HANDLER);
export const POST = withAdminAuth(POST_HANDLER);

// Debug logging
console.log('[ADMIN_MODELS] Route exports configured:', {
  GET: typeof GET,
  POST: typeof POST,
});
