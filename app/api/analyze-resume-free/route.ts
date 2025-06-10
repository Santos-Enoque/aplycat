// app/api/analyze-resume-free/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
// @ts-ignore
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { getClientIP } from '@/lib/middleware/edge-security';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting for free analysis (more restrictive)
const freeAnalysisLimits = new Map<string, { count: number; resetTime: number }>();
const FREE_RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_FREE_REQUESTS = 5; // Increased slightly for better user experience

function checkFreeRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = freeAnalysisLimits.get(ip);

  if (!limit || now > limit.resetTime) {
    freeAnalysisLimits.set(ip, {
      count: 1,
      resetTime: now + FREE_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= MAX_FREE_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    if (!checkFreeRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. You can analyze 5 resumes per hour for free. Upgrade for unlimited analysis!',
          upgrade_suggested: true,
        },
        { status: 429 }
      );
    }

    const { fileName, fileData } = await request.json();

    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: 'Missing fileName or fileData' },
        { status: 400 }
      );
    }
    const base64String = fileData.split(',')[1] || fileData;

    const systemPrompt = `You are a brutally honest, witty, and highly experienced resume reviewer for a company called "Aplycat". Your goal is to give users instant, harsh, but invaluable feedback on their resumes so they can stop getting rejected.
      Your task is to return a JSON object with the following structure. Some fields are for premium users and you should fill them with specific placeholder text.
      {
        "overall_score": <number from 1 to 100, your overall assessment>,
        "ats_score": <number from 1 to 100, how well it would pass an Applicant Tracking System>,
        "main_roast": "<string, a short, witty, and brutally honest one-paragraph summary of the main issues>",
        "summary": {
           "strengths": "<string, a 1-2 sentence summary of what the resume does well. Keep it brief.>",
           "weaknesses": "<string, a 1-2 sentence summary of the main areas for improvement.>"
        },
        "resume_sections": [
          {
            "section_name": "<string, e.g., 'Summary', 'Experience', 'Education', 'Skills'>",
            "score": <number, a score from 1-100 for this specific section>,
            "roast": "<string, a 1-2 sentence roast of this specific section>",
            "improvement": "Upgrade to unlock AI-powered improvements for this section."
          }
        ],
        "keyword_analysis": {
          "found_keywords": [],
          "missing_keywords": [],
          "placeholder_text": "Upgrade to see how your resume keywords stack up against top-ranking resumes."
        },
        "is_free_analysis": true
      }

      Rules:
      - Be brutally honest but also provide constructive criticism implicitly through the roast.
      - The main_roast should be funny and memorable.
      - Identify at least 3-4 key sections of the resume to roast individually. If you can't find clear sections, make educated guesses (e.g., "Opening Statement", "Work History").
      - Keep all roasts and summaries concise.
      - The scores should genuinely reflect the resume's quality. A terrible resume should get a low score.
      - For 'improvement', 'found_keywords', and 'missing_keywords', you MUST use the exact placeholder text provided above. Do not generate content for these fields.
      - IMPORTANT: The final output must be a single, valid JSON object. Do not include any text or formatting outside of the JSON structure.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      stream: true,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Here is the resume to analyze. It is a base64 encoded file named "${fileName}". File Content: ${base64String}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        console.log(`[FREE_ANALYSIS_STREAM] Started for ${fileName} from IP: ${clientIP.substring(0, 8)}***`);
      },
      onCompletion: async (completion: string) => {
        console.log(`[FREE_ANALYSIS_STREAM] Completed for ${fileName}. Length: ${completion.length}`);
      },
    });

    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('[FREE_ANALYSIS_STREAM] Error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred while analyzing your resume. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}