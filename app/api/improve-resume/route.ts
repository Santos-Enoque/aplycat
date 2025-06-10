import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { streamingModelService, type ModelFileInput } from "@/lib/models-consolidated";
import { getCurrentUserFromDB, decrementUserCredits } from "@/lib/auth/user-sync";

export const revalidate = 0;

const IMPROVEMENT_COST = 2;

export async function POST(request: NextRequest) {
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
    }: {
      originalFile: ModelFileInput;
      targetRole: string;
      targetIndustry: string;
      customPrompt?: string;
    } = await request.json();

    if (!originalFile || !targetRole || !targetIndustry) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Extract base64 data from data URL if needed
    let resumeFile = originalFile;
    if (originalFile.fileData.includes(',')) {
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
    
    await decrementUserCredits(user.id, IMPROVEMENT_COST);
    console.log(`[IMPROVE_API] Deducted ${IMPROVEMENT_COST} credits from user ${user.id}`);

    return NextResponse.json({
      success: true,
      improvedResume: improvedResumeData,
      targetRole,
      targetIndustry,
      processingTimeMs: Date.now(), // You could measure actual time if needed
      timestamp: new Date().toISOString(),
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