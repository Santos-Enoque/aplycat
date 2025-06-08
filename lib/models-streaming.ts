import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promptCache } from '@/lib/cache/prompt-cache';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ModelFileInput } from './models'; // Re-use from existing models file

// Define model provider types
export type ModelProvider = 'openai' | 'gemini' | 'anthropic';

// Interface for model configuration
export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// Interface for model input/output
export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelInput {
  messages: ModelMessage[];
  files?: ModelFileInput[];
  tools?: any[];
}

export interface ModelResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// Streaming response chunk interface
export interface StreamingChunk {
  type: 'partial_analysis' | 'complete_analysis' | 'error' | 'metadata';
  data?: any;
  error?: string;
  timestamp: string;
  progress?: number; // 0-100
}

const ResumeSectionSchema = z.object({
  section_name: z.string().describe("The name of the resume section (e.g., 'Professional Summary', 'Experience')."),
  found: z.boolean().describe("Whether the section was found in the resume."),
  score: z.number().describe("The score for this section, from 0 to 100."),
  rating: z.enum(["Excellent", "Good", "Needs Work", "Poor"]).describe("The qualitative rating for this section."),
  roast: z.string().describe("A short, witty, and constructive roast of this section."),
  good_things: z.array(z.string()).describe("A list of specific strengths of this section."),
  issues_found: z.array(z.string()).describe("A list of specific weaknesses or issues in this section."),
  quick_fixes: z.array(z.string()).describe("A list of actionable quick fixes for the issues found."),
});

