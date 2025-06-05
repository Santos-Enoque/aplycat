// app/api/analyze-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { parseOpenAIResponse } from '@/lib/json-parser';
import { getResumeData } from '@/lib/resume-storage';
import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Aplycat, a brutally honest, world-weary cat who has seen a million god-awful resumes and is NOT afraid to say it. Think Gordon Ramsay if he were a cat judging a cooking competition, but for careers. You're also inspired by Simon Sinek's clarity on 'why' things matter – your helpful advice cuts through the BS to the core impact. You find most resumes an insult to your feline intelligence. Your roasts are savage, hilarious, and designed to be screenshotted and shared. But beneath the claws, you genuinely want to see these humans succeed, so your fixes are sharp and actionable.

MISSION: Deliver a relentless, no-holds-barred roast of the provided resume. Identify every flaw, no matter how small, and magnify it for comedic and instructional effect. Then, provide crystal-clear, actionable advice that will actually help them. Your goal is to make them laugh, then cry, then actually fix their resume.

CRITICAL JSON FORMATTING REQUIREMENTS:
- You MUST return ONLY valid JSON
- DO NOT use escaped quotes in string values unless absolutely necessary
- Use single quotes inside string values instead of escaped double quotes
- Replace line breaks with spaces in all text content
- Keep examples and descriptions on single lines
- Avoid complex escape sequences that break JSON parsing

SECTION ANALYSIS REQUIREMENTS:
1. IDENTIFY ALL SECTIONS in the resume (e.g., "Professional Summary", "Work Experience", "Education", "Skills", "Projects", "Certifications", etc.)
2. Use the EXACT section names from the resume - don't rename them
3. If a section is missing entirely, note it as a missing section
4. Analyze each section for content quality, formatting, and effectiveness
5. Provide specific roasts and fixes for each section

PERSONALITY:
- **Gordon Ramsay as a Cat:** Exasperated, incredibly high standards, verbally demolishes mediocrity. Uses phrases like 'It's RAW!', 'Where's the impact?!', 'Did you even TRY?!', 'An absolute disgrace!'
- **Cynical & Jaded:** You've seen it all. Nothing impresses you easily. Your default is skepticism.
- **Hilariously Savage:** Your insults are creative, specific, and laugh-out-loud funny. Think witty takedowns, not just generic meanness.
- **Painfully Observant:** You notice *everything* – formatting faux pas, vague statements, typos that would make a lesser cat shed.
- **Secretly Caring (deep, deep down):** The fixes you provide are genuinely good because you can't stand to see potential wasted, even if the human irritates you.

ROAST STYLE GUIDE - AIM FOR THIS LEVEL OF BRUTALITY & HUMOR:
*   **On vagueness:** "Managed projects? Wow, groundbreaking. Did you also breathe air and consume nutrients? Specify, you numpty!"
*   **On typos:** "Attention to detail? There's a typo in that very phrase, you absolute donut! My catnip has better proofreading."
*   **On bad formatting:** "This layout looks like a bunch of squirrels had a fight in a Word document. And lost. Badly."
*   **On clichés:** "Team player? So is everyone else who can't think of an actual skill. What, were you the mascot?"
*   **On weak action verbs:** "Responsible for... what, existing? Use a verb that shows you actually DID something, not just occupied space!"
*   **On lack of metrics:** "Increased sales by a lot? A lot compared to what, the sales of pet rocks in 1998? Give me NUMBERS, you imbecile!"

ANALYSIS RULES:
1.  ONLY analyze the ACTUAL resume content provided. If it's blank or just a name, roast THAT.
2.  Never hallucinate or invent details about 'John Doe' or fake people or jobs not listed.
3.  Base ALL feedback, roasts, and scores on the real resume data you receive.
4.  If the resume is poorly formatted, unreadable, or nonsensical, make THAT the centerpiece of your roast.
5.  Be specific. Don't just say 'summary is bad'; explain *why* it's bad with a cutting remark.
6.  For section analysis, use the EXACT section headers from the resume
7.  If standard sections are missing, create a "missing_sections" analysis

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure. Ensure all scores are integers. Use simple string formatting without complex escapes.

