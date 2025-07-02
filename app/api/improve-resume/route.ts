import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { streamingModelService, type ModelFileInput } from "@/lib/models-consolidated";
import { getCurrentUserFromDB, decrementUserCredits } from "@/lib/auth/user-sync";
import { db } from "@/lib/db";

export const revalidate = 0;

const IMPROVEMENT_COST = 2;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser || dbUser.credits < IMPROVEMENT_COST) {
      return NextResponse.json(
        { error: `Insufficient credits. This service costs ${IMPROVEMENT_COST} credits.` },
        { status: 402 }
      );
    }

    const {
      originalFile,
      targetRole,
      targetIndustry,
      customPrompt,
      resumeId,
    }: {
      originalFile: ModelFileInput;
      targetRole: string;
      targetIndustry: string;
      customPrompt?: string;
      resumeId?: string;
    } = await request.json();

    if (!originalFile || !targetRole || !targetIndustry) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Handle different file data formats
    let resumeFile = originalFile;
    
    // Check if fileData is a URL (UploadThing) or base64
    if (originalFile.fileData.startsWith('http')) {
      // It's a UploadThing URL, we need to fetch the file content
      console.log(`[IMPROVE_API] Fetching file from UploadThing URL: ${originalFile.fileData}`);
      
      try {
        const fileResponse = await fetch(originalFile.fileData);
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch file from URL");
        }
        
        const blob = await fileResponse.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        resumeFile = {
          ...originalFile,
          fileData: base64
        };
      } catch (fetchError) {
        console.error("[IMPROVE_API] Failed to fetch file from URL:", fetchError);
        return NextResponse.json(
          { error: "Failed to load resume file. Please try again." },
          { status: 400 }
        );
      }
    } else if (originalFile.fileData.includes(',')) {
      // It's a data URL, extract the base64 part
      const base64Data = originalFile.fileData.split(",")[1];
      resumeFile = {
        ...originalFile,
        fileData: base64Data
      };
    }

    console.log(`[IMPROVE_API] Starting improvement for user ${user.id}, role: ${targetRole}, industry: ${targetIndustry}`);

    // Use the non-streaming improve method
    const response = await streamingModelService.improveResume(
      targetRole,
      targetIndustry,
      customPrompt,
      resumeFile
    );

    // Parse the JSON response with additional cleaning
    let improvedResumeData;
    try {
      // Clean the response content in case it has markdown code blocks
      let cleanContent = response.content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7).trim();
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3).trim();
      }
      
      improvedResumeData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[IMPROVE_API] Failed to parse JSON response:", parseError);
      console.error("[IMPROVE_API] Raw response content:", response.content);
      throw new Error("Failed to process the AI response. Please try again.");
    }

    console.log(`[IMPROVE_API] Improvement completed successfully for user ${user.id}`);
    
    // Save improvement to database if resumeId is provided
    let savedImprovement = null;
    if (resumeId) {
      try {
        // Get the latest version number for this resume
        const latestImprovement = await db.improvedResume.findFirst({
          where: { resumeId },
          orderBy: { version: 'desc' },
          select: { version: true }
        });
        
        const nextVersion = (latestImprovement?.version || 0) + 1;
        
        // Calculate improvement score if available
        const improvementsAnalysis = improvedResumeData.improvementsAnalysis;
        const originalScore = improvementsAnalysis?.originalResumeEffectivenessEstimateForTarget
          ? parseInt(improvementsAnalysis.originalResumeEffectivenessEstimateForTarget)
          : null;
        const improvedScore = improvementsAnalysis?.targetOptimizedResumeScore
          ? parseInt(improvementsAnalysis.targetOptimizedResumeScore.split("-")[0])
          : null;
        const improvementPercentage = originalScore && improvedScore
          ? ((improvedScore - originalScore) / originalScore) * 100
          : null;
        
        // Save the improvement
        savedImprovement = await db.improvedResume.create({
          data: {
            userId: dbUser.id,
            resumeId,
            version: nextVersion,
            targetRole,
            targetIndustry,
            customPrompt,
            improvedResumeData: improvedResumeData,
            improvementSummary: improvementsAnalysis?.overallImprovementsSummary || null,
            keyChanges: improvementsAnalysis?.improvementSections || null,
            originalScore,
            improvedScore,
            improvementPercentage,
            creditsUsed: IMPROVEMENT_COST,
            processingTimeMs: Date.now() - startTime,
            modelUsed: "gpt-4", // Default model, could be enhanced to track actual model used
            isCompleted: true,
          }
        });
        
        // Update resume analytics
        const existingAnalytics = await db.resumeAnalytics.findUnique({
          where: { resumeId },
          select: { bestAnalysisScore: true }
        });
        
        await db.resumeAnalytics.upsert({
          where: { resumeId },
          create: {
            resumeId,
            viewCount: 0,
            analysisCount: 0,
            improvementCount: 1,
            exportCount: 0,
            shareCount: 0,
            lastImprovedAt: new Date(),
            bestAnalysisScore: improvedScore,
          },
          update: {
            improvementCount: { increment: 1 },
            lastImprovedAt: new Date(),
            bestAnalysisScore: improvedScore && (!existingAnalytics?.bestAnalysisScore || improvedScore > existingAnalytics.bestAnalysisScore) 
              ? improvedScore 
              : undefined,
          }
        });
        
        console.log(`[IMPROVE_API] Saved improvement to database with ID: ${savedImprovement.id}`);
      } catch (dbError) {
        console.error("[IMPROVE_API] Failed to save improvement to database:", dbError);
        // Don't fail the request if DB save fails
      }
    }
    
    await decrementUserCredits(user.id, IMPROVEMENT_COST);
    console.log(`[IMPROVE_API] Deducted ${IMPROVEMENT_COST} credits from user ${user.id}`);

    return NextResponse.json({
      success: true,
      improvedResume: improvedResumeData,
      targetRole,
      targetIndustry,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      improvementId: savedImprovement?.id,
    });

  } catch (error) {
    console.error("[IMPROVE_API] Error:", error);
    
    // Determine user-friendly error message
    let userFriendlyMessage = "We're experiencing technical difficulties. Please try again later.";
    
    if (error instanceof Error) {
      // Check for specific error types to provide more helpful messages
      if (error.message.includes("credits")) {
        userFriendlyMessage = error.message; // Credit-related errors are already user-friendly
      } else if (error.message.includes("Failed to process the AI response")) {
        userFriendlyMessage = "There was an issue processing your resume. Please try again.";
      } else if (error.message.includes("API")) {
        userFriendlyMessage = "Our AI service is temporarily unavailable. Please try again in a few minutes.";
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: userFriendlyMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 