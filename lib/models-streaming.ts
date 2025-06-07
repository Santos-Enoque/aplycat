import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promptCache } from '@/lib/cache/prompt-cache';

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

export interface ModelFileInput {
  filename: string;
  fileData: string; // base64 encoded
  mimeType?: string;
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
          } else if (event.type === 'response.error') {
            yield {
              type: 'error',
              error: event.error || 'Unknown streaming error',
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
    const sectionsMatch = content.match(/"resume_sections":\s*\[(.*?)\]/s);
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
      return JSON.parse(content);
    } catch (error) {
      // Fallback parsing logic - use existing JSON parser
      const { parseOpenAIResponse } = eval('require')('@/lib/json-parser');
      const result = parseOpenAIResponse(content);
      return result.data;
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
  private async getProvider(): Promise<BaseModelProvider> {
    try {
      // Get active configuration from cache
      const modelConfig = await promptCache.getModelConfig();
      
      if (!modelConfig) {
        throw new Error('No active model configuration found');
      }

      // Create new provider if config has changed
      if (!this.provider || !this.currentConfig || 
          this.currentConfig.provider !== modelConfig.provider ||
          this.currentConfig.model !== modelConfig.model) {
        
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
    const provider = await this.getProvider();
    
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
  analyzeResumeStream(resumeFile: ModelFileInput): Promise<AsyncIterable<StreamingChunk>> {
    return (async () => {
      const provider = await this.getProvider();
      
      const { RESUME_ANALYSIS_SYSTEM_PROMPT, RESUME_ANALYSIS_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
      
      return provider.generateResponseStream({
        messages: [
          { role: 'system', content: RESUME_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: RESUME_ANALYSIS_USER_PROMPT },
        ],
        files: [resumeFile],
      });
    })();
  }

  // Other existing methods...
  async improveResume(
    targetRole: string, 
    targetIndustry: string, 
    customPrompt: string | undefined,
    resumeFile: ModelFileInput
  ): Promise<ModelResponse> {
    const provider = await this.getProvider();
    
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
    const provider = await this.getProvider();
    
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
    const provider = await this.getProvider();
    
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
    const provider = await this.getProvider();
    
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