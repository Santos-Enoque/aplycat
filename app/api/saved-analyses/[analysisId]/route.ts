import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getAnalysisById } from '@/lib/actions/resume-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params;
  console.log('[GET_ANALYSIS] Starting request for analysis:', analysisId);
  
  try {
    const user = await currentUser();
    console.log('[GET_ANALYSIS] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[GET_ANALYSIS] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the specific analysis using server action
    const analysis = await getAnalysisById(analysisId);

    if (!analysis) {
      console.log('[GET_ANALYSIS] Analysis not found or access denied');
      return NextResponse.json(
        { error: 'Analysis not found or you do not have access to it' },
        { status: 404 }
      );
    }

    console.log('[GET_ANALYSIS] Found analysis:', {
      analysisId: analysis.id,
      fileName: analysis.fileName,
      overallScore: analysis.overallScore,
      atsScore: analysis.atsScore,
      createdAt: analysis.createdAt
    });

    // Return the full analysis data
    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        resumeId: analysis.resumeId,
        fileName: analysis.fileName,
        overallScore: analysis.overallScore,
        atsScore: analysis.atsScore,
        scoreCategory: analysis.scoreCategory,
        mainRoast: analysis.mainRoast,
        analysisData: analysis.analysisData, // Full analysis results
        processingTimeMs: analysis.processingTimeMs,
        createdAt: analysis.createdAt,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[GET_ANALYSIS] Error:', error);
    console.error('[GET_ANALYSIS] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve analysis', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 