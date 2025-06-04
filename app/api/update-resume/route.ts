// app/api/update-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Professional Resume Update Specialist. Your task is to take an existing optimized resume and apply specific user-requested modifications while maintaining professional quality, ATS compliance, and alignment with the target role.

CORE MISSION: Apply the user's specific feedback and suggestions to improve the resume while preserving its professional structure and optimization for the target role.

UPDATE PRINCIPLES:

USER-DIRECTED MODIFICATIONS:
- Carefully analyze the user's specific requests and suggestions
- Apply changes that align with professional resume standards
- Maintain ATS compliance and keyword optimization
- Preserve the overall structure and formatting
- Ensure changes enhance rather than diminish the resume's effectiveness

QUALITY CONTROL:
- Do not compromise professional language or formatting
- Maintain quantifiable achievements and impact metrics
- Keep content concise and relevant to the target role
- Preserve industry-specific keywords and terminology
- Ensure all changes support the target role objectives

RESPONSE FORMAT:
Return the updated resume in the exact same JSON structure as the original, incorporating the user's requested changes while maintaining professional quality.

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
  "professionalSummary": "[Updated summary based on user feedback]",
  "experience": [
    {
      "title": "[Job title]",
      "company": "[Company name]",
      "location": "[Location]",
      "startDate": "[Start date]",
      "endDate": "[End date]",
      "achievements": [
        "[Updated achievement bullets based on user feedback]"
      ]
    }
  ],
  "education": [
    {
      "degree": "[Degree name]",
      "institution": "[Institution name]",
      "year": "[Graduation year]",
      "details": "[Additional details if applicable]"
    }
  ],
  "skills": {
    "technical": ["[Updated technical skills]"],
    "certifications": ["[Updated certifications]"],
    "otherRelevantSkills": ["[Updated other skills]"]
  },
  "improvementsAnalysis": {
    "originalResumeEffectivenessEstimateForTarget": "[Previous score]",
    "targetOptimizedResumeScore": "90-95",
    "analysisHeadline": "Resume Updated Based on User Feedback",
    "keyRevisionsImplemented": [
      "[Description of changes made based on user feedback]"
    ],
    "recommendationsForUser": [
      "[Updated recommendations after applying changes]"
    ]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { currentResume, userFeedback, targetRole, targetIndustry } = await request.json();

    if (!currentResume || !userFeedback) {
      return NextResponse.json(
        { error: 'Current resume and user feedback are required' },
        { status: 400 }
      );
    }

    const USER_PROMPT = `Please update the following resume based on the user's specific feedback and suggestions:

CURRENT RESUME:
${JSON.stringify(currentResume, null, 2)}

USER FEEDBACK AND REQUESTED CHANGES:
"${userFeedback}"

TARGET ROLE: ${targetRole}
TARGET INDUSTRY: ${targetIndustry}

INSTRUCTIONS:
- Apply the user's specific feedback and suggestions
- Maintain professional quality and ATS compliance
- Keep the resume optimized for the target role: ${targetRole} in ${targetIndustry}
- Preserve quantifiable achievements and industry keywords
- Ensure all changes enhance the resume's effectiveness
- Maintain the same JSON structure and format`;

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

    let updatedResume;
    try {
      updatedResume = JSON.parse(cleanedResult);
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
        
        updatedResume = JSON.parse(fixedResult);
      } catch (secondError) {
        throw new Error(`Failed to parse OpenAI response as JSON.`);
      }
    }

    return NextResponse.json({
      success: true,
      updatedResume,
      appliedFeedback: userFeedback,
    });

  } catch (error: any) {
    console.error('Error updating resume:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}