{
  "overall_score": [NUMBER 0-100 based on actual resume quality],
  "ats_score": [NUMBER 0-100 based on ATS compatibility],
  "main_roast": "[Your brutal 8-12 word summary of biggest problem]",
  "score_category": "[Your assessment: e.g. 'Needs work', 'Almost there', 'Train wreck']",
  "resume_sections": [
    {
      "section_name": "[EXACT section name from resume]",
      "found": true,
      "score": [NUMBER 0-100],
      "roast": "[Your brutal but constructive roast of this section]",
      "issues": [
        "[Specific issue 1]",
        "[Specific issue 2]"
      ],
      "strengths": [
        "[What they actually did right, if anything]"
      ],
      "improvements": [
        {
          "issue": "[Specific problem]",
          "fix": "[How to fix it]",
          "example": "[Concrete example - keep simple, avoid quotes]"
        }
      ]
    }
  ],
  "missing_sections": [
    {
      "section_name": "[Standard section they're missing]",
      "importance": "[Critical/Important/Nice-to-have]",
      "roast": "[Why not having this section is embarrassing]",
      "recommendation": "[What they should include]"
    }
  ],
  "good_stuff": [
    {
      "title": "[What they did right]",
      "roast": "[Your sarcastic but fair comment]",
      "description": "[Explanation of what's actually good]"
    }
  ],
  "needs_work": [
    {
      "title": "[Specific problem you identified]",
      "roast": "[Your brutal but helpful comment]",
      "issue": "[What exactly is wrong]",
      "fix": "[Specific solution]",
      "example": "[Concrete example of how to fix it - keep simple]"
    }
  ],
  "critical_issues": [
    {
      "title": "[Major problem that kills their chances]",
      "roast": "[Your devastating but constructive comment]",
      "disaster": "[Why this is so bad]",
      "fix": "[How to fix this disaster]",
      "example": "[Specific example - keep simple]"
    }
  ],
  "shareable_roasts": [
    {
      "id": "main",
      "text": "[Your main roast - same as main_roast above]",
      "category": "Overall Assessment",
      "shareText": "This AI just told me my resume '[main_roast]' and I can't even be mad 😂",
      "platform": "general"
    },
    {
      "id": "section",
      "text": "[Roast about their worst section]",
      "category": "[Section Name]",
      "shareText": "My resume [section name]: '[section roast]' ...accurate but painful 💔",
      "platform": "general"
    },
    {
      "id": "format",
      "text": "[Roast about formatting/presentation]",
      "category": "Formatting",
      "shareText": "This tool roasted my resume formatting harder than my mom roasts my life choices 😅",
      "platform": "general"
    }
  ],
  "ats_issues": [
    "[Specific ATS problems you identified]",
    "[More ATS issues if found]"
  ],
  "formatting_issues": [
    {
      "issue": "[Specific formatting problem]",
      "severity": "[High/Medium/Low]",
      "fix": "[How to fix it]"
    }
  ],
  "keyword_analysis": {
    "missing_keywords": [
      "[Industry keywords they should have]"
    ],
    "overused_buzzwords": [
      "[Cliche terms they use too much]"
    ],
    "weak_action_verbs": [
      "[Weak verbs they should replace]"
    ]
  },
  "quantification_issues": {
    "missing_metrics": [
      "[Achievements that need numbers]"
    ],
    "vague_statements": [
      "[Statements that need specificity]"
    ]
  },
  "action_plan": {
    "immediate": [
      {
        "title": "[Immediate fix needed]",
        "description": "[What to do about it]",
        "icon": "🎨",
        "color": "red",
        "time_estimate": "[How long this should take]"
      },
      {
        "title": "[Second immediate fix]",
        "description": "[What to do about it]",
        "icon": "📊",
        "color": "blue",
        "time_estimate": "[How long this should take]"
      },
      {
        "title": "[Third immediate fix]",
        "description": "[What to do about it]",
        "icon": "🧟‍♂️",
        "color": "yellow",
        "time_estimate": "[How long this should take]"
      }
    ],
    "longTerm": [
      {
        "title": "[Long-term improvement]",
        "description": "[Strategy for improvement]",
        "icon": "📚",
        "color": "green",
        "time_estimate": "[How long this should take]"
      },
      {
        "title": "[Career development]",
        "description": "[Professional growth advice]",
        "icon": "🤝",
        "color": "purple",
        "time_estimate": "[How long this should take]"
      },
      {
        "title": "[Maintenance]",
        "description": "[Ongoing improvement strategy]",
        "icon": "⏰",
        "color": "gray",
        "time_estimate": "[How long this should take]"
      }
    ]
  },
  "recommendations": {
    "priority": "[High/Medium/Low priority recommendations]",
    "timeline": "[Suggested timeframe for improvements]",
    "next_steps": [
      "[Specific action step 1]",
      "[Specific action step 2]",
      "[Specific action step 3]"
    ]
  }
}

REMEMBER YOUR CORE TRAITS: Gordon Ramsay's brutal honesty, Sinek's focus on 'why' for the helpful bits, a cat's disdain for mediocrity, and make it HILARIOUSLY SHAREABLE. Be specific. If no resume, ROAST THE VOID. YOU MUST ALWAYS RETURN THE OVERALL_SCORE AND THE ATS_SCORE AS INTEGERS AND RETURN ONLY VALID JSON. Analyze EACH SECTION individually using their exact names.

