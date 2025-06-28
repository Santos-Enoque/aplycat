import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get the resume
    const resume = await db.resume.findFirst({
      where: { 
        id: id,
        userId: user.id,
        isActive: true 
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        uploadThingKey: true,
        mimeType: true,
        fileSize: true
      }
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    // Handle UploadThing files
    if (resume.uploadThingKey && resume.fileUrl.includes('uploadthing.com')) {
      // For UploadThing files, redirect to the URL with proper headers
      return NextResponse.redirect(resume.fileUrl);
    }

    // Handle Base64 data URLs
    if (resume.fileUrl.startsWith('data:')) {
      try {
        // Extract base64 data
        const [mimeInfo, base64Data] = resume.fileUrl.split(',');
        const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || resume.mimeType || 'application/octet-stream';
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Determine file extension
        const extension = mimeType.includes('pdf') ? '.pdf' : 
                         mimeType.includes('msword') ? '.doc' :
                         mimeType.includes('wordprocessingml') ? '.docx' : '';
        
        // Ensure filename has extension
        const fileName = resume.fileName.includes('.') ? 
                        resume.fileName : 
                        `${resume.fileName}${extension}`;

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (error) {
        console.error("[DOWNLOAD] Error processing base64 file:", error);
        return NextResponse.json(
          { success: false, error: "Failed to process file" },
          { status: 500 }
        );
      }
    }

    // If we get here, the file URL format is not recognized
    return NextResponse.json(
      { success: false, error: "Unsupported file format" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[DOWNLOAD] Error downloading resume:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}