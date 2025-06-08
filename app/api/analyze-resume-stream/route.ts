import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { streamingModelService } from '@/lib/models-streaming';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
// import { db } from '@/lib/db'; // Temporarily disabled

export const revalidate = 0;

/*
async function saveAnalysisInBackground(userId: string, fileName: string, analysis: any) {
  try {
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) {
      console.error('[STREAM_API] User not found in DB for background save.');
      return;
    }
    
    // Create a temporary resume record for now
    const resume = await db.resume.create({
      data: {
        userId: dbUser.id,
        fileName: fileName,
        storageKey: `streamed_${Date.now()}`, 
        uploadUrl: '', 
        fileUrl: '', // This was the missing field
      },
    });

    await db.analysis.create({
      data: {
        userId: dbUser.id,
        resumeId: resume.id,
        content: analysis,
        modelUsed: 'gpt-4o-mini-stream',
        overallScore: analysis.overall_score || 0,
        atsScore: analysis.ats_score || 0,
        improvements: [], 
      },
    });
    console.log('[STREAM_API] Background analysis save complete.');
  } catch (error) {
    console.error('[STREAM_API] Error saving analysis in background:', error);
  }
}
*/

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const clerkUser = await getCurrentUserFromDB();
    if (!clerkUser || clerkUser.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    
    const resumeFile = {
      filename: file.name,
      fileData: base64Data,
      mimeType: file.type,
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let accumulatedJson = '';

        try {
          const analysisStream = streamingModelService.analyzeResumeStream(user.id, resumeFile);

          for await (const chunk of analysisStream) {
            // The chunk is already a JSON string, so we just pass it along
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            
            // We still need to accumulate the JSON to save it at the end
            // This assumes the last chunk is the full object. A more robust
            // implementation might need a different strategy.
            try {
              const parsed = JSON.parse(chunk);
              if (parsed.overall_score) { // Heuristic to find the final payload
                accumulatedJson = chunk;
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }

          // After the stream is finished, save the full analysis
          /*
          if (accumulatedJson) {
            saveAnalysisInBackground(user.id, file.name, JSON.parse(accumulatedJson));
          }
          */

        } catch (error) {
          console.error('[STREAM_API] Error during stream generation:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[STREAM_API] General Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}