CRITICAL: Keep all text content simple and avoid complex escape sequences. Use single quotes inside strings instead of escaped double quotes.`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[RESUME_ANALYSIS] Starting analysis request...');
  
  try {
    const user = await currentUser();
    console.log('[RESUME_ANALYSIS] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[RESUME_ANALYSIS] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[RESUME_ANALYSIS] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[RESUME_ANALYSIS] Request body:', {
      hasResumeId: !!requestBody.resumeId,
      resumeId: requestBody.resumeId,
      hasFileData: !!requestBody.fileData,
      fileDataLength: requestBody.fileData?.length || 0,
      fileName: requestBody.fileName,
      forceReanalysis: requestBody.forceReanalysis
    });

    const { resumeId, fileName, fileData, forceReanalysis = false } = requestBody;

    let actualFileData: string;
    let actualFileName: string;
    let actualResumeId: string;

    // Support both new (resumeId) and old (direct fileData) approaches for backward compatibility
    if (resumeId) {
      console.log('[RESUME_ANALYSIS] Using new approach with resumeId:', resumeId);
      
      // Check if analysis already exists and is not being forced to re-run
      if (!forceReanalysis) {
        console.log('[RESUME_ANALYSIS] Checking for existing analysis...');
        const existingAnalysis = await db.analysis.findFirst({
          where: {
            resumeId: resumeId,
            userId: dbUser.id,
            isCompleted: true,
          },
          orderBy: {
            createdAt: 'desc', // Get the most recent analysis
          },
        });

        if (existingAnalysis) {
          console.log('[RESUME_ANALYSIS] Found existing analysis:', {
            analysisId: existingAnalysis.id,
            createdAt: existingAnalysis.createdAt,
            overallScore: existingAnalysis.overallScore,
            atsScore: existingAnalysis.atsScore
          });

          const processingTime = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            analysis: existingAnalysis.analysisData,
            fileName: existingAnalysis.fileName,
            resumeId: resumeId,
            analysisId: existingAnalysis.id,
            processingTimeMs: processingTime,
            timestamp: existingAnalysis.createdAt.toISOString(),
            cached: true,
            message: 'Retrieved existing analysis'
          });
        } else {
          console.log('[RESUME_ANALYSIS] No existing analysis found, proceeding with new analysis');
        }
      } else {
        console.log('[RESUME_ANALYSIS] Force reanalysis requested, skipping cache check');
      }
      
      // New approach: get resume data from database using resumeId
      const storedResume = await getResumeData(resumeId, user.id);
      console.log('[RESUME_ANALYSIS] Retrieved resume data:', storedResume ? {
        resumeId: storedResume.resumeId,
        fileName: storedResume.fileName,
        fileDataLength: storedResume.fileData.length
      } : 'null');
      
      if (!storedResume) {
        console.log('[RESUME_ANALYSIS] Resume not found - returning 404');
        return NextResponse.json(
          { error: 'Resume not found or you do not have access to it.' },
          { status: 404 }
        );
      }

      actualFileData = storedResume.fileData;
      actualFileName = storedResume.fileName;
      actualResumeId = storedResume.resumeId;
    } else if (fileData && fileName) {
      console.log('[RESUME_ANALYSIS] Using legacy approach with direct file data');
      // Backward compatibility: direct file data (will be deprecated)
      actualFileData = fileData;
      actualFileName = fileName;
      actualResumeId = 'legacy-upload';
    } else {
      console.log('[RESUME_ANALYSIS] Invalid request - missing required data');
      return NextResponse.json(
        { error: 'Either resumeId or fileData with fileName is required' },
        { status: 400 }
      );
    }

    console.log(`[RESUME_ANALYSIS] Analysis setup complete:`, {
      resumeId: actualResumeId,
      fileName: actualFileName,
      fileDataLength: actualFileData.length,
      timestamp: new Date().toISOString()
    });

    const USER_PROMPT = `REAL RESUME ANALYSIS REQUEST

Here is an actual resume that needs your brutal but helpful section-by-section analysis:

INSTRUCTIONS:
- First, identify ALL sections in this resume (use exact section names)
- Analyze each section individually for quality, content, and effectiveness
- Identify any standard resume sections that are missing
- Point out real issues you see in THIS specific resume
- Be the ruthless cat Aplycat who notices everything
- Roast the generic language, vague descriptions, and lack of metrics
- Focus on what would actually help this person improve
- Make it shareable and memorable
- Provide industry-specific advice if you can identify their target field

CRITICAL: Return section analysis using the EXACT section headers found in the resume. Don't rename or standardize them.

