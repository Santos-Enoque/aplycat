import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function POST(request: NextRequest) {
  console.log('[SAVE_RESUME] Starting resume metadata save...');
  
  try {
    const user = await currentUser();
    console.log('[SAVE_RESUME] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[SAVE_RESUME] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database to ensure they exist
    console.log('[SAVE_RESUME] Looking up user in database...');
    const dbUser = await getCurrentUserFromDB();
    console.log('[SAVE_RESUME] Database user:', dbUser ? `${dbUser.id} (${dbUser.email})` : 'null');
    
    if (!dbUser) {
      console.log('[SAVE_RESUME] User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { fileUrl, fileName, fileSize } = await request.json();
    console.log('[SAVE_RESUME] Request data:', { 
      fileUrl,
      fileName,
      fileSize
    });

    if (!fileUrl || !fileName) {
      console.log('[SAVE_RESUME] Missing required data');
      return NextResponse.json(
        { error: 'File URL and name are required' },
        { status: 400 }
      );
    }

    // Store resume metadata in database
    console.log('[SAVE_RESUME] Creating resume record in database...');
    const resume = await db.resume.create({
      data: {
        userId: dbUser.id,
        fileName,
        fileUrl, // UploadThing URL
        fileSize: fileSize || null,
        mimeType: 'application/pdf',
        title: fileName.replace('.pdf', ''), // Default title from filename
      },
    });

    console.log('[SAVE_RESUME] Resume metadata saved successfully:', {
      resumeId: resume.id,
      userId: resume.userId,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      fileSize: resume.fileSize,
      title: resume.title
    });

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      message: 'Resume metadata saved successfully',
    });

  } catch (error: any) {
    console.error('[SAVE_RESUME] Error:', error);
    console.error('[SAVE_RESUME] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to save resume metadata' },
      { status: 500 }
    );
  }
} 