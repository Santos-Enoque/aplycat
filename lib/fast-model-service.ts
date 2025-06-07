import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ultra-fast model service for instant analysis
export class FastModelService {
  private openaiClient: OpenAI | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    // Initialize clients lazily for speed
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async analyzeResumeInstant(fileName: string, fileData: string): Promise<string> {
    const startTime = Date.now();
    
    // Use the fastest available model
    const provider = process.env.MODEL_PROVIDER || 'openai';
    
    try {
      let result: string;
      
      if (provider === 'gemini' && this.geminiClient) {
        result = await this.analyzeWithGemini(fileName, fileData);
      } else if (this.openaiClient) {
        result = await this.analyzeWithOpenAI(fileName, fileData);
      } else {
        throw new Error('No AI model available');
      }
      
      const duration = Date.now() - startTime;
      console.log(`[FAST_MODEL] Analysis completed in ${duration}ms using ${provider}`);
      
      return result;
    } catch (error) {
      console.error('[FAST_MODEL] Analysis failed:', error);
      throw error;
    }
  }

  private async analyzeWithOpenAI(fileName: string, fileData: string): Promise<string> {
    if (!this.openaiClient) throw new Error('OpenAI not configured');

    // Optimized for speed - use fastest model and minimal tokens
    const completion = await this.openaiClient.responses.create({
      model: "gpt-4o-mini", // Fastest model
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: this.getSystemPrompt(),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_file',
              filename: fileName,
              file_data: `data:application/pdf;base64,${fileData}`,
            },
            {
              type: 'input_text',
              text: 'Analyze this resume and return JSON analysis.',
            },
          ],
        },
      ],
      temperature: 0.1, // Low temperature for consistency
      max_output_tokens: 3000, // Reasonable limit for speed
      top_p: 1,
      store: true,
    } as any);

    return completion.output_text || '';
  }

  private async analyzeWithGemini(fileName: string, fileData: string): Promise<string> {
    if (!this.geminiClient) throw new Error('Gemini not configured');

    const model = this.geminiClient.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Fastest Gemini model
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 3000,
        topP: 1,
      },
    });

    const parts = [
      { text: this.getSystemPrompt() + '\n\nAnalyze this resume and return JSON analysis.' },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: fileData,
        },
      },
    ];

    const result = await model.generateContent(parts);
    const response = await result.response;
    
    return response.text();
  }

  private getSystemPrompt(): string {
    // Simplified prompt for speed - no complex instructions
    return `You are a resume analysis AI. Analyze the provided resume and return a JSON response with this exact structure:

{
  "overall_score": number (0-100),
  "ats_score": number (0-100),
  "score_category": "Excellent" | "Good" | "Fair" | "Needs Improvement",
  "main_roast": "Brief constructive feedback",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "ats_keywords": ["keyword1", "keyword2", "keyword3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "sections_analysis": {
    "contact_info": {"score": number, "feedback": "brief feedback"},
    "summary": {"score": number, "feedback": "brief feedback"},
    "experience": {"score": number, "feedback": "brief feedback"},
    "education": {"score": number, "feedback": "brief feedback"},
    "skills": {"score": number, "feedback": "brief feedback"}
  }
}

Return only valid JSON, no other text.`;
  }
}

// Export singleton for immediate use
export const fastModelService = new FastModelService();