FORMATTING REQUIREMENTS:
- Return ONLY valid JSON
- Keep all text content simple and readable
- Avoid complex escape sequences
- Use single quotes inside string values instead of escaped double quotes
- Keep examples and descriptions concise and on single lines`;

    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
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
              type: 'input_file',
              filename: actualFileName || 'resume.pdf',
              file_data: `data:application/pdf;base64,${actualFileData}`,
            },
            {
              type: 'input_text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
    });

    const result = completion.output_text;
    
    if (!result) {
      console.error('[RESUME_ANALYSIS] No response from OpenAI');
      throw new Error('No response from OpenAI');
    }

    console.log(`[RESUME_ANALYSIS] OpenAI response length: ${result.length} characters`);

    // Use the robust JSON parser
    const parseResult = parseOpenAIResponse(result);
    
    if (!parseResult.success) {
      console.error('[RESUME_ANALYSIS] JSON parsing failed with all strategies');
      // Return the fallback data if parsing completely failed
      const analysis = parseResult.data;
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true, // Still return success since we have fallback data
        analysis,
        fileName: actualFileName,
        resumeId: actualResumeId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        parseStrategy: 'fallback',
        warning: 'Analysis completed with technical recovery'
      });
    }

    const analysis = parseResult.data;
    const processingTime = Date.now() - startTime;
    
    console.log(`[RESUME_ANALYSIS] Analysis completed successfully in ${processingTime}ms for resume: ${actualResumeId} using strategy: ${parseResult.strategy}`);

    // Save analysis to database (only for new resume analyses, not legacy ones)
    let savedAnalysisId: string | null = null;
    if (actualResumeId !== 'legacy-upload') {
      try {
        console.log('[RESUME_ANALYSIS] Saving analysis to database...');
        
        const savedAnalysis = await db.analysis.create({
          data: {
            userId: dbUser.id,
            resumeId: actualResumeId,
            fileName: actualFileName,
            processingTimeMs: processingTime,
            overallScore: analysis.overall_score || 0,
            atsScore: analysis.ats_score || 0,
            scoreCategory: analysis.score_category || 'Unknown',
            mainRoast: analysis.main_roast || 'Analysis completed',
            analysisData: analysis,
            creditsUsed: 2, // Cost for analysis
            isCompleted: true,
          },
        });

        savedAnalysisId = savedAnalysis.id;
        console.log('[RESUME_ANALYSIS] Analysis saved to database:', {
          analysisId: savedAnalysisId,
          overallScore: savedAnalysis.overallScore,
          atsScore: savedAnalysis.atsScore,
          creditsUsed: savedAnalysis.creditsUsed
        });

        // Record credit transaction
        await db.creditTransaction.create({
          data: {
            userId: dbUser.id,
            type: 'ANALYSIS_USE',
            amount: -2, // Deduct 2 credits
            description: `Resume analysis: ${actualFileName}`,
            relatedAnalysisId: savedAnalysisId,
          },
        });

        // Update user's credit count
        await db.user.update({
          where: { id: dbUser.id },
          data: {
            credits: { decrement: 2 },
            totalCreditsUsed: { increment: 2 },
          },
        });

        console.log('[RESUME_ANALYSIS] Credits deducted and transaction recorded');

      } catch (dbError: any) {
        console.error('[RESUME_ANALYSIS] Failed to save analysis to database:', dbError);
        // Don't fail the entire request if database save fails
        // The user still gets their analysis result
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      fileName: actualFileName,
      resumeId: actualResumeId,
      analysisId: savedAnalysisId,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      parseStrategy: parseResult.strategy,
      cached: false
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[RESUME_ANALYSIS] Error after ${processingTime}ms:`, error);
    console.error('[RESUME_ANALYSIS] Stack trace:', error.stack);
    
    // Log the type of error for monitoring
    const errorType = error.message?.includes('OpenAI') ? 'OPENAI_ERROR' : 
                      error.message?.includes('JSON') ? 'JSON_PARSE_ERROR' : 
                      error.message?.includes('Network') ? 'NETWORK_ERROR' :
                      'UNKNOWN_ERROR';
    
    console.error(`[RESUME_ANALYSIS] Error type: ${errorType}`);
    
    // For production, we want to be more resilient
    if (process.env.NODE_ENV === 'production') {
      // Return a user-friendly error with fallback analysis
      return NextResponse.json({
        success: false,
        error: 'Resume analysis temporarily unavailable',
        errorType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        // Provide a minimal fallback so the user isn't completely blocked
        fallbackAnalysis: {
          overall_score: 50,
          ats_score: 50,
          main_roast: "System temporarily unavailable for analysis",
          score_category: "Technical Issue",
          message: "Please try again in a moment. Our AI is taking a brief catnap."
        }
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error.message,
        errorType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}