import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserAnalyses } from '@/lib/actions/resume-actions';

export async function GET(request: NextRequest) {
  console.log('[SAVED_ANALYSES] Starting request...');
  
  try {
    const user = await currentUser();
    console.log('[SAVED_ANALYSES] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[SAVED_ANALYSES] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get URL parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const resumeId = url.searchParams.get('resumeId');

    console.log('[SAVED_ANALYSES] Query parameters:', { page, limit, resumeId });

    // Get analyses using server action
    const result = await getUserAnalyses(limit, (page - 1) * limit);
    
    if (!result) {
      console.log('[SAVED_ANALYSES] Failed to get analyses');
      return NextResponse.json(
        { error: 'Failed to retrieve analyses' },
        { status: 500 }
      );
    }

    const { analyses, total: totalCount } = result;

    console.log('[SAVED_ANALYSES] Found analyses:', {
      count: analyses.length,
      totalCount,
      page,
      limit
    });

    // Transform the data for the response
    const transformedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      fileName: analysis.fileName,
      overallScore: analysis.overallScore,
      atsScore: analysis.atsScore,
      scoreCategory: analysis.scoreCategory,
      mainRoast: analysis.mainRoast,
      processingTimeMs: analysis.processingTimeMs,
      createdAt: analysis.createdAt,
      // Don't include the full analysisData in the list to save bandwidth
      // The full data will be retrieved when viewing the specific analysis
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      analyses: transformedAnalyses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[SAVED_ANALYSES] Error:', error);
    console.error('[SAVED_ANALYSES] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve saved analyses', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 