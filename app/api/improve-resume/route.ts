// app/api/improve-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { getResumeData } from '@/lib/resume-storage';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { db } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Professional Resume Analyst. Your objective is to transform the provided user resume into a highly effective, ATS-compliant document, meticulously tailored to the target role and industry specified by the user. You will deconstruct the original content and rebuild it based on established best practices for modern resume writing, emphasizing extreme conciseness, quantifiable achievements (with illustrative metrics where necessary and appropriate), and precise keyword relevance. Be direct and decisive in your revisions.

CORE MISSION: Critically analyze the provided resume and generate a significantly improved, professional version, laser-focused on the user's stated career target. This is a strategic revision process; eliminate all content not directly supporting this target.

CORE PRINCIPLES FOR RESUME OPTIMIZATION:

TARGET-DRIVEN CONTENT SELECTION (RUTHLESS FILTERING):
The user-provided target role and industry are paramount. All content decisions (inclusion, exclusion, emphasis) must be made through the lens of what best positions the candidate for this specific target.
Aggressively remove any experience, skills, or details that do not directly contribute to the stated target role, even if they were significant in a previous, different context.
Prioritize the last 7-10 years of highly relevant experience. Older experience should be omitted unless exceptionally pertinent to the target.

STRATEGIC CONCISION & ATS-FRIENDLY FORMATTING (ONE-PAGE STANDARD):
One-Page Standard: Adherence to a one-page format is critical for candidates with less than 15 years of experience. For 15+ years of highly relevant senior/executive experience for the target role, two pages are permissible.
Role Selection: Feature a maximum of 3-4 of the most impactful positions directly relevant to the target role.
Bullet Point Efficiency: Limit bullet points to 2-4 per role, focusing on quantifiable achievements directly supporting the target (aim for 8-12 total experience bullets).
Professional Summary: Construct an exceptionally concise Professional Summary of 80-120 words (ABSOLUTE MAXIMUM). This must be a laser-focused pitch directly aligned with the target role and industry.
Content Elimination: Systematically remove: outdated "Objective" statements, generic soft skills phrases, clichés, redundant content, historical roles or skills irrelevant to the target, and overly common technical skills (e.g., "Microsoft Office Suite" unless the target role is administrative or requires advanced, specific proficiency like Excel VBA).

ACHIEVEMENT-BASED CONTENT & QUANTIFICATION (WITH ILLUSTRATIVE METRICS):
Active Voice & Accomplishments: Convert passive duties into active, results-oriented accomplishment statements.
Mandatory Quantification & Illustrative Metrics:
Prioritize extracting specific metrics and quantifiable results directly from the original resume.
If the original resume describes an achievement relevant to the target role but lacks specific metrics:
First, attempt to rephrase the achievement to strongly imply impact using powerful verbs and descriptive language.
If implied impact is insufficient or to further strengthen the statement, you MAY insert plausible, industry-standard, illustrative metrics relevant to the user's stated target role and industry.
Crucially, any such illustrative metrics MUST be clearly enclosed in square brackets and prefaced with 'Illustrative:' (e.g., '...resulting in [Illustrative: a 15% increase] in user engagement.'). Do NOT present these as factual data from the original resume.
The user MUST be explicitly prompted in the recommendationsForUser section to review, verify, and replace these illustrative metrics with their actual data.
Example (Original: "Improved sales processes." User Target: "Sales Manager"): "Revitalized sales processes, leading to [Illustrative: a 10% reduction] in sales cycle time and [Illustrative: a 12% increase] in team close rates within one quarter."
Impactful Action Verbs: Initiate every bullet point with a strong, relevant action verb.

KEYWORD OPTIMIZATION & READABILITY (ATS & HUMAN REVIEW):
Targeted Keywords: Strategically integrate keywords specific to the user-provided target role and industry throughout the resume.
ATS Compliance: Ensure standard, parsable formatting.
Human Scannability: Structure for rapid comprehension.

CRITICAL INPUT: You will receive the user's current resume content AND a user prompt specifying their target role and industry. This target information is non-negotiable for guiding your revisions.

