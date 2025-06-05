// app/api/analyze-resume-instant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { parseOpenAIResponse } from '@/lib/json-parser';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { modelService } from '@/lib/models';
import { 
  RESUME_ANALYSIS_SYSTEM_PROMPT, 
  RESUME_ANALYSIS_USER_PROMPT 
} from '@/lib/prompts/resume-prompts';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[INSTANT_ANALYSIS] Starting instant analysis request...');
  
  try {
    const user = await currentUser();
    console.log('[INSTANT_ANALYSIS] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[INSTANT_ANALYSIS] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user (lightweight check)
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[INSTANT_ANALYSIS] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[INSTANT_ANALYSIS] Request body:', {
      hasFileData: !!requestBody.fileData,
      fileDataLength: requestBody.fileData?.length || 0,
      fileName: requestBody.fileName,
      immediate: requestBody.immediate
    });

    const { fileName, fileData, immediate } = requestBody;

    if (!fileData || !fileName) {
      console.log('[INSTANT_ANALYSIS] Missing file data or name');
      return NextResponse.json(
        { error: 'File data and name are required' },
        { status: 400 }
      );
    }

    console.log('[INSTANT_ANALYSIS] Starting AI analysis...');

    // Use the model service for immediate analysis
    const response = await modelService.analyzeResume(
      RESUME_ANALYSIS_SYSTEM_PROMPT,
      RESUME_ANALYSIS_USER_PROMPT,
      {
        filename: fileName,
        fileData: fileData,
        mimeType: 'application/pdf'
      }
    );

    const result = response.content;
    
    if (!result) {
      console.error('[INSTANT_ANALYSIS] No response from model service');
      throw new Error('No response from model service');
    }

    console.log(`[INSTANT_ANALYSIS] Model response length: ${result.length} characters`);

    // Parse the response
    const parseResult = parseOpenAIResponse(result);
    
    if (!parseResult.success) {
      console.error('[INSTANT_ANALYSIS] JSON parsing failed with all strategies');
      console.error('[INSTANT_ANALYSIS] Parse error:', parseResult.error);
      
      // Return fallback data if parsing failed
      const analysis = parseResult.data;
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        analysis,
        fileName,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        parseStrategy: 'fallback',
        warning: 'Analysis completed with technical recovery',
        immediate: true
      });
    }

    const analysis = parseResult.data;
    const processingTime = Date.now() - startTime;
    
    console.log(`[INSTANT_ANALYSIS] Analysis completed successfully in ${processingTime}ms using strategy: ${parseResult.strategy}`);

    // Start background database save (don't wait for it)
    if (immediate) {
      saveToDatabase(dbUser.id, fileName, fileData, analysis, processingTime)
        .then((savedData) => {
          console.log('[INSTANT_ANALYSIS] Background save completed:', savedData?.analysisId);
        })
        .catch((error) => {
          console.error('[INSTANT_ANALYSIS] Background save failed:', error);
          // Don't affect user experience
        });
    }

    // Return immediate response to user
    return NextResponse.json({
      success: true,
      analysis,
      fileName,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      parseStrategy: parseResult.strategy,
      immediate: true,
      cached: false
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[INSTANT_ANALYSIS] Error after ${processingTime}ms:`, error);
    console.error('[INSTANT_ANALYSIS] Stack trace:', error.stack);
    
    const errorType = error.message?.includes('OpenAI') ? 'MODEL_ERROR' : 
                      error.message?.includes('JSON') ? 'JSON_PARSE_ERROR' : 
                      error.message?.includes('Network') ? 'NETWORK_ERROR' :
                      'UNKNOWN_ERROR';
    
    console.error(`[INSTANT_ANALYSIS] Error type: ${errorType}`);
    
    // Return user-friendly error
    return NextResponse.json({
      success: false,
      error: 'Resume analysis temporarily unavailable',
      errorType,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      immediate: true
    }, { status: 500 });
  }
}

// Background database save function (runs asynchronously)
async function saveToDatabase(
  userId: string, 
  fileName: string, 
  fileData: string, 
  analysis: any, 
  processingTime: number
) {
  try {
    console.log('[INSTANT_ANALYSIS] Starting background database save...');
    
    // First, create a temporary resume record with the file data
    const tempResumeId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In a production system, you might want to:
    // 1. Save to a temporary storage location
    // 2. Process the upload to permanent storage
    // 3. Update the database with the permanent URL
    
    // For now, we'll create the analysis record directly
    const { db } = await import('@/lib/db');
    
    // Create resume record first (this would be updated later with UploadThing URL)
    const resume = await db.resume.create({
      data: {
        userId,
        fileName,
        fileUrl: `data:application/pdf;base64,${fileData}`, // Temporary
        fileSize: Math.round((fileData.length * 3) / 4), // Approximate size
        mimeType: 'application/pdf',
        title: fileName.replace('.pdf', ''),
      },
    });

    console.log('[INSTANT_ANALYSIS] Resume record created:', resume.id);

    // Create analysis record
    const savedAnalysis = await db.analysis.create({
      data: {
        userId,
        resumeId: resume.id,
        fileName,
        processingTimeMs: processingTime,
        overallScore: analysis.overall_score || 0,
        atsScore: analysis.ats_score || 0,
        scoreCategory: analysis.score_category || 'Unknown',
        mainRoast: analysis.main_roast || 'Analysis completed',
        analysisData: analysis,
        creditsUsed: 2, // Cost for analysis
        isCompleted: true,
      },
    });

    console.log('[INSTANT_ANALYSIS] Analysis saved:', savedAnalysis.id);

    // Record credit transaction
    await db.creditTransaction.create({
      data: {
        userId,
        type: 'ANALYSIS_USE',
        amount: -2, // Deduct 2 credits
        description: `Resume analysis: ${fileName}`,
        relatedAnalysisId: savedAnalysis.id,
      },
    });

    // Update user's credit count
    await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 2 },
        totalCreditsUsed: { increment: 2 },
      },
    });

    console.log('[INSTANT_ANALYSIS] Background save completed successfully');

    return {
      resumeId: resume.id,
      analysisId: savedAnalysis.id,
    };

  } catch (error: any) {
    console.error('[INSTANT_ANALYSIS] Background save failed:', error);
    throw error;
  }
}