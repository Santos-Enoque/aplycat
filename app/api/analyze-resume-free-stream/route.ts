import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/models-consolidated';
// import * as Sentry from '@sentry/nextjs';

// Rate limiting storage (in production, use Redis)
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
  const limit = 3; // 3 requests per hour
  
  const key = `rate_limit:${ip}`;
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

function createLimitedAnalysis(fullAnalysis: any) {
  // Return limited analysis for anonymous users
  const limited = {
    overall_score: fullAnalysis.overall_score,
    ats_score: fullAnalysis.ats_score,
    main_roast: fullAnalysis.main_roast,
    score_category: fullAnalysis.score_category,
    // Only show first 2 sections, blur the rest
    resume_sections: fullAnalysis.resume_sections?.slice(0, 2) || [],
    hidden_sections_count: Math.max(0, (fullAnalysis.resume_sections?.length || 0) - 2),
    missing_sections: fullAnalysis.missing_sections?.slice(0, 2) || [],
    is_limited: true,
    upgrade_message: "Sign up to see complete analysis with detailed feedback for all resume sections"
  };
  
  return limited;
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const clientIP = getClientIP(request);
  
  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetTime).toISOString();
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'You have reached the limit of 3 free analyses per hour. Please sign up for unlimited access.',
        resetTime: resetDate,
        upgradeUrl: '/signup?trial=true'
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate,
        }
      }
    );
  }

  try {
    let fileData: string;
    let fileName: string;

    // Handle both FormData (file upload) and JSON (base64 data)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload (same as authenticated version)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      fileName = file.name;
      
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      uint8Array.forEach(byte => binary += String.fromCharCode(byte));
      fileData = btoa(binary);
    } else {
      // Handle JSON request (base64 data)
      const body = await request.json();
      fileName = body.fileName;
      fileData = body.fileData;

      if (!fileName || !fileData) {
        return NextResponse.json(
          { error: 'Missing file data' },
          { status: 400 }
        );
      }

      // Extract base64 data from data URL if needed
      if (fileData.includes(',')) {
        fileData = fileData.split(',')[1];
      }
    }

    console.log(`[FREE-STREAM] Starting streaming analysis for IP: ${clientIP}`);

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send rate limit info first
          const rateLimitData = {
            type: 'rate_limit',
            data: {
              remaining: rateLimit.remaining,
              resetTime: new Date(rateLimit.resetTime).toISOString()
            },
            timestamp: new Date().toISOString()
          };
          controller.enqueue(`data: ${JSON.stringify(rateLimitData)}\n\n`);

          // Start the analysis
          const analysisStream = modelService.analyzeResumeStream('anonymous', {
            filename: fileName,
            fileData: fileData,
            mimeType: 'application/pdf',
          });

          let finalAnalysis: any = null;

          for await (const chunk of analysisStream) {
            try {
              const analysisData = JSON.parse(chunk);
              
              // Apply limitations to partial results
              if (analysisData) {
                const limitedData = createLimitedAnalysis(analysisData);
                finalAnalysis = limitedData;
                
                // Send the limited analysis
                controller.enqueue(`data: ${JSON.stringify(limitedData)}\n\n`);
              }
            } catch (parseError) {
              console.error('[FREE-STREAM] Error parsing chunk:', parseError);
              // Continue processing other chunks
            }
          }

          // Send completion signal
          if (finalAnalysis) {
            const completionData = {
              type: 'complete',
              data: finalAnalysis,
              timestamp: new Date().toISOString()
            };
            controller.enqueue(`data: ${JSON.stringify(completionData)}\n\n`);
          }

          console.log(`[FREE-STREAM] Analysis completed for IP: ${clientIP}`);
          controller.close();

        } catch (error) {
          console.error('[FREE-STREAM] Streaming error:', error);
          // Sentry.captureException(error);
          
          const errorData = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Analysis failed',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Limit': '3',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      },
    });

  } catch (error) {
    console.error('[FREE-STREAM] Error:', error);
    // Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 