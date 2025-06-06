import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { db } from '@/lib/db';

// Individual prompt management
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  return withAdminAuth(async (req, user) => {
    const { promptId } = await params;
    console.log('[ADMIN_PROMPT] Getting prompt:', promptId);
    
    try {
      const prompt = await db.modelPrompt.findUnique({
        where: { id: promptId },
        include: {
          configuration: true,
        },
      });

      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        prompt,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[ADMIN_PROMPT] Error fetching prompt:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch prompt',
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
  { params }: { params: Promise<{ promptId: string }> }
) {
  return withAdminAuth(async (req, user) => {
    const { promptId } = await params;
    console.log('[ADMIN_PROMPT] Updating prompt:', promptId, 'by user:', user.id);
    
    try {
      const body = await request.json();
      const {
        name,
        promptType,
        systemPrompt,
        userPrompt,
        description,
        templateVariables,
        testGroup,
        isActive,
      } = body;

      // Get existing prompt
      const existingPrompt = await db.modelPrompt.findUnique({
        where: { id: promptId },
      });

      if (!existingPrompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      // Check for unique constraint conflicts if name is being changed
      if (name && name !== existingPrompt.name) {
        const conflictingPrompt = await db.modelPrompt.findFirst({
          where: {
            configurationId: existingPrompt.configurationId,
            promptType: promptType || existingPrompt.promptType,
            name,
            id: { not: promptId },
          },
        });

        if (conflictingPrompt) {
          return NextResponse.json(
            { error: 'A prompt with this name and type already exists for this configuration' },
            { status: 409 }
          );
        }
      }

      // Update the prompt
      const updatedPrompt = await db.modelPrompt.update({
        where: { id: promptId },
        data: {
          name: name || existingPrompt.name,
          promptType: promptType || existingPrompt.promptType,
          systemPrompt: promptType === 'SYSTEM' ? systemPrompt : null,
          userPrompt: promptType !== 'SYSTEM' ? userPrompt : null,
          description,
          templateVariables: templateVariables || undefined,
          testGroup,
          isActive: isActive !== undefined ? isActive : existingPrompt.isActive,
          version: existingPrompt.version + 1,
          updatedAt: new Date(),
        },
        include: {
          configuration: true,
        },
      });

      console.log('[ADMIN_PROMPT] Updated prompt:', updatedPrompt.id, 'version:', updatedPrompt.version);

      // Trigger cache invalidation webhook
      await triggerCacheInvalidation('prompt_updated', updatedPrompt.configurationId, [updatedPrompt.id], user.id);

      return NextResponse.json({
        success: true,
        prompt: updatedPrompt,
        message: 'Prompt updated successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[ADMIN_PROMPT] Error updating prompt:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update prompt',
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
  { params }: { params: Promise<{ promptId: string }> }
) {
  return withAdminAuth(async (req, user) => {
    const { promptId } = await params;
    console.log('[ADMIN_PROMPT] Deleting prompt:', promptId, 'by user:', user.id);
    
    try {
      const existingPrompt = await db.modelPrompt.findUnique({
        where: { id: promptId },
      });

      if (!existingPrompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      // Soft delete by setting isActive to false
      const deletedPrompt = await db.modelPrompt.update({
        where: { id: promptId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      console.log('[ADMIN_PROMPT] Soft deleted prompt:', deletedPrompt.id);

      // Trigger cache invalidation webhook
      await triggerCacheInvalidation('prompt_deleted', deletedPrompt.configurationId, [deletedPrompt.id], user.id);

      return NextResponse.json({
        success: true,
        message: 'Prompt deleted successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[ADMIN_PROMPT] Error deleting prompt:', error);
      return NextResponse.json(
        { 
          error: 'Failed to delete prompt',
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
      console.error('[ADMIN_PROMPTS] Cache invalidation webhook failed:', response.status);
    } else {
      console.log('[ADMIN_PROMPTS] Cache invalidation webhook triggered successfully');
    }
  } catch (error) {
    console.error('[ADMIN_PROMPTS] Error triggering cache invalidation:', error);
    // Don't fail the main operation if webhook fails
  }
} 