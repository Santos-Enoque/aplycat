// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Professional Resume Tailoring Specialist. Your task is to customize an existing resume to perfectly match a specific job description, and optionally create a tailored cover letter.

CORE MISSION: Analyze the job description and strategically adjust the resume to maximize alignment while maintaining authenticity and professional quality.

TAILORING PRINCIPLES:

JOB-SPECIFIC OPTIMIZATION:
- Extract key requirements, skills, and qualifications from the job description
- Prioritize and reorganize resume content to highlight most relevant experience
- Integrate job-specific keywords naturally throughout the resume
- Adjust professional summary to directly address the role requirements
- Emphasize achievements that demonstrate required competencies

STRATEGIC CONTENT ADJUSTMENT:
- Reorder experience bullets to lead with most relevant achievements
- Modify language to mirror job description terminology
- Highlight transferable skills that match job requirements
- Quantify achievements in ways that resonate with the specific role
- Ensure ATS optimization for the specific company/role

COVER LETTER CREATION (if requested):
- Write a compelling, personalized cover letter
- Address specific job requirements and company needs
- Highlight most relevant qualifications and achievements
- Demonstrate knowledge of the company/role
- Include a strong call to action

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
    "professionalSummary": "[Tailored summary specifically for this job]",
    "experience": [
      {
        "title": "[Job title]",
        "company": "[Company name]",
        "location": "[Location]",
        "startDate": "[Start date]",
        "endDate": "[End date]",
        "achievements": [
          "[Reordered and emphasized achievements relevant to job]"
        ]
      }
    ],
    "education": [
      {
        "degree": "[Degree name]",
        "institution": "[Institution name]",
        "year": "[Graduation year]",
        "details": "[Additional details if relevant to job]"
      }
    ],
    "skills": {
      "technical": ["[Prioritized technical skills matching job requirements]"],
      "certifications": ["[Relevant certifications for this role]"],
      "otherRelevantSkills": ["[Other skills emphasized for this position]"]
    }
  },
  "coverLetter": "[Generated only if includeCoverLetter is true. Professional cover letter specifically tailored to the job description and company]",
  "tailoringAnalysis": {
    "jobMatchScore": "[Percentage 85-95% indicating how well the tailored resume matches the job]",
    "keywordAlignment": [
      "[Important keywords from job description that were integrated]"
    ],
    "prioritizedExperience": [
      "[Experience/achievements that were emphasized for this role]"
    ],
    "recommendedAdjustments": [
      "[Suggestions for further customization]"
    ]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { currentResume, jobDescription, includeCoverLetter, companyName, jobTitle } = await request.json();

    if (!currentResume || !jobDescription) {
      return NextResponse.json(
        { error: 'Current resume and job description are required' },
        { status: 400 }
      );
    }

    const USER_PROMPT = `Please tailor the following resume to match this specific job description${includeCoverLetter ? ' and create a personalized cover letter' : ''}:

CURRENT RESUME:
${JSON.stringify(currentResume, null, 2)}

JOB DESCRIPTION:
${jobDescription}

${companyName ? `COMPANY NAME: ${companyName}` : ''}
${jobTitle ? `JOB TITLE: ${jobTitle}` : ''}

INSTRUCTIONS:
- Analyze the job description for key requirements, skills, and qualifications
- Tailor the resume to maximize alignment with this specific role
- Integrate job-specific keywords naturally throughout
- Reorder and emphasize most relevant experience and achievements
- Adjust professional summary to directly address the role requirements
- Maintain authenticity - do not add false information
- Ensure ATS optimization for this specific job
${includeCoverLetter ? '- Create a compelling, personalized cover letter that addresses the job requirements' : ''}
- Provide analysis of the tailoring performed`;

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

    return NextResponse.json({
      success: true,
      tailoredResume: tailoredResult.tailoredResume,
      coverLetter: tailoredResult.coverLetter || null,
      tailoringAnalysis: tailoredResult.tailoringAnalysis,
      includedCoverLetter: includeCoverLetter,
    });

  } catch (error: any) {
    console.error('Error tailoring resume:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to tailor resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}