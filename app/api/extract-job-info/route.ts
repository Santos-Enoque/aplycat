import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { modelService } from '@/lib/models-consolidated';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[EXTRACT_JOB_INFO] Starting job extraction request...');
  
  try {
    const user = await currentUser();
    console.log('[EXTRACT_JOB_INFO] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[EXTRACT_JOB_INFO] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    console.log('[EXTRACT_JOB_INFO] Request body:', {
      hasJobUrl: !!requestBody.jobUrl,
      jobUrl: requestBody.jobUrl,
    });

    const { jobUrl } = requestBody;

    if (!jobUrl) {
      return NextResponse.json(
        { error: 'Job URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(jobUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('[EXTRACT_JOB_INFO] Sending to model service...');
    
    // Force OpenAI for URL extraction operations since web search tools are incompatible with Gemini
    // This ensures reliable URL processing regardless of the default model configuration
    const response = await modelService.extractJobInfo(jobUrl, undefined, true); // true = forceOpenAI

    const result = response.content;
    
    if (!result) {
      throw new Error('No response from model service');
    }

    console.log(`[EXTRACT_JOB_INFO] Model response length: ${result.length} characters`);

    // Parse the JSON response with enhanced cleaning
    let jobInfo;
    let cleanedResult = '';
    try {
      // Enhanced JSON cleaning
      cleanedResult = result.trim();
      
      // Remove markdown code blocks
      if (cleanedResult.startsWith('```json')) {
        cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove HTML comments (like <!-- Generated using fallback model -->)
      cleanedResult = cleanedResult.replace(/<!--[\s\S]*?-->/g, '').trim();
      
      // Remove any trailing text after the JSON
      const jsonMatch = cleanedResult.match(/^\s*{[\s\S]*}\s*/);
      if (jsonMatch) {
        cleanedResult = jsonMatch[0].trim();
      }

      jobInfo = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', result);
      console.error('Cleaned result that failed to parse:', cleanedResult);
      throw new Error('Unable to process the job information. Please try again.');
    }

    const processingTime = Date.now() - startTime;

    console.log('[EXTRACT_JOB_INFO] Job extraction completed successfully:', {
      hasJobTitle: !!jobInfo.job_title,
      hasCompanyName: !!jobInfo.company_name,
      hasJobDescription: !!jobInfo.job_description,
      hasMessage: !!jobInfo.message,
    });

    return NextResponse.json({
      success: true,
      ...jobInfo,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[EXTRACT_JOB_INFO] Error:', error);
    console.error('[EXTRACT_JOB_INFO] Stack trace:', error.stack);
    
    // Provide user-friendly error messages
    let userFriendlyMessage = "We're experiencing technical difficulties. Please try again later.";
    
    if (error instanceof Error) {
      if (error.message.includes("Unable to process the job information")) {
        userFriendlyMessage = "Unable to extract job information from this URL. Please try a different job posting.";
      } else if (error.message.includes("Invalid URL")) {
        userFriendlyMessage = "Please provide a valid job posting URL.";
      } else if (error.message.includes("credits")) {
        userFriendlyMessage = "Insufficient credits to extract job information.";
      } else if (error.message.includes("API")) {
        userFriendlyMessage = "Our AI service is temporarily unavailable. Please try again in a few minutes.";
      } else if (error.message.includes("Authentication")) {
        userFriendlyMessage = "Please log in to extract job information.";
      }
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyMessage,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 