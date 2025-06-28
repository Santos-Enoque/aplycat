import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

interface SaveAnalysisRequest {
  fileName: string;
  analysisData: any; // The complete analysis object
  resumeId?: string; // Optional resume ID if we have it
  overallScore: number;
  atsScore: number;
  scoreCategory: string;
  mainRoast: string;
  creditsUsed?: number;
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: SaveAnalysisRequest = await request.json();
    const { 
      fileName, 
      analysisData, 
      resumeId, 
      overallScore, 
      atsScore, 
      scoreCategory, 
      mainRoast,
      creditsUsed = 1 
    } = body;

    // Validate required fields
    if (!fileName || !analysisData || overallScore === undefined || atsScore === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create resume record
    let resume;
    if (resumeId) {
      // Try to find existing resume
      resume = await db.resume.findFirst({
        where: {
          id: resumeId,
          userId: user.id,
          isActive: true
        }
      });
    }

    if (!resume) {
      // Try to find resume by filename
      resume = await db.resume.findFirst({
        where: {
          fileName: fileName,
          userId: user.id,
          isActive: true
        },
        orderBy: { createdAt: 'desc' } // Get the most recent if multiple
      });
    }

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found. Please upload the resume first." },
        { status: 404 }
      );
    }

    // Check if analysis already exists for this resume
    const existingAnalysis = await db.analysis.findFirst({
      where: {
        resumeId: resume.id,
        userId: user.id,
        isCompleted: true
      }
    });

    if (existingAnalysis) {
      // Update existing analysis
      const updatedAnalysis = await db.analysis.update({
        where: { id: existingAnalysis.id },
        data: {
          fileName,
          overallScore,
          atsScore,
          scoreCategory,
          mainRoast,
          analysisData,
          creditsUsed,
          isCompleted: true,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: "Analysis updated successfully",
        analysisId: updatedAnalysis.id,
        resumeId: resume.id
      });
    } else {
      // Create new analysis
      const newAnalysis = await db.analysis.create({
        data: {
          userId: user.id,
          resumeId: resume.id,
          fileName,
          overallScore,
          atsScore,
          scoreCategory,
          mainRoast,
          analysisData,
          creditsUsed,
          isCompleted: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Analysis saved successfully",
        analysisId: newAnalysis.id,
        resumeId: resume.id
      });
    }

  } catch (error) {
    console.error("[SAVE_ANALYSIS] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}