import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { parseOpenAIResponse } from '@/lib/json-parser';
import { getCurrentUserFromDB, decrementUserCredits } from '@/lib/auth/user-sync';
import { modelService } from '@/lib/models-updated';
// import { db } from '@/lib/db'; // No longer needed directly

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[DIRECT_ANALYSIS] Starting direct analysis (no UploadThing)...');
  
  try {
    const user = await currentUser();
    console.log('[DIRECT_ANALYSIS] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[DIRECT_ANALYSIS] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[DIRECT_ANALYSIS] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Check credits
    if (dbUser.credits <= 0) {
      console.log('[DIRECT_ANALYSIS] Insufficient credits');
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    const requestBody = await request.json();
    console.log('[DIRECT_ANALYSIS] Request body:', {
      hasFileData: !!requestBody.fileData,
      fileDataLength: requestBody.fileData?.length || 0,
      fileName: requestBody.fileName
    });

    const { fileName, fileData } = requestBody;

    if (!fileData || !fileName) {
      console.log('[DIRECT_ANALYSIS] Missing file data or name');
      return NextResponse.json(
        { error: 'File data and name are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      console.log('[DIRECT_ANALYSIS] Invalid file type:', fileName);
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    console.log('[DIRECT_ANALYSIS] Starting AI analysis directly...');

    // Send PDF directly to model - NO UploadThing!
    const response = await modelService.analyzeResume({
      filename: fileName,
      fileData: fileData,
      mimeType: 'application/pdf'
    });

    const result = response.content;
    
    if (!result) {
      console.error('[DIRECT_ANALYSIS] No response from model service');
      throw new Error('No response from model service');
    }

    console.log(`[DIRECT_ANALYSIS] Model response length: ${result.length} characters`);

    // Parse the JSON response
    const parseResult = parseOpenAIResponse(result);
    
    if (!parseResult.success) {
      console.error('[DIRECT_ANALYSIS] JSON parsing failed');
      console.error('[DIRECT_ANALYSIS] Parse error:', parseResult.error);
      
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
        mode: 'direct',
        fileData: fileData // Include for potential improvements
      });
    }

    const analysis = parseResult.data;
    const processingTime = Date.now() - startTime;
    
    console.log(`[DIRECT_ANALYSIS] Analysis completed successfully in ${processingTime}ms using strategy: ${parseResult.strategy}`);

    // Deduct credits immediately after successful analysis
    try {
      await decrementUserCredits(user.id, 1);
      console.log(`[DIRECT_ANALYSIS] Deducted 1 credit from user ${user.id}`);
    } catch (creditError) {
      console.error('[DIRECT_ANALYSIS] Failed to deduct credits:', creditError);
      // Don't fail the entire request for credit issues
    }

    // Start background database save (don't wait for it)
    if (analysis) {
      saveAnalysisInBackground(dbUser.id, fileName, fileData, analysis, processingTime)
        .catch(error => {
          console.error('[DIRECT_ANALYSIS] Background save failed:', error);
          // Fail silently - user experience not affected
        });
    }

    return NextResponse.json({
      success: true,
      analysis,
      fileName,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      parseStrategy: parseResult.strategy,
      mode: 'direct',
      message: 'Analysis completed using direct processing (no file upload)',
      fileData: fileData // Include for potential improvements
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[DIRECT_ANALYSIS] Error:', error);
    console.error('[DIRECT_ANALYSIS] Error stack:', error.stack);
    
    let errorType = 'unknown';
    if (error.message?.includes('API key')) {
      errorType = 'api_key';
    } else if (error.message?.includes('rate limit')) {
      errorType = 'rate_limit';
    } else if (error.message?.includes('parsing')) {
      errorType = 'parsing';
    } else if (error.message?.includes('timeout')) {
      errorType = 'timeout';
    }
    
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error.message,
        errorType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        mode: 'direct'
      },
      { status: 500 }
    );
  }
}

// Background function to save analysis - runs asynchronously
async function saveAnalysisInBackground(
  userId: string, 
  fileName: string, 
  fileData: string, 
  analysis: any, 
  processingTime: number
) {
  try {
    console.log('[DIRECT_ANALYSIS] Starting background database save...');
    
    // Create a simple resume record (no UploadThing URL)
    const resume = await db.resume.create({
      data: {
        userId,
        fileName,
        fileUrl: `direct-analysis-${Date.now()}`, // Placeholder URL
        fileSize: Math.round((fileData.length * 3) / 4), // Approximate size
        mimeType: 'application/pdf',
        title: fileName.replace('.pdf', ''),
      },
    });

    console.log('[DIRECT_ANALYSIS] Resume record created:', resume.id);

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
        creditsUsed: 1,
        isCompleted: true,
      },
    });

    console.log('[DIRECT_ANALYSIS] Analysis saved in background:', savedAnalysis.id);
    
    return { success: true, analysisId: savedAnalysis.id, resumeId: resume.id };
  } catch (error) {
    console.error('[DIRECT_ANALYSIS] Background save failed:', error);
    throw error;
  }
} 