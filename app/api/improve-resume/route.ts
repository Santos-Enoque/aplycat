import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { streamingModelService } from "@/lib/models-streaming";
import type { ModelFileInput } from "@/lib/models";

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
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

    // Parse the JSON response
    const improvedResumeData = JSON.parse(response.content);

    console.log(`[IMPROVE_API] Improvement completed successfully for user ${user.id}`);

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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 