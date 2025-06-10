// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { streamingModelService } from '@/lib/models-consolidated';
import { getCurrentUserFromDB, decrementUserCredits } from '@/lib/auth/user-sync';

export const revalidate = 0;

const TAILORING_COST = 4;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[TAILOR_RESUME_FAST] Starting fast tailoring request...');
  
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await getCurrentUserFromDB();
    if (!dbUser || dbUser.credits < TAILORING_COST) {
      return NextResponse.json(
        { error: `Insufficient credits. This service costs ${TAILORING_COST} credits.` },
        { status: 402 }
      );
    }

    const {
      currentResume,
      jobDescription,
      jobTitle,
      companyName,
      includeCoverLetter = false,
    }: {
      currentResume: any;
      jobDescription: string;
      jobTitle?: string;
      companyName?: string;
      includeCoverLetter?: boolean;
    } = await request.json();

    if (!currentResume || !jobDescription) {
      return NextResponse.json(
        { error: "Current resume and job description are required" },
        { status: 400 }
      );
    }

    console.log(`[TAILOR_RESUME_FAST] Tailoring for user ${user.id}, job: ${jobTitle}, company: ${companyName}`);

    // Use the streaming model service for tailoring
    const response = await streamingModelService.tailorResume(
      currentResume,
      jobDescription,
      includeCoverLetter,
      companyName,
      jobTitle
    );

    // Parse the JSON response
    const tailoredResult = JSON.parse(response.content);

    const processingTime = Date.now() - startTime;
    console.log(`[TAILOR_RESUME_FAST] Tailoring completed in ${processingTime}ms`);
    
    await decrementUserCredits(user.id, TAILORING_COST);
    console.log(`[TAILOR_RESUME_FAST] Deducted ${TAILORING_COST} credits from user ${user.id}`);

    return NextResponse.json({
      success: true,
      tailoredResume: tailoredResult.tailoredResume,
      coverLetter: tailoredResult.coverLetter || null,
      tailoringAnalysis: tailoredResult.tailoringAnalysis,
      includedCoverLetter: includeCoverLetter,
      jobTitle: jobTitle || "Target Position",
      companyName: companyName || "",
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[TAILOR_RESUME_FAST] Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to tailor resume',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}