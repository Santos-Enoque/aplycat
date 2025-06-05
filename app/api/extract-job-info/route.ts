import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { modelService } from '@/lib/models';
import { 
  JOB_EXTRACTION_SYSTEM_PROMPT, 
  JOB_EXTRACTION_USER_PROMPT 
} from '@/lib/prompts/resume-prompts';

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

    console.log('[EXTRACT_JOB_INFO] Sending to model service with web search tool...');
    
    // Use the model service for job extraction with web search tool
    const tools = [
      {
        "type": "web_search_preview",
        "user_location": {
          "type": "approximate"
        },
        "search_context_size": "medium"
      }
    ];

    const response = await modelService.extractJobInfo(
      JOB_EXTRACTION_SYSTEM_PROMPT,
      JOB_EXTRACTION_USER_PROMPT(jobUrl),
      tools
    );

    const result = response.content;
    
    if (!result) {
      throw new Error('No response from model service');
    }

    console.log(`[EXTRACT_JOB_INFO] Model response length: ${result.length} characters`);

    // Parse the JSON response
    let jobInfo;
    try {
      // Clean up the response text
      let cleanedResult = result.trim();
      
      if (cleanedResult.startsWith('```json')) {
        cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      jobInfo = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', result);
      throw new Error('Failed to parse job information from response');
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
    
    return NextResponse.json(
      { 
        error: 'Failed to extract job information',
        details: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 