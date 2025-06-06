// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { db } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a CONSERVATIVE Resume Tailoring Specialist. Your ONLY task is to reorganize and reword existing resume content to better match a job description. You are STRICTLY FORBIDDEN from adding any new information.

🚨 CRITICAL RULE: NEVER INVENT OR FABRICATE ANYTHING 🚨

WHAT YOU MUST NEVER DO:
- NEVER mention companies the candidate hasn't worked for (like saying they want to work "at [Company]" when they never worked there)
- NEVER add skills, technologies, or tools not already in the resume
- NEVER fabricate achievements, metrics, or responsibilities
- NEVER modify job titles, company names, dates, or factual information
- NEVER claim experience with projects, methodologies, or domains not mentioned in original resume
- NEVER add certifications, education, or qualifications not already present
- NEVER invent career goals related to the target company

WHAT YOU CAN DO:
- Reorder experience bullets to prioritize most relevant ones first
- Rewrite the professional summary using ONLY existing skills and experience
- Reorganize skills section to emphasize job-relevant technologies already listed
- Use job description terminology ONLY where it accurately describes existing experience
- Highlight transferable aspects of existing experience

PROFESSIONAL SUMMARY RULES:
- Use ONLY skills and technologies already mentioned in the resume
- Reference ONLY actual work experience and achievements from the resume
- DO NOT mention the target company by name or express desire to work there
- Focus on existing qualifications that align with the role requirements
- Keep all statements factual and based on actual resume content

KEYWORD INTEGRATION:
- Only use keywords where they genuinely match existing experience
- Do not force keywords that don't apply to the candidate's background
- Prioritize authenticity over keyword density

OUTPUT: Return ONLY valid JSON with this structure:
{
  "tailoredResume": {
    "personalInfo": {
      "name": "[EXACT name from original resume]",
      "email": "[EXACT email from original]",
      "phone": "[EXACT phone from original]",
      "location": "[EXACT location from original]",
      "linkedin": "[If present in original, use EXACT URL]",
      "website": "[If present in original, use EXACT URL]"
    },
    "professionalSummary": "[Rewritten to emphasize existing skills and experience that align with the job requirements]",
    "experience": [
      {
        "title": "[EXACT job title from original]",
        "company": "[EXACT company name from original]",
        "location": "[EXACT location from original]",
        "startDate": "[EXACT start date from original]",
        "endDate": "[EXACT end date from original]",
        "achievements": [
          "[Existing achievements reordered and reworded to emphasize relevance to target job]"
        ]
      }
    ],
    "education": [
      {
        "degree": "[EXACT degree from original]",
        "institution": "[EXACT institution from original]",
        "year": "[EXACT year from original]",
        "details": "[Only include if present in original and relevant]"
      }
    ],
    "skills": {
      "technical": ["[Existing technical skills reordered to prioritize job-relevant ones]"],
      "certifications": ["[Existing certifications from original resume]"],
      "otherRelevantSkills": ["[Existing other skills that are relevant to the target role]"]
    }
  },
  "coverLetter": "[Generated only if includeCoverLetter is true. Professional cover letter based on existing qualifications and honest assessment of fit]",
  "tailoringAnalysis": {
    "jobMatchScore": "[Honest percentage 60-95% based on actual alignment between existing skills and job requirements]",
    "emphasizedSkills": [
      "[Existing skills that were prioritized for this role]"
    ],
    "transferableExperience": [
      "[Existing experience that transfers well to the target role]"
    ],
    "gaps": [
      "[Honest assessment of areas where the candidate lacks required skills - for internal analysis]"
    ],
    "recommendations": [
      "[Suggestions for the candidate to strengthen their profile for this type of role]"
    ]
  }
}`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[RESUME_TAILORING] Starting tailoring request...');
  
  try {
    const user = await currentUser();
    console.log('[RESUME_TAILORING] Clerk user:', user ? `${user.id} (${user.emailAddresses?.[0]?.emailAddress})` : 'null');
    
    if (!user) {
      console.log('[RESUME_TAILORING] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      console.log('[RESUME_TAILORING] Database user not found');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    console.log('[RESUME_TAILORING] Request body:', {
      hasCurrentResume: !!requestBody.currentResume,
      hasJobDescription: !!requestBody.jobDescription,
      includeCoverLetter: requestBody.includeCoverLetter,
      companyName: requestBody.companyName,
      jobTitle: requestBody.jobTitle,
      improvedResumeId: requestBody.improvedResumeId, // New: for versioning
    });

    const { 
      currentResume, 
      jobDescription, 
      includeCoverLetter, 
      companyName, 
      jobTitle,
      improvedResumeId, // New: original improved resume ID for versioning
    } = requestBody;

    if (!currentResume || !jobDescription) {
      return NextResponse.json(
        { error: 'Current resume and job description are required' },
        { status: 400 }
      );
    }

    // Get the next version number if we're creating a new version
    let nextVersion = 1;
    let originalResumeId = null;
    
    if (improvedResumeId) {
      console.log('[RESUME_TAILORING] Creating new version for improved resume:', improvedResumeId);
      
      // Get the original improved resume to find its resumeId and get next version
      const originalImprovedResume = await db.improvedResume.findFirst({
        where: {
          id: improvedResumeId,
          userId: dbUser.id,
        },
        select: {
          resumeId: true,
          version: true,
        },
      });

      if (originalImprovedResume) {
        originalResumeId = originalImprovedResume.resumeId;
        
        // Get the latest version for this resumeId
        const lastVersion = await db.improvedResume.findFirst({
          where: {
            resumeId: originalImprovedResume.resumeId,
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
    }

    const USER_PROMPT = `TAILOR this resume for the job below. Use ONLY information already in the resume. DO NOT INVENT anything.

