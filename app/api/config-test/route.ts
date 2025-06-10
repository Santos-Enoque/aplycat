import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { modelService } from '@/lib/models-consolidated';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (optional for testing)
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current configuration from config.ts
    const config = modelService.getCurrentConfig();
    
    return NextResponse.json({
      message: 'Configuration loaded from config.ts',
      config: {
        primary: config.primary,
        fallback: config.fallback,
      },
      source: 'lib/config.ts',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Config Test] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 