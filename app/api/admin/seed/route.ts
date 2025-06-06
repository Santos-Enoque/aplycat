import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('[ADMIN_SEED] Starting database seed...');

    // Check if configurations already exist
    const existingConfigs = await db.modelConfiguration.findMany();
    console.log('[ADMIN_SEED] Existing configurations:', existingConfigs.length);

    if (existingConfigs.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
        configurations: existingConfigs,
      });
    }

    // Create default OpenAI configuration
    const openaiConfig = await db.modelConfiguration.create({
      data: {
        name: 'OpenAI GPT-4',
        description: 'Default OpenAI GPT-4 configuration for resume analysis',
        provider: 'openai',
        modelName: 'gpt-4',
        temperature: 0.1,
        maxTokens: 4000,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        isActive: true,
        isDefault: true,
        createdBy: 'system',
      },
    });

    // Create alternative configuration
    const altConfig = await db.modelConfiguration.create({
      data: {
        name: 'OpenAI GPT-3.5 Turbo',
        description: 'Cost-effective GPT-3.5 configuration',
        provider: 'openai',
        modelName: 'gpt-3.5-turbo',
        temperature: 0.2,
        maxTokens: 3000,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        isActive: true,
        isDefault: false,
        createdBy: 'system',
      },
    });

    // Create some sample prompts
    await db.modelPrompt.create({
      data: {
        configurationId: openaiConfig.id,
        name: 'Resume Analysis System Prompt',
        promptType: 'SYSTEM',
        systemPrompt: 'You are an expert resume reviewer and career coach. Analyze resumes objectively and provide actionable feedback.',
        description: 'Main system prompt for resume analysis',
        isActive: true,
        createdBy: 'system',
      },
    });

    await db.modelPrompt.create({
      data: {
        configurationId: openaiConfig.id,
        name: 'Improvement Generation',
        promptType: 'USER',
        userPrompt: 'Please provide specific, actionable improvements for this resume section: {{section}}',
        description: 'Template for generating resume improvements',
        templateVariables: { section: 'string' },
        isActive: true,
        createdBy: 'system',
      },
    });

    console.log('[ADMIN_SEED] Successfully created configurations and prompts');
    console.log('[ADMIN_SEED] Created configurations:', {
      openaiConfig: openaiConfig.id,
      altConfig: altConfig.id,
    });

    // Verify the data was actually saved
    const verifyConfigs = await db.modelConfiguration.findMany();
    console.log('[ADMIN_SEED] Verification - Total configs in DB:', verifyConfigs.length);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      configurations: [openaiConfig, altConfig],
      verification: {
        totalInDb: verifyConfigs.length,
        configIds: verifyConfigs.map(c => c.id),
      },
    });

  } catch (error: any) {
    console.error('[ADMIN_SEED] Error seeding database:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed database',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 