CURRENT RESUME:
${JSON.stringify(currentResume, null, 2)}

JOB DESCRIPTION:
${jobDescription}

${companyName ? `COMPANY NAME: ${companyName}` : ''}
${jobTitle ? `JOB TITLE: ${jobTitle}` : ''}

🚨 ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
- DO NOT mention the target company (${companyName || 'the hiring company'}) as if the candidate worked there or wants to work there specifically
- DO NOT add skills, technologies, or experience not already in the resume
- DO NOT fabricate any achievements, projects, or responsibilities
- DO NOT change job titles, company names, dates, or any factual information
- DO NOT invent career goals or aspirations related to the target company
- ONLY reorganize and reword existing content to emphasize relevance

WHAT TO DO:
1. Rewrite professional summary using ONLY existing skills and experience
2. Reorder experience bullets to put most relevant ones first
3. Reorganize skills to emphasize those matching the job requirements
4. Use job keywords ONLY where they genuinely match existing experience
5. Keep all information truthful and verifiable

${includeCoverLetter ? 'COVER LETTER: Write an honest cover letter based on actual qualifications. Do NOT claim desire to work at the specific company - focus on the role type.' : ''}

Remember: Better to have an honest resume that shows 70% match than a fabricated one claiming 90% match.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: USER_PROMPT,
        },
      ],
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    console.log(`[RESUME_TAILORING] OpenAI response length: ${result.length} characters`);

    // Clean up the response text to handle potential JSON issues
    let cleanedResult = result.trim();
    
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let tailoredResult;
    try {
      tailoredResult = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      try {
        let fixedResult = cleanedResult
          .replace(/"([^"]*)\\"([^"]*)*"/g, (match, before, after) => {
            return `"${before}'${after || ''}"`;
          })
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\');
        
        tailoredResult = JSON.parse(fixedResult);
      } catch (secondError) {
        throw new Error(`Failed to parse OpenAI response as JSON.`);
      }
    }

    const processingTime = Date.now() - startTime;

    // Save tailored resume as new version (only if originalResumeId exists)
    let savedTailoredResumeId: string | null = null;
    if (originalResumeId) {
      try {
        console.log('[RESUME_TAILORING] Saving tailored resume as new version...');
        
        // Extract improvement metrics from the analysis
        const jobMatchScore = tailoredResult?.tailoringAnalysis?.jobMatchScore;
        const keywordAlignment = tailoredResult?.tailoringAnalysis?.keywordAlignment || [];
        const prioritizedExperience = tailoredResult?.tailoringAnalysis?.prioritizedExperience || [];
        
        // Calculate scores
        let improvedScore = null;
        if (jobMatchScore) {
          // Extract numeric value from percentage string like "90%"
          const scoreMatch = jobMatchScore.match(/(\d+)/);
          if (scoreMatch) {
            improvedScore = parseInt(scoreMatch[1]);
          }
        }

        const versionName = `Tailored for ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}`;
        const customPrompt = `Job tailoring for: ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}\n\nJob Description:\n${jobDescription}`;

        const savedTailoredResume = await db.improvedResume.create({
          data: {
            userId: dbUser.id,
            resumeId: originalResumeId,
            version: nextVersion,
            versionName,
            targetRole: jobTitle || 'Tailored Position',
            targetIndustry: 'Various',
            customPrompt,
            improvedResumeData: tailoredResult.tailoredResume,
            improvementSummary: `Resume tailored for ${jobTitle || 'specific position'}${companyName ? ` at ${companyName}` : ''}`,
            keyChanges: { 
              changes: [
                'Reordered experience to highlight most relevant achievements',
                'Integrated job-specific keywords throughout the resume',
                'Customized professional summary for the target role',
                'Emphasized skills and qualifications matching job requirements',
                ...prioritizedExperience.slice(0, 2), // Add top 2 prioritized items
              ]
            },
            originalScore: null, // Not applicable for tailoring
            improvedScore,
            improvementPercentage: null, // Not applicable for tailoring
            fileName: `tailored-resume-v${nextVersion}.json`,
            creditsUsed: 2, // Cost for tailoring
            processingTimeMs: processingTime,
            modelUsed: 'gpt-4-1106-preview',
            isCompleted: true,
          },
        });

        savedTailoredResumeId = savedTailoredResume.id;
        console.log('[RESUME_TAILORING] Tailored resume saved as new version:', {
          tailoredResumeId: savedTailoredResumeId,
          version: nextVersion,
          improvedScore,
          creditsUsed: 2
        });

        // Record credit transaction
        await db.creditTransaction.create({
          data: {
            userId: dbUser.id,
            type: 'IMPROVEMENT_USE',
            amount: -2, // Deduct 2 credits for tailoring
            description: `Resume tailoring: ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}`,
            relatedImprovedResumeId: savedTailoredResumeId,
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

        console.log('[RESUME_TAILORING] Credits deducted and transaction recorded');

      } catch (dbError: any) {
        console.error('[RESUME_TAILORING] Failed to save tailored resume to database:', dbError);
        // Don't fail the entire request if database save fails
        // The user still gets their tailoring result
      }
    }

    console.log('[RESUME_TAILORING] Tailoring completed successfully');

    return NextResponse.json({
      success: true,
      tailoredResume: tailoredResult.tailoredResume,
      coverLetter: tailoredResult.coverLetter || null,
      tailoringAnalysis: tailoredResult.tailoringAnalysis,
      includedCoverLetter: includeCoverLetter,
      jobTitle,
      companyName,
      tailoredResumeId: savedTailoredResumeId,
      version: nextVersion,
      versionName: `Tailored for ${jobTitle || 'Position'}${companyName ? ` at ${companyName}` : ''}`,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[RESUME_TAILORING] Error:', error);
    console.error('[RESUME_TAILORING] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to tailor resume',
        details: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}