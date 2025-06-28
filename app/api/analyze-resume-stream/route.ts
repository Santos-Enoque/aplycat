import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { streamingModelService } from '@/lib/models-consolidated';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
// import { db } from '@/lib/db'; // Temporarily disabled

// Rate limiting storage for users with 0 credits (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

function getClientIP(request: NextRequest): string {
  // Try various headers to get the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default (this shouldn't happen in production)
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const limit = 5; // 5 requests per hour for users with 0 credits
  
  const key = `rate_limit_auth:${ip}`;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (current.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
}

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
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Resume analysis is now free, but rate limited for users with 0 credits
    if (clerkUser.credits === 0) {
      // Check rate limit for users with 0 credits (5 per hour per IP)
      const ip = getClientIP(request);
      const rateLimit = checkRateLimit(ip);
      
      if (!rateLimit.allowed) {
        const resetDate = new Date(rateLimit.resetTime).toISOString();
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'You have reached the limit of 5 free analyses per hour. Purchase credits for unlimited access.',
            resetTime: resetDate,
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetDate,
            }
          }
        );
      }
    }
    // Users with 1+ credits get unlimited analysis

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
        let streamSuccessful = false;

        try {
          const analysisStream = streamingModelService.analyzeResumeStream(user.id, resumeFile);

          for await (const chunk of analysisStream) {
            // Check if controller is still open before writing
            try {
              // The chunk is already a JSON string, so we just pass it along
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            } catch (controllerError) {
              console.log('[STREAM_API] Controller closed, stopping stream:', controllerError.message);
              // Client disconnected, break the loop gracefully
              break;
            }
            
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

          streamSuccessful = true;

        } catch (error) {
          console.error('[STREAM_API] Error during stream generation:', error);
          
          // Provide user-friendly error message
          let userFriendlyMessage = "We're experiencing technical difficulties. Please try again later.";
          
          if (error instanceof Error) {
            if (error.message.includes("credits")) {
              userFriendlyMessage = "Insufficient credits to analyze resume.";
            } else if (error.message.includes("API")) {
              userFriendlyMessage = "Our AI service is temporarily unavailable. Please try again in a few minutes.";
            } else if (error.message.includes("parse") || error.message.includes("JSON")) {
              userFriendlyMessage = "There was an issue processing your resume. Please try again.";
            }
          }
          
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: userFriendlyMessage })}\n\n`));
        } finally {
          if (streamSuccessful) {
            console.log(`[STREAM_API] Analysis completed successfully for user ${user.id} - no credits deducted (analysis is now free)`);
          }
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
    
    // Provide user-friendly error message
    let userFriendlyMessage = "We're experiencing technical difficulties. Please try again later.";
    
    if (error instanceof Error) {
      if (error.message.includes("credits")) {
        userFriendlyMessage = "Insufficient credits to analyze resume.";
      } else if (error.message.includes("Unauthorized")) {
        userFriendlyMessage = "Please log in to analyze your resume.";
      } else if (error.message.includes("file")) {
        userFriendlyMessage = "There was an issue with your file. Please try uploading again.";
      }
    }
    
    return NextResponse.json({ error: userFriendlyMessage }, { status: 500 });
  }
}