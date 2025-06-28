import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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

    // Fetch user's resumes with related data
    const resumes = await db.resume.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        uploadThingKey: true,
        fileSize: true,
        mimeType: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        // Include related analyses count
        _count: {
          select: {
            analyses: true,
            improvedResumes: true
          }
        },
        // Include latest analysis data
        analyses: {
          select: {
            id: true,
            overallScore: true,
            atsScore: true,
            scoreCategory: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response
    const formattedResumes = resumes.map(resume => ({
      id: resume.id,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      uploadThingKey: resume.uploadThingKey,
      fileSize: resume.fileSize,
      mimeType: resume.mimeType,
      title: resume.title || resume.fileName.replace(/\.[^/.]+$/, ""),
      description: resume.description,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      analysesCount: resume._count.analyses,
      improvementsCount: resume._count.improvedResumes,
      latestAnalysis: resume.analyses[0] || null,
      // Determine file type for display
      fileType: resume.mimeType?.includes('pdf') ? 'PDF' : 
                resume.mimeType?.includes('word') ? 'DOC' : 'FILE',
      // Determine if it's UploadThing or Base64
      storageType: resume.uploadThingKey ? 'uploadthing' : 'base64'
    }));

    return NextResponse.json({
      success: true,
      resumes: formattedResumes,
      total: formattedResumes.length
    });

  } catch (error) {
    console.error("[API] Error fetching resumes:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}