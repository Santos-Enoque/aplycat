import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function GET(request: NextRequest) {
  console.log('[IMPROVED_RESUMES] Starting request...');
  
  try {
    const user = await currentUser();
    console.log('[IMPROVED_RESUMES] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[IMPROVED_RESUMES] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[IMPROVED_RESUMES] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get URL parameters for filtering and pagination
    const url = new URL(request.url);
    const resumeId = url.searchParams.get('resumeId');
    const version = url.searchParams.get('version');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const includeData = url.searchParams.get('includeData') === 'true';

    console.log('[IMPROVED_RESUMES] Query parameters:', { resumeId, version, page, limit, includeData });

    // Build where clause
    const whereClause: any = {
      userId: dbUser.id,
      isCompleted: true,
      isActive: true,
    };

    if (resumeId) {
      whereClause.resumeId = resumeId;
    }

    if (version) {
      whereClause.version = parseInt(version);
    }

    // Get improved resumes with pagination
    const [improvedResumes, totalCount] = await Promise.all([
      db.improvedResume.findMany({
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
        orderBy: [
          { resumeId: 'asc' },
          { version: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.improvedResume.count({
        where: whereClause,
      }),
    ]);

    console.log('[IMPROVED_RESUMES] Found improved resumes:', {
      count: improvedResumes.length,
      totalCount,
      page,
      limit
    });

    // Transform the data for the response
    const transformedImprovedResumes = improvedResumes.map(improvedResume => ({
      id: improvedResume.id,
      resumeId: improvedResume.resumeId,
      version: improvedResume.version,
      versionName: improvedResume.versionName,
      targetRole: improvedResume.targetRole,
      targetIndustry: improvedResume.targetIndustry,
      customPrompt: improvedResume.customPrompt,
      improvementSummary: improvedResume.improvementSummary,
      originalScore: improvedResume.originalScore,
      improvedScore: improvedResume.improvedScore,
      improvementPercentage: improvedResume.improvementPercentage,
      fileName: improvedResume.fileName,
      generatedFileUrl: improvedResume.generatedFileUrl,
      creditsUsed: improvedResume.creditsUsed,
      processingTimeMs: improvedResume.processingTimeMs,
      isFavorite: improvedResume.isFavorite,
      createdAt: improvedResume.createdAt,
      updatedAt: improvedResume.updatedAt,
      resume: improvedResume.resume,
      // Only include full data if specifically requested (to save bandwidth)
      ...(includeData && { improvedResumeData: improvedResume.improvedResumeData }),
    }));

    // Group by resume if no specific resumeId was requested
    let groupedResumes = null;
    if (!resumeId) {
      groupedResumes = transformedImprovedResumes.reduce((acc: any, improvedResume) => {
        const resumeId = improvedResume.resumeId;
        if (!acc[resumeId]) {
          acc[resumeId] = {
            resumeId,
            resume: improvedResume.resume,
            versions: [],
            totalVersions: 0,
            latestVersion: null,
          };
        }
        acc[resumeId].versions.push(improvedResume);
        acc[resumeId].totalVersions++;
        
        // Track latest version
        if (!acc[resumeId].latestVersion || improvedResume.version > acc[resumeId].latestVersion.version) {
          acc[resumeId].latestVersion = improvedResume;
        }
        
        return acc;
      }, {});
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      improvedResumes: transformedImprovedResumes,
      groupedByResume: groupedResumes ? Object.values(groupedResumes) : null,
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
    console.error('[IMPROVED_RESUMES] Error:', error);
    console.error('[IMPROVED_RESUMES] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve improved resumes', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 