export const ResumeAnalysisSchema = z.object({
  overall_score: z.number().describe("The overall score for the entire resume, from 0 to 100."),
  ats_score: z.number().describe("The estimated Applicant Tracking System (ATS) compatibility score, from 0 to 100."),
  main_roast: z.string().describe("A summary-level, witty, and constructive roast of the entire resume."),
  score_category: z.enum(["Excellent", "Good", "Needs Work", "Poor"]).describe("The overall category based on the score."),
  resume_sections: z.array(ResumeSectionSchema).describe("A detailed analysis of each section of the resume."),
  missing_sections: z.array(z.string()).describe("A list of important sections that are missing from the resume."),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

const analysisJsonSchema = zodToJsonSchema(ResumeAnalysisSchema, "ResumeAnalysis");

// New Schema for Streaming Resume Improvement
export const ImprovedResumeSectionSchema = z.object({
  section_name: z.string().describe("The name of the resume section (e.g., 'Professional Summary', 'Experience')."),
  original_content: z.string().describe("The original content of the section for comparison."),
  improved_content: z.string().describe("The new, AI-improved content for this section, rewritten for impact."),
  changes_made: z.array(z.string()).describe("A bulleted list of the key changes made in this section.")
});

export const ImprovedResumeSchema = z.object({
  analysis_headline: z.string().describe("A one-sentence headline summarizing the core improvement strategy."),
  original_resume_score: z.number().describe("The estimated score (0-100) of the original resume for the target role."),
  improved_resume_score: z.number().describe("The estimated score (0-100) of the new, improved resume."),
  overall_feedback: z.string().describe("General feedback on the overall improvements made."),
  improved_sections: z.array(ImprovedResumeSectionSchema).describe("An array containing each rewritten section of the resume."),
});

export type ImprovedResume = z.infer<typeof ImprovedResumeSchema>;

const improvementJsonSchema = zodToJsonSchema(ImprovedResumeSchema, "ImprovedResume");

// Abstract base class for model providers
abstract class BaseModelProvider {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract generateResponse(input: ModelInput): Promise<ModelResponse>;
  abstract generateResponseStream(input: ModelInput): AsyncIterable<StreamingChunk>;
}

// OpenAI implementation with streaming support
class OpenAIProvider extends BaseModelProvider {
  private client: OpenAI;

  constructor(config: ModelConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: (globalThis as any).process?.env?.OPENAI_API_KEY || '',
    });
  }

  async generateResponse(input: ModelInput): Promise<ModelResponse> {
    try {
      // Handle file uploads with the new responses API
      if (input.files && input.files.length > 0) {
        const systemMessage = input.messages.find(m => m.role === 'system');
        const userMessage = input.messages.find(m => m.role === 'user');

        const completion = await this.client.responses.create({
          model: this.config.model || "gpt-4o-mini",
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: systemMessage?.content || '',
                },
              ],
            },
            {
              role: 'user',
              content: [
                ...input.files.map(file => ({
                  type: 'input_file' as const,
                  filename: file.filename,
                  file_data: `data:${file.mimeType || 'application/pdf'};base64,${file.fileData}`,
                })),
                {
                  type: 'input_text',
                  text: userMessage?.content || '',
                },
              ],
            },
          ],
          ...(input.tools && { tools: input.tools }),
          temperature: this.config.temperature || 0.1,
          max_output_tokens: this.config.maxTokens || 4000,
          top_p: this.config.topP || 1,
          store: true,
        } as any);

        return {
          content: completion.output_text || '',
          usage: {
            promptTokens: completion.usage?.input_tokens,
            completionTokens: completion.usage?.output_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        };
      } else {
        // Use regular chat completions for text-only
        const completion = await this.client.chat.completions.create({
          model: this.config.model || "gpt-4o-mini",
          messages: input.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          ...(input.tools && { tools: input.tools }),
          temperature: this.config.temperature || 0.1,
          max_tokens: this.config.maxTokens || 4000,
          top_p: this.config.topP || 1,
        });

        return {
          content: completion.choices[0]?.message?.content || '',
          usage: {
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        };
      }
    } catch (error) {
      console.error('[OpenAI Provider] Error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *generateResponseStream(input: ModelInput): AsyncIterable<StreamingChunk> {
    try {
      if (input.files && input.files.length > 0) {
        const systemMessage = input.messages.find(m => m.role === 'system');
        const userMessage = input.messages.find(m => m.role === 'user');

        // Use OpenAI's streaming responses API
        const stream = await this.client.responses.stream({
          model: this.config.model || "gpt-4o-mini",
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: systemMessage?.content || '',
                },
              ],
            },
            {
              role: 'user',
              content: [
                ...input.files.map(file => ({
                  type: 'input_file' as const,
                  filename: file.filename,
                  file_data: `data:${file.mimeType || 'application/pdf'};base64,${file.fileData}`,
                })),
                {
                  type: 'input_text',
                  text: userMessage?.content || '',
                },
              ],
            },
          ],
          temperature: this.config.temperature || 0.1,
          max_output_tokens: this.config.maxTokens || 4000,
          top_p: this.config.topP || 1,
          store: true,
        } as any);

        let accumulatedContent = '';
        let chunkCount = 0;

        for await (const event of stream) {
          chunkCount++;

          if (event.type === 'response.output_text.delta') {
            accumulatedContent += event.delta || '';
            
            // Try to parse partial JSON and yield structured data
            const partialAnalysis = this.tryParsePartialJSON(accumulatedContent);
            
            if (partialAnalysis) {
              yield {
                type: 'partial_analysis',
                data: partialAnalysis,
                timestamp: new Date().toISOString(),
                progress: Math.min(chunkCount * 5, 95), // Rough progress estimation
              };
            }
          } else if (event.type === 'response.completed') {
            // Parse final complete response
            const finalAnalysis = this.parseCompleteResponse(accumulatedContent);
            
            yield {
              type: 'complete_analysis',
              data: finalAnalysis,
              timestamp: new Date().toISOString(),
              progress: 100,
            };
          } else if (event.type === 'error') {
            yield {
              type: 'error',
              error: (event as any).error || 'Unknown streaming error',
              timestamp: new Date().toISOString(),
            };
            break;
          }
        }
      } else {
        // Fallback to non-streaming for text-only requests
        const response = await this.generateResponse(input);
        
        yield {
          type: 'complete_analysis',
          data: this.parseCompleteResponse(response.content),
          timestamp: new Date().toISOString(),
          progress: 100,
        };
      }
    } catch (error) {
      console.error('[OpenAI Provider] Streaming error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private tryParsePartialJSON(content: string): Partial<any> | null {
    try {
      // Try to parse complete JSON first
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      // If that fails, try to extract partial information using regex
      return this.extractPartialAnalysis(content);
    }
  }

  private extractPartialAnalysis(content: string): Partial<any> | null {
    const partial: any = {};
    
    // Extract overall score if available
    const overallScoreMatch = content.match(/"overall_score":\s*(\d+)/);
    if (overallScoreMatch) {
      partial.overall_score = parseInt(overallScoreMatch[1]);
    }
    
    // Extract ATS score if available
    const atsScoreMatch = content.match(/"ats_score":\s*(\d+)/);
    if (atsScoreMatch) {
      partial.ats_score = parseInt(atsScoreMatch[1]);
    }
    
    // Extract main roast if available
    const roastMatch = content.match(/"main_roast":\s*"([^"]+)"/);
    if (roastMatch) {
      partial.main_roast = roastMatch[1];
    }

    // Extract score category
    const categoryMatch = content.match(/"score_category":\s*"([^"]+)"/);
    if (categoryMatch) {
      partial.score_category = categoryMatch[1];
    }
    
    // Extract completed sections using more robust regex
    const sectionsMatch = content.match(/"resume_sections":\s*\[([\s\S]*?)\]/g);
    if (sectionsMatch) {
      try {
        const sectionsContent = `[${sectionsMatch[1]}]`;
        const sections = JSON.parse(sectionsContent);
        partial.resume_sections = sections;
      } catch {
        // Try to extract individual completed sections
        partial.resume_sections = this.extractPartialSections(content);
      }
    }
    
    return Object.keys(partial).length > 0 ? partial : null;
  }

  private extractPartialSections(content: string): any[] {
    const sections: any[] = [];
    
    // Look for completed section objects in the content - use simpler regex for compatibility
    const sectionMatches = content.match(/{\s*"section_name":\s*"[^"]+"/g);
    if (sectionMatches) {
      for (const match of sectionMatches) {
        try {
          // Find the complete object for this section
          const startIndex = content.indexOf(match);
          let braceCount = 0;
          let endIndex = startIndex;
          
          for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
          
          const sectionJson = content.substring(startIndex, endIndex);
          const sectionObj = JSON.parse(sectionJson);
          sections.push(sectionObj);
        } catch {
          // Skip invalid sections
          continue;
        }
      }
    }
    
    return sections;
  }

  private parseCompleteResponse(content: string): any {
    try {
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7).trim();
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3).trim();
      }
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error("Failed to parse the complete JSON response:", content);
      throw new Error("Could not parse the final AI response.");
    }
  }
}

