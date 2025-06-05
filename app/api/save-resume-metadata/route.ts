// app/api/save-resume-metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function POST(request: NextRequest) {
  console.log('[METADATA_SAVE] Starting metadata save...');
  
  try {
    const user = await currentUser();
    console.log('[METADATA_SAVE] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[METADATA_SAVE] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[METADATA_SAVE] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const { fileName, fileSize, mimeType, fileUrl } = await request.json();
    console.log('[METADATA_SAVE] Request data:', { 
      fileName,
      fileSize,
      mimeType,
      fileUrl: fileUrl?.substring(0, 50) + '...' // Log truncated URL
    });

    if (!fileName) {
      console.log('[METADATA_SAVE] Missing required data');
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    // Create resume metadata record
    console.log('[METADATA_SAVE] Creating resume record in database...');
    const resume = await db.resume.create({
      data: {
        userId: dbUser.id,
        fileName,
        fileUrl: fileUrl || 'pending-upload',
        fileSize: fileSize || null,
        mimeType: mimeType || 'application/pdf',
        title: fileName.replace('.pdf', ''),
      },
    });

    console.log('[METADATA_SAVE] Resume metadata saved successfully:', {
      resumeId: resume.id,
      userId: resume.userId,
      fileName: resume.fileName,
      title: resume.title
    });

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      fileName: resume.fileName,
      message: 'Resume metadata saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[METADATA_SAVE] Error:', error);
    console.error('[METADATA_SAVE] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to save resume metadata',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}