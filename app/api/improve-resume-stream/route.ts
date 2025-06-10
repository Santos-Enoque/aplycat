import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { streamingModelService, type ModelFileInput } from "@/lib/models-consolidated";

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
    
    // The file data from the client is a data URL, we need to extract the base64 part
    const base64Data = originalFile.fileData.split(",")[1];
    const resumeFile = {
        ...originalFile,
        fileData: base64Data
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const improvementStream = streamingModelService.improveResumeStream(
            user.id,
            resumeFile,
            targetRole,
            targetIndustry,
            customPrompt
          );

          for await (const chunk of improvementStream) {
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }
        } catch (error) {
          console.error("[IMPROVE_STREAM_API] Error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "An unknown error occurred.";
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[IMPROVE_STREAM_API] General Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
} 