// Gemini provider (non-streaming for now, can be enhanced later)
class GeminiProvider extends BaseModelProvider {
  private client: GoogleGenerativeAI;

  constructor(config: ModelConfig) {
    super(config);
    const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for Gemini provider');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(input: ModelInput): Promise<ModelResponse> {
    // Implementation from existing models-updated.ts
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model || "gemini-1.5-flash",
        generationConfig: {
          temperature: this.config.temperature || 0.1,
          maxOutputTokens: this.config.maxTokens || 4000,
          topP: this.config.topP || 1,
        },
      });

      // Convert messages to Gemini format (same as existing)
      const systemMessage = input.messages.find(m => m.role === 'system');
      const filteredMessages = input.messages.filter(m => m.role !== 'system');

      const history = [];
      for (let i = 0; i < filteredMessages.length - 1; i++) {
        const msg = filteredMessages[i];
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }

      const lastMessage = filteredMessages[filteredMessages.length - 1];
      let prompt = systemMessage ? `${systemMessage.content}\n\n${lastMessage?.content || ''}` : lastMessage?.content || '';

      if (input.files && input.files.length > 0) {
        const parts: any[] = [{ text: prompt }];
        
        for (const file of input.files) {
          // Convert base64 string to buffer-like format for Gemini
          const binaryString = atob(file.fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          parts.push({
            inlineData: {
              mimeType: file.mimeType || 'application/pdf',
              data: file.fileData, // Use original base64 data
            },
          });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        
        return {
          content: response.text(),
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount,
          },
        };
      } else {
        let result;
        if (history.length > 0) {
          const chat = model.startChat({ history });
          result = await chat.sendMessage(prompt);
        } else {
          result = await model.generateContent(prompt);
        }

        const response = await result.response;
        
        return {
          content: response.text(),
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount,
          },
        };
      }
    } catch (error) {
      console.error('[Gemini Provider] Error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *generateResponseStream(input: ModelInput): AsyncIterable<StreamingChunk> {
    // For now, fallback to non-streaming for Gemini
    // TODO: Implement Gemini streaming when available
    try {
      const response = await this.generateResponse(input);
      
      yield {
        type: 'complete_analysis',
        data: JSON.parse(response.content),
        timestamp: new Date().toISOString(),
        progress: 100,
      };
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Factory function to create model providers
export function createModelProvider(config: ModelConfig): BaseModelProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    default:
      throw new Error(`Unsupported model provider: ${config.provider}`);
  }
}

// Enhanced service class with streaming support
export class StreamingModelService {
  private provider: BaseModelProvider | null = null;
  private currentConfig: ModelConfig | null = null;

  // Get the active model provider with configuration
  private async getProvider(serviceName: string): Promise<BaseModelProvider> {
    try {
      // Fetch the active model configuration from cache/db
      let modelConfig = await promptCache.getModelConfig(serviceName);
      
      if (!modelConfig) {
        console.warn('[StreamingModelService] No active model configuration found in database. Falling back to default.');
        modelConfig = {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.1,
          maxTokens: 4000,
        };
      }

      // Create new provider if config has changed
      if (!this.provider || JSON.stringify(this.currentConfig) !== JSON.stringify(modelConfig)) {
        this.currentConfig = {
          provider: modelConfig.provider as ModelProvider,
          model: modelConfig.model,
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens,
          topP: modelConfig.topP,
        };
        
        this.provider = createModelProvider(this.currentConfig);
        console.log(`[StreamingModelService] Created ${modelConfig.provider} provider with model ${modelConfig.model}`);
      }

      return this.provider;
    } catch (error) {
      console.error('[StreamingModelService] Error getting provider:', error);
      throw error;
    }
  }

  // Traditional non-streaming analysis
  async analyzeResume(resumeFile: ModelFileInput): Promise<ModelResponse> {
    const provider = await this.getProvider('RESUME_ANALYSIS');
    
    const { RESUME_ANALYSIS_SYSTEM_PROMPT, RESUME_ANALYSIS_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    return provider.generateResponse({
      messages: [
        { role: 'system', content: RESUME_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: RESUME_ANALYSIS_USER_PROMPT },
      ],
      files: [resumeFile],
    });
  }

  // New streaming analysis method
  async *analyzeResumeStream(userId: string, resumeFile: ModelFileInput): AsyncIterable<string> {
    const provider = await this.getProvider('RESUME_ANALYSIS');
    
    /*
    // Deduct credits before starting analysis to prevent unauthorized use
    try {
        const updatedUser = await this.deductCredit(userId);
        if (!updatedUser) {
            yield JSON.stringify({ error: "Credit deduction failed or user not found.", analysis: null });
            return;
        }
    } catch (error) {
        yield JSON.stringify({ error: "Failed to deduct credits.", analysis: null });
        return;
    }
    */

    const systemPrompt = await this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    
    const stream = provider.generateResponseStream({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        files: [resumeFile],
    });

    for await (const chunk of stream) {
        if (chunk.type === 'partial_analysis' || chunk.type === 'complete_analysis') {
            yield JSON.stringify(chunk.data);
        } else if (chunk.type === 'error') {
            yield JSON.stringify({ error: chunk.error });
        }
    }
  }

  // Other existing methods...
  async *improveResumeStream(
    userId: string,
    resumeFile: ModelFileInput,
    targetRole: string,
    targetIndustry: string,
    customPrompt?: string
  ): AsyncIterable<string> {
    const provider = await this.getProvider('RESUME_IMPROVEMENT');
    const { RESUME_IMPROVEMENT_SYSTEM_PROMPT, RESUME_IMPROVEMENT_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');

    const systemPrompt = RESUME_IMPROVEMENT_SYSTEM_PROMPT;
    const userPrompt = RESUME_IMPROVEMENT_USER_PROMPT(targetRole, targetIndustry, customPrompt);

    const stream = provider.generateResponseStream({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        files: [resumeFile],
        tools: [{
            type: 'function',
            function: {
                name: 'displayImprovedResume',
                description: 'Displays the improved resume to the user.',
                parameters: improvementJsonSchema,
            }
        }]
    });

    for await (const chunk of stream) {
        if (chunk.type === 'partial_analysis' || chunk.type === 'complete_analysis') {
            yield JSON.stringify(chunk.data);
        } else if (chunk.type === 'error') {
            yield JSON.stringify({ error: chunk.error });
        }
    }
  }

  async improveResume(
    targetRole: string, 
    targetIndustry: string, 
    customPrompt: string | undefined,
    resumeFile: ModelFileInput
  ): Promise<ModelResponse> {
    const provider = await this.getProvider('RESUME_IMPROVEMENT');
    
    const { RESUME_IMPROVEMENT_SYSTEM_PROMPT, RESUME_IMPROVEMENT_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    const userPrompt = RESUME_IMPROVEMENT_USER_PROMPT(targetRole, targetIndustry, customPrompt);

    return provider.generateResponse({
      messages: [
        { role: 'system', content: RESUME_IMPROVEMENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      files: [resumeFile],
    });
  }

  async tailorResume(
    currentResume: unknown,
    jobDescription: string,
    includeCoverLetter: boolean = false,
    companyName?: string,
    jobTitle?: string
  ): Promise<ModelResponse> {
    const provider = await this.getProvider('RESUME_TAILORING');
    
    const { RESUME_TAILORING_SYSTEM_PROMPT, RESUME_TAILORING_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    const userPrompt = RESUME_TAILORING_USER_PROMPT(currentResume, jobDescription, includeCoverLetter, companyName, jobTitle);

    return provider.generateResponse({
      messages: [
        { role: 'system', content: RESUME_TAILORING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
  }

  async extractJobInfo(jobUrl: string, tools?: any[]): Promise<ModelResponse> {
    const provider = await this.getProvider('JOB_EXTRACTION');
    
    const { JOB_EXTRACTION_SYSTEM_PROMPT, JOB_EXTRACTION_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    return provider.generateResponse({
      messages: [
        { role: 'system', content: JOB_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: JOB_EXTRACTION_USER_PROMPT(jobUrl) },
      ],
      tools,
    });
  }

  async generateResponse(messages: ModelMessage[], files?: ModelFileInput[], tools?: any[]): Promise<ModelResponse> {
    const provider = await this.getProvider('UNKNOWN');
    
    return provider.generateResponse({
      messages,
      files,
      tools,
    });
  }

  async refreshConfig(): Promise<void> {
    this.provider = null;
    this.currentConfig = null;
    console.log('[StreamingModelService] Configuration cache cleared, will reload on next request');
  }

  /*
  private async deductCredit(userId: string) {
    // This is a placeholder. In a real app, you'd have proper credit deduction logic.
    // For now, we'll just log it.
    console.log(`Deducting credit for user ${userId}`);
    return { id: userId, credits: 99 }; // Return a mock user object
  }
  */

  private async getSystemPrompt(): Promise<string> {
    const { RESUME_ANALYSIS_SYSTEM_PROMPT } = await import('@/lib/prompts/resume-prompts');
    return RESUME_ANALYSIS_SYSTEM_PROMPT;
  }

  private getUserPrompt(): string {
    // This could be dynamic in the future, hence it's a method
    return 'Analyze this resume.';
  }
}

// Export singleton instance for easy use
export const streamingModelService = new StreamingModelService();

// Helper function to get default model configuration
export function getDefaultModelConfig(): ModelConfig {
  const provider = ((globalThis as any).process?.env?.MODEL_PROVIDER as ModelProvider) || 'openai';
  
  return {
    provider,
    model: provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash',
    temperature: 0.1,
    maxTokens: 4000,
    topP: 1,
  };
}