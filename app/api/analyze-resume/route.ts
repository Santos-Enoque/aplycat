// app/api/analyze-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Aplycat, a brutally honest, world-weary cat who has seen a million god-awful resumes and is NOT afraid to say it. Think Gordon Ramsay if he were a cat judging a cooking competition, but for careers. You're also inspired by Simon Sinek's clarity on 'why' things matter – your helpful advice cuts through the BS to the core impact. You find most resumes an insult to your feline intelligence. Your roasts are savage, hilarious, and designed to be screenshotted and shared. But beneath the claws, you genuinely want to see these humans succeed, so your fixes are sharp and actionable.

MISSION: Deliver a relentless, no-holds-barred roast of the provided resume. Identify every flaw, no matter how small, and magnify it for comedic and instructional effect. Then, provide crystal-clear, actionable advice that will actually help them. Your goal is to make them laugh, then cry, then actually fix their resume.

CRITICAL: You MUST return ONLY valid JSON. No preamble, no summary, no niceties, no markdown formatting, no code blocks. Just pure, properly formatted JSON output. Do not escape quotes within the JSON values - use proper JSON string formatting. IF YOU ARE GIVEN NO RESUME CONTENT, ROAST THE LACK OF CONTENT ITSELF.

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

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure. Ensure all scores are integers. Use proper JSON string formatting - do not escape quotes within string values.

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
          "example": "[Concrete example]"
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
      "example": "[Concrete example of how to fix it]"
    }
  ],
  "critical_issues": [
    {
      "title": "[Major problem that kills their chances]",
      "roast": "[Your devastating but constructive comment]",
      "disaster": "[Why this is so bad]",
      "fix": "[How to fix this disaster]",
      "example": "[Specific example]"
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
  "industry_specific_advice": {
    "detected_industry": "[What industry you think they're targeting]",
    "industry_standards": [
      "[What's expected in their industry]"
    ],
    "industry_keywords": [
      "[Keywords they should include for their industry]"
    ]
  }
}

REMEMBER YOUR CORE TRAITS: Gordon Ramsay's brutal honesty, Sinek's focus on 'why' for the helpful bits, a cat's disdain for mediocrity, and make it HILARIOUSLY SHAREABLE. Be specific. If no resume, ROAST THE VOID. YOU MUST ALWAYS RETURN THE OVERALLSCORE AND THE ATS SCORE AS INTEGERS AND RETURN ONLY VALID JSON. Analyze EACH SECTION individually using their exact names.`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { fileData, fileName } = await request.json();

    if (!fileData) {
      return NextResponse.json(
        { error: 'No file data provided' },
        { status: 400 }
      );
    }

    console.log(`[RESUME_ANALYSIS] Starting analysis for file: ${fileName}, timestamp: ${new Date().toISOString()}`);

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

CRITICAL: Return section analysis using the EXACT section headers found in the resume. Don't rename or standardize them.`;

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
              filename: fileName || 'resume.pdf',
              file_data: `data:application/pdf;base64,${fileData}`,
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

    // Clean up the response text to handle potential JSON issues
    let cleanedResult = result.trim();
    
    // Remove any markdown code block formatting if present
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Robust JSON parsing with multiple fallback strategies
    let analysis;
    
    // Strategy 1: Try parsing as-is
    try {
      analysis = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Strategy 1 - JSON Parse Error:', parseError);
      
      // Strategy 2: Fix mixed quotes and escaped characters
      try {
        let fixedResult = cleanedResult;
        
        // Fix the most common issue: mixed single/double quotes in JSON property values
        // This regex finds JSON property values and normalizes quotes within them
        fixedResult = fixedResult.replace(
          /"([^"]*(?:\\.[^"]*)*)"/g, 
          (match, content) => {
            // Replace any single quotes inside the content with escaped single quotes
            const cleanContent = content
              .replace(/'/g, "\\'")  // Escape single quotes
              .replace(/\\"/g, '"')  // Unescape double quotes
              .replace(/\\n/g, ' ')  // Replace newlines with spaces
              .replace(/\\t/g, ' ')  // Replace tabs with spaces
              .replace(/\\r/g, ' '); // Replace carriage returns with spaces
            return `"${cleanContent}"`;
          }
        );
        
        analysis = JSON.parse(fixedResult);
      } catch (secondError) {
        console.error('Strategy 2 - JSON Parse Error:', secondError);
        
        // Strategy 3: More aggressive quote normalization
        try {
          let aggressiveFixResult = cleanedResult
            // Convert all property values to use double quotes consistently
            .replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"')
            // Fix any remaining escaped quotes in values
            .replace(/\\"/g, '"')
            // Clean up line breaks and tabs
            .replace(/\\n/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\r/g, ' ')
            // Fix double backslashes
            .replace(/\\\\/g, '\\');
            
          analysis = JSON.parse(aggressiveFixResult);
        } catch (thirdError) {
          console.error('Strategy 3 - JSON Parse Error:', thirdError);
          
          // Strategy 4: Character-by-character cleaning
          try {
            let sanitizedResult = cleanedResult
              // Replace single quotes in JSON property values with double quotes
              .replace(/("[\w_]+"\s*:\s*)'([^']*)'/g, '$1"$2"')
              // Remove any problematic escape sequences
              .replace(/\\(?!["\\/bfnrt])/g, '')
              // Normalize quotes in nested content
              .replace(/'([^']*(?:\\'[^']*)*)'/g, '"$1"')
              .replace(/\\'/g, "'")
              // Clean whitespace issues
              .replace(/\s+/g, ' ');
              
            analysis = JSON.parse(sanitizedResult);
          } catch (fourthError) {
            console.error('Strategy 4 - JSON Parse Error:', fourthError);
            
            // Strategy 5: Last resort - manual content extraction and reconstruction
            try {
              console.log('Attempting manual JSON reconstruction...');
              
              // Extract key values manually and reconstruct
              const overallScore = cleanedResult.match(/"overall_score"\s*:\s*(\d+)/)?.[1] || '0';
              const atsScore = cleanedResult.match(/"ats_score"\s*:\s*(\d+)/)?.[1] || '0';
              const mainRoast = cleanedResult.match(/"main_roast"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/)?.[1] || 'Resume needs work';
              const scoreCategory = cleanedResult.match(/"score_category"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/)?.[1] || 'Needs work';
              
              // Create a minimal valid response
              analysis = {
                overall_score: parseInt(overallScore),
                ats_score: parseInt(atsScore),
                main_roast: mainRoast.replace(/\\"/g, '"'),
                score_category: scoreCategory,
                resume_sections: [],
                missing_sections: [],
                good_stuff: [{
                  title: "Analysis Completed",
                  roast: "Despite technical hiccups, we got through your resume.",
                  description: "The full analysis was processed but had formatting issues."
                }],
                needs_work: [{
                  title: "Technical Issues",
                  roast: "Even the AI had trouble with the response format.",
                  issue: "Response formatting caused parsing issues",
                  fix: "This is a system issue, not your resume",
                  example: "Try uploading again for full analysis"
                }],
                critical_issues: [],
                shareable_roasts: [{
                  id: "main",
                  text: mainRoast.replace(/\\"/g, '"'),
                  category: "Overall Assessment",
                  shareText: `This AI just told me my resume '${mainRoast.replace(/\\"/g, '"')}' and I can't even be mad 😂`,
                  platform: "general"
                }],
                ats_issues: ["Technical parsing issues occurred"],
                formatting_issues: [],
                keyword_analysis: {
                  missing_keywords: [],
                  overused_buzzwords: [],
                  weak_action_verbs: []
                },
                quantification_issues: {
                  missing_metrics: [],
                  vague_statements: []
                },
                action_plan: {
                  immediate: [{
                    title: "Try uploading again",
                    description: "The analysis had technical issues, try again for full results",
                    icon: "🔄",
                    color: "red",
                    time_estimate: "1 minute"
                  }],
                  longTerm: []
                },
                industry_specific_advice: {
                  detected_industry: "Unknown",
                  industry_standards: [],
                  industry_keywords: []
                }
              };
              
              console.log('Manual JSON reconstruction successful');
            } catch (finalError) {
              console.error('Strategy 5 - Manual reconstruction failed:', finalError);
              
              // Absolute last resort - return a minimal error response
              analysis = {
                overall_score: 50,
                ats_score: 50,
                main_roast: "Technical difficulties analyzing your resume",
                score_category: "Technical Error",
                resume_sections: [],
                missing_sections: [],
                good_stuff: [],
                needs_work: [{
                  title: "System Error",
                  roast: "The AI had a hiccup processing your resume",
                  issue: "Technical parsing error occurred",
                  fix: "Please try uploading your resume again",
                  example: "This is a system issue, not your resume"
                }],
                critical_issues: [],
                shareable_roasts: [{
                  id: "main",
                  text: "Technical difficulties analyzing your resume",
                  category: "System Error",
                  shareText: "The AI had technical difficulties with my resume 🤖💥",
                  platform: "general"
                }],
                ats_issues: [],
                formatting_issues: [],
                keyword_analysis: { missing_keywords: [], overused_buzzwords: [], weak_action_verbs: [] },
                quantification_issues: { missing_metrics: [], vague_statements: [] },
                action_plan: { immediate: [], longTerm: [] },
                industry_specific_advice: { detected_industry: "Unknown", industry_standards: [], industry_keywords: [] }
              };
            }
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`[RESUME_ANALYSIS] Analysis completed successfully in ${processingTime}ms for file: ${fileName}`);

    return NextResponse.json({
      success: true,
      analysis,
      fileName,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[RESUME_ANALYSIS] Error after ${processingTime}ms:`, error);
    console.error('[RESUME_ANALYSIS] Stack trace:', error.stack);
    
    // Log the type of error for monitoring
    const errorType = error.message?.includes('OpenAI') ? 'OPENAI_ERROR' : 
                      error.message?.includes('JSON') ? 'JSON_PARSE_ERROR' : 
                      'UNKNOWN_ERROR';
    
    console.error(`[RESUME_ANALYSIS] Error type: ${errorType}`);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze resume',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        errorType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}