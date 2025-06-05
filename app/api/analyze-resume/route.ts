// app/api/analyze-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { parseOpenAIResponse } from '@/lib/json-parser';
import { getResumeData } from '@/lib/resume-storage';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { modelService } from '@/lib/models';
import { 
  RESUME_ANALYSIS_SYSTEM_PROMPT, 
  RESUME_ANALYSIS_USER_PROMPT 
} from '@/lib/prompts/resume-prompts';
import { dashboardCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[RESUME_ANALYSIS] Starting analysis request...');
  
  try {
    const user = await currentUser();
    console.log('[RESUME_ANALYSIS] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[RESUME_ANALYSIS] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[RESUME_ANALYSIS] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[RESUME_ANALYSIS] Request body:', {
      hasResumeId: !!requestBody.resumeId,
      resumeId: requestBody.resumeId,
      hasFileData: !!requestBody.fileData,
      fileDataLength: requestBody.fileData?.length || 0,
      fileName: requestBody.fileName,
      forceReanalysis: requestBody.forceReanalysis
    });

    const { resumeId, fileName, fileData, forceReanalysis = false } = requestBody;

    let actualFileData: string;
    let actualFileName: string;
    let actualResumeId: string;

    // Support both new (resumeId) and old (direct fileData) approaches for backward compatibility
    if (resumeId) {
      console.log('[RESUME_ANALYSIS] Using new approach with resumeId:', resumeId);
      
      // Check if analysis already exists and is not being forced to re-run
      if (!forceReanalysis) {
        console.log('[RESUME_ANALYSIS] Checking for existing analysis...');
        const existingAnalysis = await db.analysis.findFirst({
          where: {
            resumeId: resumeId,
            userId: dbUser.id,
            isCompleted: true,
          },
          orderBy: {
            createdAt: 'desc', // Get the most recent analysis
          },
        });

        if (existingAnalysis) {
          console.log('[RESUME_ANALYSIS] Found existing analysis:', {
            analysisId: existingAnalysis.id,
            createdAt: existingAnalysis.createdAt,
            overallScore: existingAnalysis.overallScore,
            atsScore: existingAnalysis.atsScore
          });

          const processingTime = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            analysis: existingAnalysis.analysisData,
            fileName: existingAnalysis.fileName,
            resumeId: resumeId,
            analysisId: existingAnalysis.id,
            processingTimeMs: processingTime,
            timestamp: existingAnalysis.createdAt.toISOString(),
            cached: true,
            message: 'Retrieved existing analysis'
          });
        } else {
          console.log('[RESUME_ANALYSIS] No existing analysis found, proceeding with new analysis');
        }
      } else {
        console.log('[RESUME_ANALYSIS] Force reanalysis requested, skipping cache check');
      }
      
      // New approach: get resume data from database using resumeId
      const storedResume = await getResumeData(resumeId, user.id);
      console.log('[RESUME_ANALYSIS] Retrieved resume data:', storedResume ? {
        resumeId: storedResume.resumeId,
        fileName: storedResume.fileName,
        fileDataLength: storedResume.fileData.length
      } : 'null');
      
      if (!storedResume) {
        console.log('[RESUME_ANALYSIS] Resume not found - returning 404');
        return NextResponse.json(
          { error: 'Resume not found or you do not have access to it.' },
          { status: 404 }
        );
      }

      actualFileData = storedResume.fileData;
      actualFileName = storedResume.fileName;
      actualResumeId = storedResume.resumeId;
    } else if (fileData && fileName) {
      console.log('[RESUME_ANALYSIS] Using legacy approach with direct file data');
      // Backward compatibility: direct file data (will be deprecated)
      actualFileData = fileData;
      actualFileName = fileName;
      actualResumeId = 'legacy-upload';
    } else {
      console.log('[RESUME_ANALYSIS] Invalid request - missing required data');
      return NextResponse.json(
        { error: 'Either resumeId or fileData with fileName is required' },
        { status: 400 }
      );
    }

    console.log(`[RESUME_ANALYSIS] Analysis setup complete:`, {
      resumeId: actualResumeId,
      fileName: actualFileName,
      fileDataLength: actualFileData.length,
      timestamp: new Date().toISOString()
    });

    // Use the new model service for analysis
    const response = await modelService.analyzeResume(
      RESUME_ANALYSIS_SYSTEM_PROMPT,
      RESUME_ANALYSIS_USER_PROMPT,
      {
        filename: actualFileName || 'resume.pdf',
        fileData: actualFileData,
        mimeType: 'application/pdf'
      }
    );

    const result = response.content;
    
    if (!result) {
      console.error('[RESUME_ANALYSIS] No response from model service');
      throw new Error('No response from model service');
    }

    console.log(`[RESUME_ANALYSIS] Model response length: ${result.length} characters`);

    // Use the robust JSON parser
    const parseResult = parseOpenAIResponse(result);
    
    if (!parseResult.success) {
      console.error('[RESUME_ANALYSIS] JSON parsing failed with all strategies');
      console.error('[RESUME_ANALYSIS] Parse error:', parseResult.error);
      console.error('[RESUME_ANALYSIS] Raw response sample:', parseResult.rawResponse || result.substring(0, 1000));
      console.error('[RESUME_ANALYSIS] Full response for debugging:', result);
      
      // Return the fallback data if parsing completely failed
      const analysis = parseResult.data;
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true, // Still return success since we have fallback data
        analysis,
        fileName: actualFileName,
        resumeId: actualResumeId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        parseStrategy: 'fallback',
        warning: 'Analysis completed with technical recovery',
        debugInfo: {
          error: parseResult.error,
          rawResponseSample: parseResult.rawResponse || result.substring(0, 500)
        }
      });
    }

    const analysis = parseResult.data;
    const processingTime = Date.now() - startTime;
    
    console.log(`[RESUME_ANALYSIS] Analysis completed successfully in ${processingTime}ms for resume: ${actualResumeId} using strategy: ${parseResult.strategy}`);

    // Save analysis to database (only for new resume analyses, not legacy ones)
    let savedAnalysisId: string | null = null;
    if (actualResumeId !== 'legacy-upload') {
      try {
        console.log('[RESUME_ANALYSIS] Saving analysis to database...');
        
        const savedAnalysis = await db.analysis.create({
          data: {
            userId: dbUser.id,
            resumeId: actualResumeId,
            fileName: actualFileName,
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

        savedAnalysisId = savedAnalysis.id;
        console.log('[RESUME_ANALYSIS] Analysis saved to database:', {
          analysisId: savedAnalysisId,
          overallScore: savedAnalysis.overallScore,
          atsScore: savedAnalysis.atsScore,
          creditsUsed: savedAnalysis.creditsUsed
        });

        // Record credit transaction
        await db.creditTransaction.create({
          data: {
            userId: dbUser.id,
            type: 'ANALYSIS_USE',
            amount: -2, // Deduct 2 credits
            description: `Resume analysis: ${actualFileName}`,
            relatedAnalysisId: savedAnalysisId,
          },
        });

        // Update user's credit count
        await db.user.update({
          where: { id: dbUser.id },
          data: {
            credits: { decrement: 2 },
            totalCreditsUsed: { increment: 2 },
          },
        });

        console.log('[RESUME_ANALYSIS] Credits deducted and transaction recorded');

        // Invalidate user cache after successful analysis
        dashboardCache.invalidateUser(dbUser.id);

      } catch (dbError: any) {
        console.error('[RESUME_ANALYSIS] Failed to save analysis to database:', dbError);
        // Don't fail the entire request if database save fails
        // The user still gets their analysis result
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      fileName: actualFileName,
      resumeId: actualResumeId,
      analysisId: savedAnalysisId,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      parseStrategy: parseResult.strategy,
      cached: false
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[RESUME_ANALYSIS] Error after ${processingTime}ms:`, error);
    console.error('[RESUME_ANALYSIS] Stack trace:', error.stack);
    
    // Log the type of error for monitoring
    const errorType = error.message?.includes('OpenAI') ? 'MODEL_ERROR' : 
                      error.message?.includes('JSON') ? 'JSON_PARSE_ERROR' : 
                      error.message?.includes('Network') ? 'NETWORK_ERROR' :
                      'UNKNOWN_ERROR';
    
    console.error(`[RESUME_ANALYSIS] Error type: ${errorType}`);
    
    // For production, we want to be more resilient
    if (process.env.NODE_ENV === 'production') {
      // Return a user-friendly error with fallback analysis
      return NextResponse.json({
        success: false,
        error: 'Resume analysis temporarily unavailable',
        errorType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        // Provide a minimal fallback so the user isn't completely blocked
        fallbackAnalysis: {
          overall_score: 50,
          ats_score: 50,
          main_roast: "System temporarily unavailable for analysis",
          score_category: "Technical Issue",
          message: "Please try again in a moment. Our AI is taking a brief catnap."
        }
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error.message,
        errorType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}