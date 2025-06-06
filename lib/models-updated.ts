// lib/models-updated.ts
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

// Abstract base class for model providers
abstract class BaseModelProvider {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract generateResponse(input: ModelInput): Promise<ModelResponse>;
}

// OpenAI implementation using the new responses API
class OpenAIProvider extends BaseModelProvider {
  private client: OpenAI;

  constructor(config: ModelConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
        } as any); // Using 'as any' to handle API type changes

        return {
          content: completion.output_text || '',
          usage: {
            promptTokens: completion.usage?.input_tokens,
            completionTokens: completion.usage?.output_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        };
      } else if (input.tools) {
        // Use responses API for text-only requests with tools (like web search)
        const completion = await this.client.responses.create({
          model: this.config.model || "gpt-4o-mini",
          input: input.messages.map(msg => ({
            role: msg.role as 'system' | 'user' | 'assistant',
            content: [
              {
                type: 'input_text',
                text: msg.content,
              },
            ],
          })),
          text: {
            format: {
              type: "text"
            }
          },
          reasoning: {},
          tools: input.tools,
          temperature: this.config.temperature || 0.1,
          max_output_tokens: this.config.maxTokens || 4000,
          top_p: this.config.topP || 1,
          store: true
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
        // Use regular chat completions for simple text-only requests without tools
        const completion = await this.client.chat.completions.create({
          model: this.config.model || "gpt-4o-mini",
          messages: input.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
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
}

// Gemini implementation
class GeminiProvider extends BaseModelProvider {
  private client: GoogleGenerativeAI;

  constructor(config: ModelConfig) {
    super(config);
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for Gemini provider');
    }
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async generateResponse(input: ModelInput): Promise<ModelResponse> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model || "gemini-1.5-flash",
        generationConfig: {
          temperature: this.config.temperature || 0.1,
          maxOutputTokens: this.config.maxTokens || 4000,
          topP: this.config.topP || 1,
        },
      });

      // Convert messages to Gemini format
      const systemMessage = input.messages.find(m => m.role === 'system');
      const userMessages = input.messages.filter(m => m.role === 'user');
      const assistantMessages = input.messages.filter(m => m.role === 'assistant');

      // Build chat history for multi-turn conversations
      const history = [];
      const allMessages = input.messages.slice(); // Copy array

      // Remove system message for separate handling
      const filteredMessages = allMessages.filter(m => m.role !== 'system');

      // Convert to Gemini chat format
      for (let i = 0; i < filteredMessages.length - 1; i++) {
        const msg = filteredMessages[i];
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }

      // Get the last user message
      const lastMessage = filteredMessages[filteredMessages.length - 1];
      
      let prompt = '';
      if (systemMessage) {
        prompt = `${systemMessage.content}\n\n${lastMessage?.content || ''}`;
      } else {
        prompt = lastMessage?.content || '';
      }

      // Handle file uploads for Gemini
      if (input.files && input.files.length > 0) {
        const parts: any[] = [{ text: prompt }];
        
        for (const file of input.files) {
          // Convert base64 to buffer for Gemini
          const buffer = Buffer.from(file.fileData, 'base64');
          parts.push({
            inlineData: {
              mimeType: file.mimeType || 'application/pdf',
              data: buffer.toString('base64'),
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
        // Text-only generation
        let result;
        if (history.length > 0) {
          // Multi-turn chat
          const chat = model.startChat({ history });
          result = await chat.sendMessage(prompt);
        } else {
          // Single message
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

// Service class that uses cached prompts and model configurations
export class ModelService {
  private provider: BaseModelProvider | null = null;
  private currentConfig: ModelConfig | null = null;

  // Get the active model provider with configuration from cache
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
        console.log(`[ModelService] Created ${modelConfig.provider} provider with model ${modelConfig.model}`);
      }

      return this.provider;
    } catch (error) {
      console.error('[ModelService] Error getting provider:', error);
      throw error;
    }
  }

  async analyzeResume(resumeFile: ModelFileInput): Promise<ModelResponse> {
    const provider = await this.getProvider();
    
    // ALWAYS use the file-based prompts to ensure consistency
    const { RESUME_ANALYSIS_SYSTEM_PROMPT, RESUME_ANALYSIS_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    return provider.generateResponse({
      messages: [
        { role: 'system', content: RESUME_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: RESUME_ANALYSIS_USER_PROMPT },
      ],
      files: [resumeFile],
    });
  }

  async improveResume(
    targetRole: string, 
    targetIndustry: string, 
    customPrompt: string | undefined,
    resumeFile: ModelFileInput
  ): Promise<ModelResponse> {
    const provider = await this.getProvider();
    
    // ALWAYS use the file-based prompts to ensure consistency
    const { RESUME_IMPROVEMENT_SYSTEM_PROMPT, RESUME_IMPROVEMENT_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    // Use the template function from the file-based prompts
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
    
    // ALWAYS use the file-based prompts to ensure consistency
    const { RESUME_TAILORING_SYSTEM_PROMPT, RESUME_TAILORING_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    // Use the template function from the file-based prompts
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
    
    // ALWAYS use the file-based prompts for job extraction to ensure consistency
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

  // Method to refresh configuration (useful for admin changes)
  async refreshConfig(): Promise<void> {
    this.provider = null;
    this.currentConfig = null;
    console.log('[ModelService] Configuration cache cleared, will reload on next request');
  }
}

// Export singleton instance for easy use
export const modelService = new ModelService();

// Helper function to get default model configuration
export function getDefaultModelConfig(): ModelConfig {
  const provider = (process.env.MODEL_PROVIDER as ModelProvider) || 'openai';
  
  return {
    provider,
    model: provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash',
    temperature: 0.1,
    maxTokens: 4000,
    topP: 1,
  };
}