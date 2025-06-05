import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Your primary function is to act as a job posting information extractor. I will provide you with URLs. You will analyze the content of the page at the given URL.

1.  **If the URL clearly points to a job posting:**
    You MUST process the content and return a clean JSON object strictly following this format:
    \`\`\`json
    {
      "job_title": "[Job Title]",
      "company_name": "[Company Name]",
      "job_description": "[A summary focused on: job responsibilities, candidate requirements (experience, education), and the technical stack. Exclude information like company mission statements, benefits unless they are core to the role's requirements, and application instructions.]"
    }
    \`\`\`
    If a value for a field (job_title, company_name, job_body) is not found on a job posting page, use \`null\` for that specific field. Your entire response in this case must be *only* this JSON object.

2.  **If the URL does NOT appear to be a job posting or if you cannot confidently extract job-related information:**
    You MUST return the following JSON object:
    \`\`\`json
    {
      "message": "did not find any job posting information"
    }
    \`\`\`
    Your entire response in this case must be *only* this specific JSON object.

It is critical that your entire response is *only* the appropriate JSON object as specified above. Do not add any conversational fluff, explanations, or additional text outside the JSON structure.`;

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

    // Use OpenAI's web search tool instead of direct fetch to avoid 403 errors
    const USER_PROMPT = `This is the job posting url: ${jobUrl}

Please analyze this job posting URL and extract the relevant information.`;

    console.log('[EXTRACT_JOB_INFO] Sending to OpenAI with web search tool...');
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
      text: {
        "format": {
          "type": "text"
        }
      },
      reasoning: {},
      tools: [
        {
          "type": "web_search_preview",
          "user_location": {
            "type": "approximate"
          },
          "search_context_size": "medium"
        }
      ],
      temperature: 0.1,
      max_output_tokens: 1000,
      top_p: 1,
      store: true
    });

    const result = completion.output_text;
    
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    console.log(`[EXTRACT_JOB_INFO] OpenAI response length: ${result.length} characters`);

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