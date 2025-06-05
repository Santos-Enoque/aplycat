import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

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

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[SAVED_ANALYSES] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get URL parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const resumeId = url.searchParams.get('resumeId');

    console.log('[SAVED_ANALYSES] Query parameters:', { page, limit, resumeId });

    // Build where clause
    const whereClause: any = {
      userId: dbUser.id,
      isCompleted: true,
    };

    if (resumeId) {
      whereClause.resumeId = resumeId;
    }

    // Get analyses with pagination
    const [analyses, totalCount] = await Promise.all([
      db.analysis.findMany({
        where: whereClause,
        include: {
          resume: {
            select: {
              id: true,
              fileName: true,
              title: true,
              fileUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.analysis.count({
        where: whereClause,
      }),
    ]);

    console.log('[SAVED_ANALYSES] Found analyses:', {
      count: analyses.length,
      totalCount,
      page,
      limit
    });

    // Transform the data for the response
    const transformedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      resumeId: analysis.resumeId,
      fileName: analysis.fileName,
      resumeTitle: analysis.resume.title || analysis.fileName,
      overallScore: analysis.overallScore,
      atsScore: analysis.atsScore,
      scoreCategory: analysis.scoreCategory,
      mainRoast: analysis.mainRoast,
      creditsUsed: analysis.creditsUsed,
      processingTimeMs: analysis.processingTimeMs,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
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