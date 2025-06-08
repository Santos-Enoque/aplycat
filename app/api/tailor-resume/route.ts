// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { streamingModelService } from '@/lib/models-streaming';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[TAILOR_RESUME_FAST] Starting fast tailoring request...');
  
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
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