import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { parseOpenAIResponse } from '@/lib/json-parser';
import { fastModelService } from '@/lib/fast-model-service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[INSTANT_UPLOAD_ANALYSIS] Starting instant upload + analysis...');
  
  try {
    // Quick auth check
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { fileName, fileData } = await request.json();

    // Basic validation
    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: 'File data and name are required' },
        { status: 400 }
      );
    }

    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    console.log(`[INSTANT_UPLOAD_ANALYSIS] Processing ${fileName} for user ${user.id}`);

    // Performance tracking
    const authTime = Date.now() - startTime;
    const aiStartTime = Date.now();

    // Ultra-fast AI analysis
    const rawResponse = await fastModelService.analyzeResumeInstant(fileName, fileData);

    if (!rawResponse) {
      throw new Error('No response from AI model');
    }

    const aiTime = Date.now() - aiStartTime;
    const parseStartTime = Date.now();

    // Parse response
    const parseResult = parseOpenAIResponse(rawResponse);
    
    const parseTime = Date.now() - parseStartTime;
    const totalTime = Date.now() - startTime;

    console.log(`[INSTANT_UPLOAD_ANALYSIS] Performance breakdown:
      - Auth: ${authTime}ms
      - AI Analysis: ${aiTime}ms  
      - JSON Parsing: ${parseTime}ms
      - Total: ${totalTime}ms`);

    // Return immediate JSON response - no database saving
    return NextResponse.json({
      success: true,
      analysis: parseResult.data,
      fileName,
      processingTimeMs: totalTime,
      performance: {
        authTime,
        aiTime,
        parseTime,
        totalTime
      },
      timestamp: new Date().toISOString(),
      userId: user.id,
      instant: true,
      parseStrategy: parseResult.strategy,
      raw_response: parseResult.success ? null : rawResponse.substring(0, 1000) // For debugging
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[INSTANT_UPLOAD_ANALYSIS] Error after ${processingTime}ms:`, error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Analysis failed',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}