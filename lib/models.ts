import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define model provider types
export type ModelProvider = 'openai' | 'gemini';

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

// OpenAI implementation
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
      // Handle file uploads for OpenAI's new API format
      if (input.files && input.files.length > 0) {
        // Use the new responses API for file handling
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
        } as any); // Using 'as any' temporarily to handle API type changes

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

// High-level service functions for different operations
export class ModelService {
  private provider: BaseModelProvider;

  constructor(config?: ModelConfig) {
    this.provider = createModelProvider(config || getDefaultModelConfig());
  }

  async analyzeResume(systemPrompt: string, userPrompt: string, resumeFile: ModelFileInput): Promise<ModelResponse> {
    return this.provider.generateResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      files: [resumeFile],
    });
  }

  async improveResume(systemPrompt: string, userPrompt: string, resumeFile: ModelFileInput): Promise<ModelResponse> {
    return this.provider.generateResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      files: [resumeFile],
    });
  }

  async tailorResume(systemPrompt: string, userPrompt: string): Promise<ModelResponse> {
    return this.provider.generateResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
  }

  async extractJobInfo(systemPrompt: string, userPrompt: string, tools?: any[]): Promise<ModelResponse> {
    return this.provider.generateResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools,
    });
  }

  async generateResponse(messages: ModelMessage[], files?: ModelFileInput[], tools?: any[]): Promise<ModelResponse> {
    return this.provider.generateResponse({
      messages,
      files,
      tools,
    });
  }
}

// Export singleton instance for easy use
export const modelService = new ModelService(); 