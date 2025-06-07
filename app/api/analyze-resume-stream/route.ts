import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { streamingModelService } from '@/lib/models-streaming';
import { parseOpenAIResponse } from '@/lib/json-parser';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[STREAMING_ANALYSIS] Starting streaming analysis request...');
  
  try {
    const user = await currentUser();
    console.log('[STREAMING_ANALYSIS] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[STREAMING_ANALYSIS] No authenticated user found');
      return new Response('Unauthorized', { status: 401 });
    }

    const { fileData, fileName } = await request.json();
    
    if (!fileData || !fileName) {
      console.log('[STREAMING_ANALYSIS] Missing file data or name');
      return new Response('Missing file data', { status: 400 });
    }

    // Get database user for background operations
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[STREAMING_ANALYSIS] Database user not found');
      return new Response('User not found in database', { status: 404 });
    }

    // Start background operations immediately (non-blocking)
    const backgroundOpsPromise = startBackgroundOperations(dbUser.id, fileData, fileName);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[STREAMING_ANALYSIS] Starting analysis stream...');
          
          // Start analysis stream
          const analysisStream = await streamingModelService.analyzeResumeStream({
            filename: fileName,
            fileData: fileData,
            mimeType: 'application/pdf'
          });

          let accumulatedContent = '';
          let finalAnalysis = null;
          
          for await (const chunk of analysisStream) {
            console.log(`[STREAMING_ANALYSIS] Received chunk: ${chunk.type}`);
            
            if (chunk.type === 'partial_analysis' && chunk.data) {
              // Send partial analysis updates
              const streamChunk = JSON.stringify({
                type: 'partial_analysis',
                data: chunk.data,
                timestamp: chunk.timestamp,
                progress: chunk.progress || 0
              }) + '\n';
              
              controller.enqueue(new TextEncoder().encode(streamChunk));
            } else if (chunk.type === 'complete_analysis' && chunk.data) {
              // Store final analysis for database save
              finalAnalysis = chunk.data;
              
              // Send final complete analysis
              const finalChunk = JSON.stringify({
                type: 'complete_analysis',
                data: chunk.data,
                timestamp: chunk.timestamp,
                progress: 100
              }) + '\n';
              
              controller.enqueue(new TextEncoder().encode(finalChunk));
            } else if (chunk.type === 'error') {
              // Send error
              const errorChunk = JSON.stringify({
                type: 'error',
                error: chunk.error || 'Analysis failed',
                timestamp: chunk.timestamp
              }) + '\n';
              
              controller.enqueue(new TextEncoder().encode(errorChunk));
              controller.close();
              return;
            }
          }

          // Save to database in background after streaming completes
          if (finalAnalysis) {
            console.log('[STREAMING_ANALYSIS] Saving final analysis to database...');
            backgroundOpsPromise.then(async (backgroundResult) => {
              await saveAnalysisToDatabase(dbUser.id, finalAnalysis, fileName, backgroundResult, Date.now() - startTime);
              console.log('[STREAMING_ANALYSIS] Background operations completed');
            }).catch((error) => {
              console.error('[STREAMING_ANALYSIS] Background operations failed:', error);
            });
          }
          
          controller.close();
        } catch (error) {
          console.error('[STREAMING_ANALYSIS] Stream error:', error);
          const errorChunk = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Analysis failed',
            timestamp: new Date().toISOString()
          }) + '\n';
          
          controller.enqueue(new TextEncoder().encode(errorChunk));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[STREAMING_ANALYSIS] Error after ${processingTime}ms:`, error);
    
    return new Response(JSON.stringify({
      type: 'error',
      error: 'Streaming analysis failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background operations that don't block the response
async function startBackgroundOperations(userId: string, fileData: string, fileName: string) {
  const operationId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[STREAMING_ANALYSIS] Starting background operations: ${operationId}`);
  
  try {
    // These operations can run in parallel
    const [uploadResult, resumeRecord] = await Promise.all([
      // 1. Upload to UploadThing (if implemented)
      uploadToStorage(fileData, fileName),
      // 2. Create initial resume record
      createInitialResumeRecord(userId, fileName, fileData)
    ]);

    console.log(`[STREAMING_ANALYSIS] Background operations completed: ${operationId}`);
    return { 
      operationId, 
      uploadResult, 
      resumeRecord,
      success: true 
    };
  } catch (error) {
    console.error(`[STREAMING_ANALYSIS] Background operations failed: ${operationId}`, error);
    return { 
      operationId, 
      error: error instanceof Error ? error.message : 'Background operations failed',
      success: false 
    };
  }
}

async function uploadToStorage(fileData: string, fileName: string) {
  // TODO: Implement actual UploadThing upload
  // For now, return a mock result
  console.log('[STREAMING_ANALYSIS] Mock file upload completed');
  return {
    url: `data:application/pdf;base64,${fileData}`, // Temporary
    fileKey: `temp-${Date.now()}`,
    fileName: fileName
  };
}

async function createInitialResumeRecord(userId: string, fileName: string, fileData: string) {
  const { db } = await import('@/lib/db');
  
  try {
    const resume = await db.resume.create({
      data: {
        userId,
        fileName,
        fileUrl: `data:application/pdf;base64,${fileData}`, // Temporary
        fileSize: Math.round((fileData.length * 3) / 4), // Approximate size
        mimeType: 'application/pdf',
        title: fileName.replace('.pdf', ''),
      },
    });

    console.log('[STREAMING_ANALYSIS] Resume record created:', resume.id);
    return resume;
  } catch (error) {
    console.error('[STREAMING_ANALYSIS] Failed to create resume record:', error);
    throw error;
  }
}

async function saveAnalysisToDatabase(
  userId: string, 
  analysisData: any, 
  fileName: string, 
  backgroundResult: any,
  processingTime: number
) {
  const { db } = await import('@/lib/db');
  const { dashboardCache } = await import('@/lib/redis-cache');
  
  try {
    if (!backgroundResult.success || !backgroundResult.resumeRecord) {
      console.error('[STREAMING_ANALYSIS] Cannot save analysis - background operations failed');
      return;
    }

    console.log('[STREAMING_ANALYSIS] Saving analysis to database...');
    
    // Create analysis record
    const savedAnalysis = await db.analysis.create({
      data: {
        userId,
        resumeId: backgroundResult.resumeRecord.id,
        fileName,
        processingTimeMs: processingTime,
        overallScore: analysisData.overall_score || 0,
        atsScore: analysisData.ats_score || 0,
        scoreCategory: analysisData.score_category || 'Unknown',
        mainRoast: analysisData.main_roast || 'Analysis completed',
        analysisData,
        creditsUsed: 1, // Cost for analysis
        isCompleted: true,
      },
    });

    console.log('[STREAMING_ANALYSIS] Analysis saved:', savedAnalysis.id);

    // Record credit transaction
    await db.creditTransaction.create({
      data: {
        userId,
        type: 'ANALYSIS_USE',
        amount: -1, // Deduct 1 credit
        description: `Streaming resume analysis: ${fileName}`,
        relatedAnalysisId: savedAnalysis.id,
      },
    });

    // Update user's credit count
    await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 1 },
        totalCreditsUsed: { increment: 1 },
      },
    });

    console.log('[STREAMING_ANALYSIS] Credits deducted and transaction recorded');

    // Invalidate user cache after successful analysis
    await dashboardCache.invalidateAnalysis(savedAnalysis.id, userId);

    return savedAnalysis;
  } catch (error) {
    console.error('[STREAMING_ANALYSIS] Failed to save analysis to database:', error);
    throw error;
  }
}