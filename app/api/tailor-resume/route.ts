// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { db } from '@/lib/db';
import { modelService } from '@/lib/models';
import { 
  RESUME_TAILORING_SYSTEM_PROMPT, 
  RESUME_TAILORING_USER_PROMPT 
} from '@/lib/prompts/resume-prompts';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[RESUME_TAILORING] Starting tailoring request...');
  
  try {
    const user = await currentUser();
    console.log('[RESUME_TAILORING] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[RESUME_TAILORING] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[RESUME_TAILORING] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[RESUME_TAILORING] Request body:', {
      hasCurrentResume: !!requestBody.currentResume,
      hasJobDescription: !!requestBody.jobDescription,
      includeCoverLetter: requestBody.includeCoverLetter,
      companyName: requestBody.companyName,
      jobTitle: requestBody.jobTitle,
      improvedResumeId: requestBody.improvedResumeId, // New: for versioning
    });

    const { 
      currentResume, 
      jobDescription, 
      includeCoverLetter, 
      companyName, 
      jobTitle,
      improvedResumeId, // New: original improved resume ID for versioning
    } = requestBody;

    if (!currentResume || !jobDescription) {
      return NextResponse.json(
        { error: 'Current resume and job description are required' },
        { status: 400 }
      );
    }

    // Get the next version number if we're creating a new version
    let nextVersion = 1;
    let originalResumeId = null;
    
    if (improvedResumeId) {
      console.log('[RESUME_TAILORING] Creating new version for improved resume:', improvedResumeId);
      
      // Get the original improved resume to find its resumeId and get next version
      const originalImprovedResume = await db.improvedResume.findFirst({
        where: {
          id: improvedResumeId,
          userId: dbUser.id,
        },
        select: {
          resumeId: true,
          version: true,
        },
      });

      if (originalImprovedResume) {
        originalResumeId = originalImprovedResume.resumeId;
        
        // Get the latest version for this resumeId
        const lastVersion = await db.improvedResume.findFirst({
          where: {
            resumeId: originalImprovedResume.resumeId,
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
    }

    // Use the new model service for tailoring
    const response = await modelService.tailorResume(
      RESUME_TAILORING_SYSTEM_PROMPT,
      RESUME_TAILORING_USER_PROMPT(currentResume, jobDescription, includeCoverLetter || false, companyName, jobTitle)
    );

    const result = response.content;
    
    if (!result) {
      throw new Error('No response from model service');
    }

    console.log(`[RESUME_TAILORING] Model response length: ${result.length} characters`);

    // Clean up the response text to handle potential JSON issues
    let cleanedResult = result.trim();
    
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let tailoredResult;
    try {
      tailoredResult = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      try {
        let fixedResult = cleanedResult
          .replace(/"([^"]*)\\"([^"]*)*"/g, (match, before, after) => {
            return `"${before}'${after || ''}"`;
          })
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\');
        
        tailoredResult = JSON.parse(fixedResult);
      } catch (secondError) {
        throw new Error(`Failed to parse model response as JSON.`);
      }
    }

    const processingTime = Date.now() - startTime;

    // Save tailored resume as new version (only if originalResumeId exists)
    let savedTailoredResumeId: string | null = null;
    if (originalResumeId) {
      try {
        console.log('[RESUME_TAILORING] Saving tailored resume as new version...');
        
        // Extract improvement metrics from the analysis
        const jobMatchScore = tailoredResult?.tailoringAnalysis?.jobMatchScore;
        const keywordAlignment = tailoredResult?.tailoringAnalysis?.keywordAlignment || [];
        const prioritizedExperience = tailoredResult?.tailoringAnalysis?.prioritizedExperience || [];
        
        // Calculate scores
        let improvedScore = null;
        if (jobMatchScore) {
          // Extract numeric value from percentage string like "90%"
          const scoreMatch = jobMatchScore.match(/(\d+)/);
          if (scoreMatch) {
            improvedScore = parseInt(scoreMatch[1]);
          }
        }

        const versionName = `Tailored for ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}`;
        const customPrompt = `Job tailoring for: ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}\n\nJob Description:\n${jobDescription}`;

        const savedTailoredResume = await db.improvedResume.create({
          data: {
            userId: dbUser.id,
            resumeId: originalResumeId,
            version: nextVersion,
            versionName,
            targetRole: jobTitle || 'Tailored Position',
            targetIndustry: 'Various',
            customPrompt,
            improvedResumeData: tailoredResult.tailoredResume,
            improvementSummary: `Resume tailored for ${jobTitle || 'specific position'}${companyName ? ` at ${companyName}` : ''}`,
            keyChanges: { 
              changes: [
                'Reordered experience to highlight most relevant achievements',
                'Integrated job-specific keywords throughout the resume',
                'Customized professional summary for the target role',
                'Emphasized skills and qualifications matching job requirements',
                ...prioritizedExperience.slice(0, 2), // Add top 2 prioritized items
              ]
            },
            originalScore: null, // Not applicable for tailoring
            improvedScore,
            improvementPercentage: null, // Not applicable for tailoring
            fileName: `tailored-resume-v${nextVersion}.json`,
            creditsUsed: 3, // Cost for tailoring
            processingTimeMs: processingTime,
            modelUsed: 'Model Service',
            isCompleted: true,
          },
        });

        savedTailoredResumeId = savedTailoredResume.id;
        console.log('[RESUME_TAILORING] Tailored resume saved as new version:', {
          tailoredResumeId: savedTailoredResumeId,
          version: nextVersion,
          improvedScore,
          creditsUsed: 2
        });

        // Record credit transaction
        await db.creditTransaction.create({
          data: {
            userId: dbUser.id,
            type: 'IMPROVEMENT_USE',
            amount: -3, // Deduct 3 credits for tailoring
            description: `Resume tailoring: ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}`,
            relatedImprovedResumeId: savedTailoredResumeId,
          },
        });

        // Update user's credit count
        await db.user.update({
          where: { id: dbUser.id },
          data: {
            credits: { decrement: 3 },
            totalCreditsUsed: { increment: 3 },
          },
        });

        console.log('[RESUME_TAILORING] Credits deducted and transaction recorded');

      } catch (dbError: any) {
        console.error('[RESUME_TAILORING] Failed to save tailored resume to database:', dbError);
        // Don't fail the entire request if database save fails
        // The user still gets their tailoring result
      }
    }

    console.log('[RESUME_TAILORING] Tailoring completed successfully');

    return NextResponse.json({
      success: true,
      tailoredResume: tailoredResult.tailoredResume,
      coverLetter: tailoredResult.coverLetter || null,
      tailoringAnalysis: tailoredResult.tailoringAnalysis,
      includedCoverLetter: includeCoverLetter,
      jobTitle,
      companyName,
      tailoredResumeId: savedTailoredResumeId,
      version: nextVersion,
      versionName: `Tailored for ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}`,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[RESUME_TAILORING] Error:', error);
    console.error('[RESUME_TAILORING] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to tailor resume',
        details: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}