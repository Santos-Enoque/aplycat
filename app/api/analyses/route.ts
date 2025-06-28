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

    // Fetch user's analyses with related data
    const analyses = await db.analysis.findMany({
      where: { 
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
            improvedResumes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response
    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      fileName: analysis.fileName,
      overallScore: analysis.overallScore,
      atsScore: analysis.atsScore,
      scoreCategory: analysis.scoreCategory,
      mainRoast: analysis.mainRoast,
      creditsUsed: analysis.creditsUsed,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      improvementsCount: analysis._count.improvedResumes,
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
      hasImprovements: analysis._count.improvedResumes > 0
    }));

    return NextResponse.json({
      success: true,
      analyses: formattedAnalyses,
      total: formattedAnalyses.length,
      summary: {
        totalAnalyses: formattedAnalyses.length,
        averageAtsScore: formattedAnalyses.length > 0 
          ? Math.round(formattedAnalyses.reduce((sum, a) => sum + a.atsScore, 0) / formattedAnalyses.length)
          : 0,
        totalImprovements: formattedAnalyses.reduce((sum, a) => sum + a.improvementsCount, 0),
        totalCreditsUsed: formattedAnalyses.reduce((sum, a) => sum + a.creditsUsed, 0)
      }
    });

  } catch (error) {
    console.error("[API] Error fetching analyses:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}