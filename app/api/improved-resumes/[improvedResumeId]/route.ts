import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ improvedResumeId: string }> }
) {
  const { improvedResumeId } = await params;
  console.log('[GET_IMPROVED_RESUME] Starting request for improved resume:', improvedResumeId);
  
  try {
    const user = await currentUser();
    console.log('[GET_IMPROVED_RESUME] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[GET_IMPROVED_RESUME] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[GET_IMPROVED_RESUME] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get the specific improved resume
    const improvedResume = await db.improvedResume.findFirst({
      where: {
        id: improvedResumeId,
        userId: dbUser.id, // Ensure user can only access their own improved resumes
        isCompleted: true,
        isActive: true,
      },
      include: {
        resume: {
          select: {
            id: true,
            fileName: true,
            title: true,
            fileUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!improvedResume) {
      console.log('[GET_IMPROVED_RESUME] Improved resume not found or access denied');
      return NextResponse.json(
        { error: 'Improved resume not found or you do not have access to it' },
        { status: 404 }
      );
    }

    console.log('[GET_IMPROVED_RESUME] Found improved resume:', {
      improvedResumeId: improvedResume.id,
      resumeId: improvedResume.resumeId,
      version: improvedResume.version,
      targetRole: improvedResume.targetRole,
      targetIndustry: improvedResume.targetIndustry,
      createdAt: improvedResume.createdAt
    });

    // Return the full improved resume data
    return NextResponse.json({
      success: true,
      improvedResume: {
        id: improvedResume.id,
        resumeId: improvedResume.resumeId,
        version: improvedResume.version,
        versionName: improvedResume.versionName,
        targetRole: improvedResume.targetRole,
        targetIndustry: improvedResume.targetIndustry,
        customPrompt: improvedResume.customPrompt,
        improvedResumeData: improvedResume.improvedResumeData, // Full improved resume results
        improvementSummary: improvedResume.improvementSummary,
        keyChanges: improvedResume.keyChanges,
        originalScore: improvedResume.originalScore,
        improvedScore: improvedResume.improvedScore,
        improvementPercentage: improvedResume.improvementPercentage,
        fileName: improvedResume.fileName,
        generatedFileUrl: improvedResume.generatedFileUrl,
        creditsUsed: improvedResume.creditsUsed,
        processingTimeMs: improvedResume.processingTimeMs,
        modelUsed: improvedResume.modelUsed,
        isFavorite: improvedResume.isFavorite,
        createdAt: improvedResume.createdAt,
        updatedAt: improvedResume.updatedAt,
        resume: improvedResume.resume,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[GET_IMPROVED_RESUME] Error:', error);
    console.error('[GET_IMPROVED_RESUME] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve improved resume', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ improvedResumeId: string }> }
) {
  const { improvedResumeId } = await params;
  console.log('[UPDATE_IMPROVED_RESUME] Starting update for improved resume:', improvedResumeId);
  
  try {
    const user = await currentUser();
    console.log('[UPDATE_IMPROVED_RESUME] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[UPDATE_IMPROVED_RESUME] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[UPDATE_IMPROVED_RESUME] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[UPDATE_IMPROVED_RESUME] Request body:', requestBody);

    const { versionName, isFavorite, improvedResumeData } = requestBody;

    // Build update data
    const updateData: any = {};
    if (versionName !== undefined) {
      updateData.versionName = versionName;
    }
    if (isFavorite !== undefined) {
      updateData.isFavorite = isFavorite;
    }
    if (improvedResumeData !== undefined) {
      updateData.improvedResumeData = improvedResumeData;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the improved resume
    const updatedImprovedResume = await db.improvedResume.update({
      where: {
        id: improvedResumeId,
        userId: dbUser.id, // Ensure user can only update their own improved resumes
      },
      data: updateData,
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
    });

    console.log('[UPDATE_IMPROVED_RESUME] Updated improved resume:', {
      improvedResumeId: updatedImprovedResume.id,
      versionName: updatedImprovedResume.versionName,
      isFavorite: updatedImprovedResume.isFavorite,
      hasImprovedResumeData: !!updatedImprovedResume.improvedResumeData,
    });

    return NextResponse.json({
      success: true,
      improvedResume: {
        id: updatedImprovedResume.id,
        resumeId: updatedImprovedResume.resumeId,
        version: updatedImprovedResume.version,
        versionName: updatedImprovedResume.versionName,
        targetRole: updatedImprovedResume.targetRole,
        targetIndustry: updatedImprovedResume.targetIndustry,
        improvedResumeData: updatedImprovedResume.improvedResumeData, // Include full data
        isFavorite: updatedImprovedResume.isFavorite,
        updatedAt: updatedImprovedResume.updatedAt,
        resume: updatedImprovedResume.resume,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[UPDATE_IMPROVED_RESUME] Error:', error);
    console.error('[UPDATE_IMPROVED_RESUME] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to update improved resume', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ improvedResumeId: string }> }
) {
  const { improvedResumeId } = await params;
  console.log('[DELETE_IMPROVED_RESUME] Starting deletion for improved resume:', improvedResumeId);
  
  try {
    const user = await currentUser();
    console.log('[DELETE_IMPROVED_RESUME] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[DELETE_IMPROVED_RESUME] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[DELETE_IMPROVED_RESUME] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const deletedImprovedResume = await db.improvedResume.update({
      where: {
        id: improvedResumeId,
        userId: dbUser.id, // Ensure user can only delete their own improved resumes
      },
      data: {
        isActive: false,
      },
    });

    console.log('[DELETE_IMPROVED_RESUME] Soft deleted improved resume:', {
      improvedResumeId: deletedImprovedResume.id,
      version: deletedImprovedResume.version,
    });

    return NextResponse.json({
      success: true,
      message: 'Improved resume deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[DELETE_IMPROVED_RESUME] Error:', error);
    console.error('[DELETE_IMPROVED_RESUME] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete improved resume', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 