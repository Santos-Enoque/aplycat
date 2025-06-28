import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: PageProps
) {
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

    // Get analysis ID from params
    const resolvedParams = await params;
    const analysisId = resolvedParams.id;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    // Fetch the specific analysis
    const analysis = await db.analysis.findFirst({
      where: {
        id: analysisId,
        userId: user.id,
        isCompleted: true
      },
      select: {
        id: true,
        fileName: true,
        overallScore: true,
        atsScore: true,
        scoreCategory: true,
        mainRoast: true,
        analysisData: true,
        creditsUsed: true,
        createdAt: true,
        updatedAt: true,
        // Include resume data
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            uploadThingKey: true,
            title: true
          }
        },
        // Include related improvements count
        _count: {
          select: {
            improvements: true
          }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedAnalysis = {
      id: analysis.id,
      fileName: analysis.fileName,
      overallScore: analysis.overallScore,
      atsScore: analysis.atsScore,
      scoreCategory: analysis.scoreCategory,
      mainRoast: analysis.mainRoast,
      creditsUsed: analysis.creditsUsed,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      analysisData: analysis.analysisData,
      improvementsCount: analysis._count.improvements,
      resume: analysis.resume ? {
        id: analysis.resume.id,
        fileName: analysis.resume.fileName,
        title: analysis.resume.title || analysis.resume.fileName.replace(/\.[^/.]+$/, ""),
        fileUrl: analysis.resume.fileUrl,
        storageType: analysis.resume.uploadThingKey ? 'uploadthing' : 'base64'
      } : null,
      // Add some derived fields for UI
      scoreGrade: analysis.atsScore >= 80 ? 'excellent' : 
                  analysis.atsScore >= 60 ? 'good' : 
                  analysis.atsScore >= 40 ? 'fair' : 'poor',
      hasImprovements: analysis._count.improvements > 0
    };

    return NextResponse.json({
      success: true,
      analysis: formattedAnalysis
    });

  } catch (error) {
    console.error("[API] Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}