STRICT PROHIBITIONS:
NO placeholder information for personal details: Use ONLY the exact names, companies, contact details, dates, etc., provided in the original resume.
NO FABRICATION OF UNFLAGGED DATA: Do NOT invent specific numbers or metrics without clearly marking them as 'Illustrative:' as described above. The goal is to provide helpful, plausible examples for the user to replace, not to present fiction as fact.
NO content exceeding page limits (one page, or two for 15+ years relevant experience).
NO inclusion of content not directly supporting the user's stated target role.
NO verbose or convoluted language: Employ clear, direct, and concise professional language.

OUTPUT: Return ONLY valid JSON with this structure:
{
  "personalInfo": {
    "name": "[EXACT name from original resume]",
    "email": "[EXACT email from original]",
    "phone": "[EXACT phone from original]",
    "location": "[EXACT location from original]",
    "linkedin": "[If present in original, use EXACT URL]",
    "website": "[If present in original, use EXACT URL]"
  },
  "professionalSummary": "[80-120 words - rewritten with extreme conciseness, impact, and keywords laser-focused on the user's target role and industry.]",
  "experience": [
    {
      "title": "[EXACT job title from original.]",
      "company": "[EXACT company from original]",
      "location": "[EXACT location from original]",
      "startDate": "[EXACT date from original]",
      "endDate": "[EXACT date from original]",
      "achievements": [
        "[Transformed bullet 1: Action verb + quantifiable result/impact. If metrics are illustrative: '...achieving [Illustrative: X% growth]...']",
        "[Transformed bullet 2: Action verb + quantifiable result/impact. If metrics are illustrative: '...reduced costs by [Illustrative: $Y]...']"
      ]
    }
  ],
  "education": [
    {
      "degree": "[EXACT degree from original]",
      "institution": "[EXACT school from original]",
      "year": "[EXACT year of graduation. If ongoing, 'Expected Month Year']",
      "details": "[Brief, highly relevant details ONLY if space permits AND adds significant value TO THE TARGET ROLE (e.g., GPA if exceptional & recent grad, highly relevant honors/thesis). Max 1 short line.]"
    }
  ],
  "skills": {
    "technical": ["[List of technical skills directly relevant to the target role. Group related skills.]"],
    "certifications": ["[List of certifications relevant to the target role.]"],
    "otherRelevantSkills": ["[e.g., Languages, Methodologies, Tools – only if directly relevant to the target role and space permits.]"]
  },
  "improvementsAnalysis": {
    "originalResumeEffectivenessEstimateForTarget": "[Provide a numerical estimate (1-100) of the original resume's likely effectiveness FOR THE SPECIFIED TARGET ROLE.]",
    "targetOptimizedResumeScore": "90-95",
    "analysisHeadline": "Resume Optimized for Target Role: [User's Target Role]",
    "keyRevisionsImplemented": [
      "Aggressively filtered and restructured content to laser-focus on the target role: [User's Target Role] in the [User's Target Industry] industry.",
      "Radically condensed content to a professional one-page format (or two-page, if applicable).",
      "Transformed passive descriptions into impactful, quantified achievements using strong action verbs.",
      "Where original metrics were absent for key achievements, plausible *illustrative metrics* (marked '[Illustrative: ...]') have been included as examples; these REQUIRE user verification and replacement.",
      "Crafted an extremely concise Professional Summary directly aligned with the target profile.",
      "Optimized with keywords specific to the target role and industry for ATS and recruiter visibility."
    ],
    "recommendationsForUser": [
      "CRITICAL: Review all achievements. Where '[Illustrative: ...]' metrics are present, these are EXAMPLES. You MUST replace them with your actual, accurate data to ensure credibility. This resume's strength relies on authentic quantification.",
      "Verify all dates, company names, and role titles for absolute accuracy.",
      "While this resume is optimized for your stated target, consider minor tweaks to further align with the specific requirements of each individual job description you apply to."
    ]
  }
}`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[RESUME_IMPROVEMENT] Starting improvement request...');
  
  try {
    const user = await currentUser();
    console.log('[RESUME_IMPROVEMENT] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[RESUME_IMPROVEMENT] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[RESUME_IMPROVEMENT] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[RESUME_IMPROVEMENT] Request body:', {
      hasResumeId: !!requestBody.resumeId,
      resumeId: requestBody.resumeId,
      hasFileData: !!requestBody.fileData,
      fileDataLength: requestBody.fileData?.length || 0,
      fileName: requestBody.fileName,
      targetRole: requestBody.targetRole,
      targetIndustry: requestBody.targetIndustry,
      customPrompt: requestBody.customPrompt,
      versionName: requestBody.versionName
    });

    const { resumeId, fileName, fileData, targetRole, targetIndustry, customPrompt, versionName } = requestBody;

    if (!targetRole || !targetIndustry) {
      return NextResponse.json(
        { error: 'Target role and industry are required' },
        { status: 400 }
      );
    }

    let actualFileData: string;
    let actualFileName: string;
    let actualResumeId: string;

    // Support both new (resumeId) and old (direct fileData) approaches for backward compatibility
    if (resumeId) {
      console.log('[RESUME_IMPROVEMENT] Using new approach with resumeId:', resumeId);
      
      // New approach: get resume data from database using resumeId
      const storedResume = await getResumeData(resumeId, user.id);
      console.log('[RESUME_IMPROVEMENT] Retrieved resume data:', storedResume ? {
        resumeId: storedResume.resumeId,
        fileName: storedResume.fileName,
        fileDataLength: storedResume.fileData.length
      } : 'null');
      
      if (!storedResume) {
        console.log('[RESUME_IMPROVEMENT] Resume not found - returning 404');
        return NextResponse.json(
          { error: 'Resume not found or you do not have access to it.' },
          { status: 404 }
        );
      }

      actualFileData = storedResume.fileData;
      actualFileName = storedResume.fileName;
      actualResumeId = storedResume.resumeId;
    } else if (fileData && fileName) {
      console.log('[RESUME_IMPROVEMENT] Using legacy approach with direct file data');
      // Backward compatibility: direct file data (will be deprecated)
      actualFileData = fileData;
      actualFileName = fileName;
      actualResumeId = 'legacy-upload';
    } else {
      console.log('[RESUME_IMPROVEMENT] Invalid request - missing required data');
      return NextResponse.json(
        { error: 'Either resumeId or fileData with fileName is required' },
        { status: 400 }
      );
    }

    // Get the next version number for this resume
    let nextVersion = 1;
    if (actualResumeId !== 'legacy-upload') {
      const lastVersion = await db.improvedResume.findFirst({
        where: {
          resumeId: actualResumeId,
          userId: dbUser.id,
        },
        orderBy: {
          version: 'desc',
        },
        select: {
          version: true,
        },
      });

      if (lastVersion) {
        nextVersion = lastVersion.version + 1;
      }
    }

    console.log(`[RESUME_IMPROVEMENT] Improvement setup complete:`, {
      resumeId: actualResumeId,
      fileName: actualFileName,
      fileDataLength: actualFileData.length,
      targetRole,
      targetIndustry,
      customPrompt,
      versionName,
      nextVersion,
      timestamp: new Date().toISOString()
    });

    const USER_PROMPT = `Attached is my resume. Please provide a professionally revised, ATS-compliant version.
