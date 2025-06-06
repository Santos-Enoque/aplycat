import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { db } from '@/lib/db';

// Individual model configuration management
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  return withAdminAuth(async (req, user) => {
    const { configId } = await params;
    console.log('[ADMIN_MODEL] Getting model configuration:', configId);
    
    try {
      const configuration = await db.modelConfiguration.findUnique({
        where: { id: configId },
        include: {
          prompts: {
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!configuration) {
        return NextResponse.json(
          { error: 'Model configuration not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        configuration,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[ADMIN_MODEL] Error fetching model configuration:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch model configuration',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  return withAdminAuth(async (req, user) => {
    const { configId } = await params;
    console.log('[ADMIN_MODEL] Updating model configuration:', configId, 'by user:', user.id);
    
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
        isActive,
        isDefault,
      } = body;

      // Get existing configuration
      const existingConfig = await db.modelConfiguration.findUnique({
        where: { id: configId },
      });

      if (!existingConfig) {
        return NextResponse.json(
          { error: 'Model configuration not found' },
          { status: 404 }
        );
      }

      // If this is being set as default, unset other defaults
      if (isDefault && !existingConfig.isDefault) {
        await db.modelConfiguration.updateMany({
          where: { 
            isDefault: true,
            id: { not: configId }
          },
          data: { isDefault: false },
        });
      }

      // Update the configuration
      const updatedConfig = await db.modelConfiguration.update({
        where: { id: configId },
        data: {
          name: name || existingConfig.name,
          description,
          provider: provider || existingConfig.provider,
          modelName: modelName || existingConfig.modelName,
          temperature: temperature !== undefined ? temperature : existingConfig.temperature,
          maxTokens: maxTokens !== undefined ? maxTokens : existingConfig.maxTokens,
          topP: topP !== undefined ? topP : existingConfig.topP,
          frequencyPenalty: frequencyPenalty !== undefined ? frequencyPenalty : existingConfig.frequencyPenalty,
          presencePenalty: presencePenalty !== undefined ? presencePenalty : existingConfig.presencePenalty,
          isActive: isActive !== undefined ? isActive : existingConfig.isActive,
          isDefault: isDefault !== undefined ? isDefault : existingConfig.isDefault,
          version: existingConfig.version + 1,
          updatedAt: new Date(),
        },
        include: {
          prompts: true,
        },
      });

      console.log('[ADMIN_MODEL] Updated model configuration:', updatedConfig.id, 'version:', updatedConfig.version);

      // Trigger cache invalidation if this affects the active configuration
      if (updatedConfig.isDefault || (isActive !== undefined && existingConfig.isDefault)) {
        await triggerCacheInvalidation('model_config_updated', updatedConfig.id, [], user.id);
      }

      return NextResponse.json({
        success: true,
        configuration: updatedConfig,
        message: 'Model configuration updated successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[ADMIN_MODEL] Error updating model configuration:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update model configuration',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  return withAdminAuth(async (req, user) => {
    const { configId } = await params;
    console.log('[ADMIN_MODEL] Deleting model configuration:', configId, 'by user:', user.id);
    
    try {
      const existingConfig = await db.modelConfiguration.findUnique({
        where: { id: configId },
      });

      if (!existingConfig) {
        return NextResponse.json(
          { error: 'Model configuration not found' },
          { status: 404 }
        );
      }

      // Prevent deletion of default configuration
      if (existingConfig.isDefault) {
        return NextResponse.json(
          { error: 'Cannot delete the default model configuration' },
          { status: 400 }
        );
      }

      // Soft delete by setting isActive to false
      const deletedConfig = await db.modelConfiguration.update({
        where: { id: configId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      console.log('[ADMIN_MODEL] Soft deleted model configuration:', deletedConfig.id);

      return NextResponse.json({
        success: true,
        message: 'Model configuration deleted successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[ADMIN_MODEL] Error deleting model configuration:', error);
      return NextResponse.json(
        { 
          error: 'Failed to delete model configuration',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  })(request);
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