import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function POST(request: NextRequest) {
  console.log('[UPLOAD_RESUME] Starting resume upload...');
  
  try {
    const user = await currentUser();
    console.log('[UPLOAD_RESUME] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[UPLOAD_RESUME] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database to ensure they exist
    console.log('[UPLOAD_RESUME] Looking up user in database...');
    const dbUser = await getCurrentUserFromDB();
    console.log('[UPLOAD_RESUME] Database user:', dbUser ? `${dbUser.id} (${dbUser.email})` : 'null');
    
    if (!dbUser) {
      console.log('[UPLOAD_RESUME] User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { fileData, fileName } = await request.json();
    console.log('[UPLOAD_RESUME] Request data:', { 
      fileDataLength: fileData?.length || 0, 
      fileName,
      hasFileData: !!fileData 
    });

    if (!fileData || !fileName) {
      console.log('[UPLOAD_RESUME] Missing file data or name');
      return NextResponse.json(
        { error: 'File data and name are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      console.log('[UPLOAD_RESUME] Invalid file type:', fileName);
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Calculate file size (approximate from base64)
    const fileSize = Math.round((fileData.length * 3) / 4);
    console.log('[UPLOAD_RESUME] File size calculated:', fileSize, 'bytes');
    
    // Validate file size (10MB limit)
    if (fileSize > 10 * 1024 * 1024) {
      console.log('[UPLOAD_RESUME] File too large:', fileSize);
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Store resume in database
    console.log('[UPLOAD_RESUME] Creating resume record in database...');
    const resume = await db.resume.create({
      data: {
        userId: dbUser.id,
        fileName,
        fileUrl: `data:application/pdf;base64,${fileData}`, // Store as data URL for now
        fileSize,
        mimeType: 'application/pdf',
        title: fileName.replace('.pdf', ''), // Default title from filename
      },
    });

    console.log('[UPLOAD_RESUME] Resume created successfully:', {
      resumeId: resume.id,
      userId: resume.userId,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      title: resume.title
    });

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      fileName: resume.fileName,
      message: 'Resume uploaded successfully',
    });

  } catch (error: any) {
    console.error('[UPLOAD_RESUME] Error:', error);
    console.error('[UPLOAD_RESUME] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
} 