My target role is "${targetRole}" in the "${targetIndustry}" industry.

INSTRUCTIONS:
- Transform this resume to be laser-focused on the target role: ${targetRole}
- Optimize for the ${targetIndustry} industry
- Use extreme conciseness while maintaining impact
- Add quantifiable achievements (mark illustrative metrics clearly)
- Ensure ATS compliance
- Focus on the most relevant experience for this target
- Create a compelling professional summary
- Use industry-relevant keywords throughout${customPrompt ? `\n\nADDITIONAL CUSTOM INSTRUCTIONS: ${customPrompt}` : ''}`;

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
      throw new Error('No response from OpenAI');
    }

    console.log(`[RESUME_IMPROVEMENT] OpenAI response length: ${result.length} characters`);

    // Clean up the response text to handle potential JSON issues
    let cleanedResult = result.trim();
    
    // Remove any markdown code block formatting if present
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response with better error handling
    let improvedResume;
    try {
      improvedResume = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', result);
      
      // Try to fix common JSON issues
      try {
        let fixedResult = cleanedResult;
        
        // Replace escaped quotes within string values
        fixedResult = fixedResult.replace(/"([^"]*)\\"([^"]*)*"/g, (match, before, after) => {
          return `"${before}'${after || ''}"`;
        });
        
        // Additional cleanup for other common issues
        fixedResult = fixedResult
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\');
        
        improvedResume = JSON.parse(fixedResult);
      } catch (secondError) {
        console.error('Second JSON Parse Error:', secondError);
        
        try {
          let aggressiveFixResult = cleanedResult
            .replace(/\\"/g, "'")
            .replace(/\\([^"\\\/bfnrt])/g, '$1')
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ');
            
          improvedResume = JSON.parse(aggressiveFixResult);
        } catch (thirdError) {
          console.error('Third JSON Parse Error:', thirdError);
          throw new Error(`Failed to parse OpenAI response as JSON. Response: ${result.substring(0, 500)}...`);
        }
      }
    }

    const processingTime = Date.now() - startTime;

    console.log('[RESUME_IMPROVEMENT] Improvement completed successfully - returning to user immediately');

    // **IMMEDIATE RESPONSE TO USER** - Don't wait for database operations
    const immediateResponse = {
      success: true,
      improvedResume,
      targetRole,
      targetIndustry,
      fileName: actualFileName,
      resumeId: actualResumeId,
      version: nextVersion,
      versionName: versionName || `Version ${nextVersion}`,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      cached: false
    };

    // Start background database save operation (don't await)
    if (actualResumeId !== 'legacy-upload') {
      saveToDatabase(
        dbUser.id,
        actualResumeId,
        nextVersion,
        versionName,
        targetRole,
        targetIndustry,
        customPrompt,
        improvedResume,
        actualFileName,
        processingTime
      ).catch(error => {
        console.error('[RESUME_IMPROVEMENT] Background save failed:', error);
        // Don't affect user experience - just log the error
      });
    }

    return NextResponse.json(immediateResponse);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[RESUME_IMPROVEMENT] Error:', error);
    console.error('[RESUME_IMPROVEMENT] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to improve resume',
        details: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Background database save function
async function saveToDatabase(
  userId: string,
  resumeId: string,
  version: number,
  versionName: string | undefined,
  targetRole: string,
  targetIndustry: string,
  customPrompt: string | undefined,
  improvedResume: any,
  fileName: string,
  processingTime: number
) {
  try {
    console.log('[RESUME_IMPROVEMENT] Starting background database save...');
    
    // Extract improvement metrics from the analysis
    const originalScore = improvedResume?.improvementsAnalysis?.originalResumeEffectivenessEstimateForTarget;
    const improvedScore = improvedResume?.improvementsAnalysis?.targetOptimizedResumeScore;
    const keyChanges = improvedResume?.improvementsAnalysis?.keyRevisionsImplemented || [];
    
    // Calculate improvement percentage
    let improvementPercentage = null;
    if (originalScore && improvedScore) {
      const improvedScoreNum = typeof improvedScore === 'string' ? 
        parseInt(improvedScore.split('-')[0]) : improvedScore;
      improvementPercentage = ((improvedScoreNum - originalScore) / originalScore) * 100;
    }

    const savedImprovedResume = await db.improvedResume.create({
      data: {
        userId,
        resumeId,
        version,
        versionName: versionName || `Version ${version}`,
        targetRole,
        targetIndustry,
        customPrompt,
        improvedResumeData: improvedResume,
        improvementSummary: improvedResume?.improvementsAnalysis?.analysisHeadline || null,
        keyChanges: { changes: keyChanges },
        originalScore: originalScore ? parseInt(originalScore.toString()) : null,
        improvedScore: improvedScore ? (typeof improvedScore === 'string' ? 
          parseInt(improvedScore.split('-')[0]) : improvedScore) : null,
        improvementPercentage,
        fileName,
        creditsUsed: 3, // Cost for improvement
        processingTimeMs: processingTime,
        modelUsed: 'gpt-4.1-mini',
        isCompleted: true,
      },
    });

    console.log('[RESUME_IMPROVEMENT] Background save completed:', {
      improvedResumeId: savedImprovedResume.id,
      version,
      originalScore,
      improvedScore,
      improvementPercentage,
      creditsUsed: 3
    });

    // Record credit transaction
    await db.creditTransaction.create({
      data: {
        userId,
        type: 'IMPROVEMENT_USE',
        amount: -3, // Deduct 3 credits
        description: `Resume improvement: ${targetRole} in ${targetIndustry}`,
        relatedImprovedResumeId: savedImprovedResume.id,
      },
    });

    // Update user's credit count
    await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 3 },
        totalCreditsUsed: { increment: 3 },
      },
    });

    console.log('[RESUME_IMPROVEMENT] Background save fully completed - credits deducted');

  } catch (error) {
    console.error('[RESUME_IMPROVEMENT] Background save error:', error);
    // Don't throw - this is background operation
  }
}