// app/api/admin/prompts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { db } from '@/lib/db';
import { ServiceType } from '@/lib/cache/prompt-cache';

async function GET_HANDLER(request: NextRequest, user: any) {
  console.log('[ADMIN_PROMPTS] Getting service-organized prompts for admin user:', user.id);
  
  try {
    // Get the active model configuration
    const activeModelConfig = await db.modelConfiguration.findFirst({
      where: { isActive: true, isDefault: true },
      include: {
        prompts: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeModelConfig) {
      return NextResponse.json({
        success: true,
        services: [],
        activeConfiguration: null,
        timestamp: new Date().toISOString(),
      });
    }

    // Organize prompts by service
    const services: ServiceType[] = ['RESUME_ANALYSIS', 'RESUME_IMPROVEMENT', 'RESUME_TAILORING', 'JOB_EXTRACTION'];
    
    const organizedServices = services.map(service => {
      const systemPrompt = activeModelConfig.prompts.find(
        p => p.name === `${service}_SYSTEM` && p.promptType === 'SYSTEM'
      );
      const userPrompt = activeModelConfig.prompts.find(
        p => p.name === `${service}_USER` && (p.promptType === 'USER' || p.promptType === 'TEMPLATE')
      );

      return {
        service,
        displayName: service.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        systemPrompt: systemPrompt || null,
        userPrompt: userPrompt || null,
        isComplete: !!(systemPrompt && userPrompt),
      };
    });

    console.log(`[ADMIN_PROMPTS] Found ${organizedServices.length} services`);

    return NextResponse.json({
      success: true,
      services: organizedServices,
      activeConfiguration: {
        id: activeModelConfig.id,
        name: activeModelConfig.name,
        provider: activeModelConfig.provider,
        modelName: activeModelConfig.modelName,
        temperature: activeModelConfig.temperature,
        maxTokens: activeModelConfig.maxTokens,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ADMIN_PROMPTS] Error fetching service prompts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch service prompts',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function POST_HANDLER(request: NextRequest, user: any) {
  console.log('[ADMIN_PROMPTS] Creating new service prompt by admin user:', user.id);
  
  try {
    const body = await request.json();
    const {
      service,
      promptRole, // 'SYSTEM' or 'USER'
      content,
      description,
      templateVariables,
    } = body;

    // Validate required fields
    if (!service || !promptRole || !content) {
      return NextResponse.json(
        { error: 'Service, prompt role, and content are required' },
        { status: 400 }
      );
    }

    if (!['RESUME_ANALYSIS', 'RESUME_IMPROVEMENT', 'RESUME_TAILORING', 'JOB_EXTRACTION'].includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }

    if (!['SYSTEM', 'USER'].includes(promptRole)) {
      return NextResponse.json(
        { error: 'Invalid prompt role. Must be SYSTEM or USER' },
        { status: 400 }
      );
    }

    // Get active configuration
    const activeConfig = await db.modelConfiguration.findFirst({
      where: { isActive: true, isDefault: true },
    });

    if (!activeConfig) {
      return NextResponse.json(
        { error: 'No active configuration found' },
        { status: 404 }
      );
    }

    const promptName = `${service}_${promptRole}`;
    const promptType = promptRole === 'SYSTEM' ? 'SYSTEM' : 'TEMPLATE';

    // Check if prompt already exists
    const existingPrompt = await db.modelPrompt.findFirst({
      where: {
        configurationId: activeConfig.id,
        name: promptName,
      },
    });

    if (existingPrompt) {
      // Deactivate existing prompt and create new version
      await db.modelPrompt.update({
        where: { id: existingPrompt.id },
        data: { isActive: false },
      });
    }

    // Create the new prompt
    const newPrompt = await db.modelPrompt.create({
      data: {
        configurationId: activeConfig.id,
        name: promptName,
        promptType,
        systemPrompt: promptRole === 'SYSTEM' ? content : null,
        userPrompt: promptRole === 'USER' ? content : null,
        description,
        templateVariables: templateVariables || undefined,
        isActive: true,
        createdBy: user.id,
      },
      include: {
        configuration: true,
      },
    });

    console.log('[ADMIN_PROMPTS] Created new service prompt:', newPrompt.id);

    // Trigger cache invalidation webhook
    await triggerCacheInvalidation('prompt_created', newPrompt.configurationId, [newPrompt.id], user.id);

    return NextResponse.json({
      success: true,
      prompt: newPrompt,
      message: `${service} ${promptRole} prompt created successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ADMIN_PROMPTS] Error creating service prompt:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create service prompt',
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
      console.error('[ADMIN_PROMPTS] Cache invalidation webhook failed:', response.status);
    } else {
      console.log('[ADMIN_PROMPTS] Cache invalidation webhook triggered successfully');
    }
  } catch (error) {
    console.error('[ADMIN_PROMPTS] Error triggering cache invalidation:', error);
    // Don't fail the main operation if webhook fails
  }
}

// Export the main handlers
export const GET = withAdminAuth(GET_HANDLER);
export const POST = withAdminAuth(POST_HANDLER);