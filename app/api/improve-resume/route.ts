// app/api/improve-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getResumeData } from '@/lib/resume-storage';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { db } from '@/lib/db';
import { modelService } from '@/lib/models-updated';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[RESUME_IMPROVEMENT] Starting improvement request...');
  
  try {
    const user = await currentUser();
    console.log('[RESUME_IMPROVEMENT] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[RESUME_IMPROVEMENT] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[RESUME_IMPROVEMENT] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[RESUME_IMPROVEMENT] Request body:', {
      hasResumeId: !!requestBody.resumeId,
      resumeId: requestBody.resumeId,
      hasFileData: !!requestBody.fileData,
      fileDataLength: requestBody.fileData?.length || 0,
      fileName: requestBody.fileName,
      targetRole: requestBody.targetRole,
      targetIndustry: requestBody.targetIndustry,
      customPrompt: requestBody.customPrompt,
      versionName: requestBody.versionName
    });

    const { resumeId, fileName, fileData, targetRole, targetIndustry, customPrompt, versionName } = requestBody;

    if (!targetRole || !targetIndustry) {
      return NextResponse.json(
        { error: 'Target role and industry are required' },
        { status: 400 }
      );
    }

    let actualFileData: string;
    let actualFileName: string;
    let actualResumeId: string;

    // Support both new (resumeId) and old (direct fileData) approaches for backward compatibility
    if (resumeId) {
      console.log('[RESUME_IMPROVEMENT] Using new approach with resumeId:', resumeId);
      
      // New approach: get resume data from database using resumeId
      const storedResume = await getResumeData(resumeId, user.id);
      console.log('[RESUME_IMPROVEMENT] Retrieved resume data:', storedResume ? {
        resumeId: storedResume.resumeId,
        fileName: storedResume.fileName,
        fileDataLength: storedResume.fileData.length
      } : 'null');
      
      if (!storedResume) {
        console.log('[RESUME_IMPROVEMENT] Resume not found - returning 404');
        return NextResponse.json(
          { error: 'Resume not found or you do not have access to it.' },
          { status: 404 }
        );
      }

      actualFileData = storedResume.fileData;
      actualFileName = storedResume.fileName;
      actualResumeId = storedResume.resumeId;
    } else if (fileData && fileName) {
      console.log('[RESUME_IMPROVEMENT] Using legacy approach with direct file data');
      // Backward compatibility: direct file data (will be deprecated)
      actualFileData = fileData;
      actualFileName = fileName;
      actualResumeId = 'legacy-upload';
    } else {
      console.log('[RESUME_IMPROVEMENT] Invalid request - missing required data');
      return NextResponse.json(
        { error: 'Either resumeId or fileData with fileName is required' },
        { status: 400 }
      );
    }

    // Get the next version number for this resume
    let nextVersion = 1;
    if (actualResumeId !== 'legacy-upload') {
      const lastVersion = await db.improvedResume.findFirst({
        where: {
          resumeId: actualResumeId,
          userId: dbUser.id,
        },
        orderBy: {
          version: 'desc',
        },
        select: {
          version: true,
        },
      });

      if (lastVersion) {
        nextVersion = lastVersion.version + 1;
      }
    }

    console.log(`[RESUME_IMPROVEMENT] Improvement setup complete:`, {
      resumeId: actualResumeId,
      fileName: actualFileName,
      fileDataLength: actualFileData.length,
      targetRole,
      targetIndustry,
      customPrompt,
      versionName,
      nextVersion,
      timestamp: new Date().toISOString()
    });

    // Use the new model service for improvement
    const response = await modelService.improveResume(
      targetRole,
      targetIndustry,
      customPrompt,
      {
        filename: actualFileName || 'resume.pdf',
        fileData: actualFileData,
        mimeType: 'application/pdf'
      }
    );

    const result = response.content;
    
    if (!result) {
      throw new Error('No response from model service');
    }

    console.log(`[RESUME_IMPROVEMENT] Model response length: ${result.length} characters`);

    // Clean up the response text to handle potential JSON issues
    let cleanedResult = result.trim();
    
    // Remove any markdown code block formatting if present
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response with better error handling
    let improvedResume;
    try {
      improvedResume = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', result);
      
      // Try to fix common JSON issues
      try {
        let fixedResult = cleanedResult;
        
        // Replace escaped quotes within string values
        fixedResult = fixedResult.replace(/"([^"]*)\\"([^"]*)*"/g, (match, before, after) => {
          return `"${before}'${after || ''}"`;
        });
        
        // Additional cleanup for other common issues
        fixedResult = fixedResult
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\');
        
        improvedResume = JSON.parse(fixedResult);
      } catch (secondError) {
        console.error('Second JSON Parse Error:', secondError);
        
        try {
          let aggressiveFixResult = cleanedResult
            .replace(/\\"/g, "'")
            .replace(/\\([^"\\\/bfnrt])/g, '$1')
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ');
            
          improvedResume = JSON.parse(aggressiveFixResult);
        } catch (thirdError) {
          console.error('Third JSON Parse Error:', thirdError);
          throw new Error(`Failed to parse model response as JSON. Response: ${result.substring(0, 500)}...`);
        }
      }
    }

    const processingTime = Date.now() - startTime;

    console.log('[RESUME_IMPROVEMENT] Improvement completed successfully - returning to user immediately');

    // **IMMEDIATE RESPONSE TO USER** - Don't wait for database operations
    const immediateResponse = {
      success: true,
      improvedResume,
      targetRole,
      targetIndustry,
      fileName: actualFileName,
      resumeId: actualResumeId,
      version: nextVersion,
      versionName: versionName || `Version ${nextVersion}`,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      cached: false
    };

    // Start background database save operation (don't await)
    if (actualResumeId !== 'legacy-upload') {
      saveToDatabase(
        dbUser.id,
        actualResumeId,
        nextVersion,
        versionName,
        targetRole,
        targetIndustry,
        customPrompt,
        improvedResume,
        actualFileName,
        processingTime
      ).catch(error => {
        console.error('[RESUME_IMPROVEMENT] Background save failed:', error);
        // Don't affect user experience - just log the error
      });
    }

    return NextResponse.json(immediateResponse);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[RESUME_IMPROVEMENT] Error:', error);
    console.error('[RESUME_IMPROVEMENT] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to improve resume',
        details: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Background database save function
async function saveToDatabase(
  userId: string,
  resumeId: string,
  version: number,
  versionName: string | undefined,
  targetRole: string,
  targetIndustry: string,
  customPrompt: string | undefined,
  improvedResume: any,
  fileName: string,
  processingTime: number
) {
  try {
    console.log('[RESUME_IMPROVEMENT] Starting background database save...');
    
    // Extract improvement metrics from the analysis
    const originalScore = improvedResume?.improvementsAnalysis?.originalResumeEffectivenessEstimateForTarget;
    const improvedScore = improvedResume?.improvementsAnalysis?.targetOptimizedResumeScore;
    const keyChanges = improvedResume?.improvementsAnalysis?.keyRevisionsImplemented || [];
    
    // Calculate improvement percentage
    let improvementPercentage = null;
    if (originalScore && improvedScore) {
      const improvedScoreNum = typeof improvedScore === 'string' ? 
        parseInt(improvedScore.split('-')[0]) : improvedScore;
      improvementPercentage = ((improvedScoreNum - originalScore) / originalScore) * 100;
    }

    const savedImprovedResume = await db.improvedResume.create({
      data: {
        userId,
        resumeId,
        version,
        versionName: versionName || `Version ${version}`,
        targetRole,
        targetIndustry,
        customPrompt,
        improvedResumeData: improvedResume,
        improvementSummary: improvedResume?.improvementsAnalysis?.analysisHeadline || null,
        keyChanges: { changes: keyChanges },
        originalScore: originalScore ? parseInt(originalScore.toString()) : null,
        improvedScore: improvedScore ? (typeof improvedScore === 'string' ? 
          parseInt(improvedScore.split('-')[0]) : improvedScore) : null,
        improvementPercentage,
        fileName,
        creditsUsed: 2, // Cost for improvement
        processingTimeMs: processingTime,
        modelUsed: 'Model Service',
        isCompleted: true,
      },
    });

    console.log('[RESUME_IMPROVEMENT] Background save completed:', {
      improvedResumeId: savedImprovedResume.id,
      version: savedImprovedResume.version,
      creditsUsed: savedImprovedResume.creditsUsed
    });

    // Record credit transaction
    await db.creditTransaction.create({
      data: {
        userId,
        type: 'IMPROVEMENT_USE',
        amount: -2, // Deduct 2 credits
        description: `Resume improvement: ${targetRole} role`,
        relatedImprovedResumeId: savedImprovedResume.id,
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

    console.log('[RESUME_IMPROVEMENT] Credits deducted and transaction recorded');

  } catch (error: any) {
    console.error('[RESUME_IMPROVEMENT] Database save error:', error);
    // This is a background operation, so we just log the error
  }
}