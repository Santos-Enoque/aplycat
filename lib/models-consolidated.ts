import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getModelConfig, getFallbackModelConfig } from './config';

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

// Zod schemas for structured responses
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

const ImprovedResumeSectionSchema = z.object({
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

// JSON schemas for tools
const analysisJsonSchema = zodToJsonSchema(ResumeAnalysisSchema, "ResumeAnalysis");
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
          content: this.cleanJsonResponse(completion.output_text || ''),
          usage: {
            promptTokens: completion.usage?.input_tokens,
            completionTokens: completion.usage?.output_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        };
      } else if (input.tools) {
        // Use responses API for text-only requests with tools
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
          content: this.cleanJsonResponse(completion.output_text || ''),
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
          temperature: this.config.temperature || 0.1,
          max_tokens: this.config.maxTokens || 4000,
          top_p: this.config.topP || 1,
        });

        return {
          content: this.cleanJsonResponse(completion.choices[0]?.message?.content || ''),
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
                progress: Math.min(chunkCount * 5, 95),
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
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      return this.extractPartialAnalysis(content);
    }
  }

  private extractPartialAnalysis(content: string): Partial<any> | null {
    const partial: any = {};
    
    const overallScoreMatch = content.match(/"overall_score":\s*(\d+)/);
    if (overallScoreMatch) {
      partial.overall_score = parseInt(overallScoreMatch[1]);
    }
    
    const atsScoreMatch = content.match(/"ats_score":\s*(\d+)/);
    if (atsScoreMatch) {
      partial.ats_score = parseInt(atsScoreMatch[1]);
    }
    
    const roastMatch = content.match(/"main_roast":\s*"([^"]+)"/);
    if (roastMatch) {
      partial.main_roast = roastMatch[1];
    }

    const categoryMatch = content.match(/"score_category":\s*"([^"]+)"/);
    if (categoryMatch) {
      partial.score_category = categoryMatch[1];
    }
    
    return Object.keys(partial).length > 0 ? partial : null;
  }

  private cleanJsonResponse(content: string): string {
    try {
      let cleanedContent = content.trim();
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7).trim();
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3).trim();
      }
      // Remove HTML comments like <!-- Generated using fallback model -->
      cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '').trim();
      
      // Validate that it's valid JSON by parsing and re-stringifying
      const parsed = JSON.parse(cleanedContent);
      return JSON.stringify(parsed);
    } catch (error) {
      console.error("Failed to clean JSON response from OpenAI:", content);
      // Return the original content if cleaning fails
      return content;
    }
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
      // Remove HTML comments
      cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error("Failed to parse the complete JSON response:", content);
      throw new Error("Could not parse the final AI response.");
    }
  }
}

// Gemini provider with streaming and tool support
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

  // Helper to reuse the logic for preparing the model and request
  private prepareModelAndRequest(input: ModelInput) {
    const systemMessage = input.messages.find(m => m.role === 'system');
    const userAndAssistantMessages = input.messages.filter(m => m.role !== 'system');

    const generationConfig: any = {
      temperature: this.config.temperature || 0.1,
      maxOutputTokens: this.config.maxTokens || 4000,
      topP: this.config.topP || 1,
    };
    
    let toolConfig: any = undefined;
    if (input.tools && input.tools.length > 0) {
      // Enable native JSON mode for reliable structured output
      generationConfig.responseMimeType = 'application/json';
      
      // Check if tools have function names (OpenAI format) before setting up function calling
      const functionTools = input.tools.filter(t => t.function && t.function.name);
      if (functionTools.length > 0) {
        toolConfig = {
          functionCalling: {
            mode: 'any', // Use 'any' to let the model decide or 'one' to force one tool call
            allowedFunctionNames: functionTools.map(t => t.function.name)
          }
        }
      }
    }

    const model = this.client.getGenerativeModel({
      model: this.config.model || "gemini-1.5-flash",
      generationConfig: generationConfig,
      systemInstruction: systemMessage?.content,
      tools: input.tools
    });

    const contents = userAndAssistantMessages.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      // Note: Gemini multi-modal messages are structured differently than OpenAI.
      // This implementation currently assumes files are sent with the last user message.
      if (msg.role === 'user' && input.files && input.files.length > 0) {
        for (const file of input.files) {
          parts.push({
            inlineData: {
              mimeType: file.mimeType || 'application/pdf',
              data: file.fileData,
            },
          });
        }
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts,
      };
    });

    return { model, contents };
  }


  async generateResponse(input: ModelInput): Promise<ModelResponse> {
    try {
      const { model, contents } = this.prepareModelAndRequest(input);
      const result = await model.generateContent({ contents });
      const response = result.response;
      
      const functionCalls = response.functionCalls();
      let content = '';

      if (functionCalls && functionCalls.length > 0) {
        // If the model called a function, format the arguments as a JSON string
        // This matches the behavior of the OpenAI provider when using tools
        content = JSON.stringify(functionCalls[0].args);
      } else {
        // Otherwise, use the text response and clean it
        content = this.cleanJsonResponse(response.text());
      }

      return {
        content: content,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount,
        },
      };
    } catch (error) {
      console.error('[Gemini Provider] Error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *generateResponseStream(input: ModelInput): AsyncIterable<StreamingChunk> {
    try {
      const { model, contents } = this.prepareModelAndRequest(input);
      const stream = await model.generateContentStream({ contents });

      let accumulatedContent = '';
      let chunkCount = 0;

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          accumulatedContent += text;
          chunkCount++;

          // Try to parse partial JSON and yield structured data
          const partialAnalysis = this.tryParsePartialJSON(accumulatedContent);

          if (partialAnalysis) {
            yield {
              type: 'partial_analysis',
              data: partialAnalysis,
              timestamp: new Date().toISOString(),
              progress: Math.min(chunkCount * 5, 95), // Simple progress heuristic
            };
          }
        }
      }

      // After the stream is complete, parse the final response
      // Check if the response seems complete before parsing
      const trimmedContent = accumulatedContent.trim();
      if (trimmedContent.length === 0) {
        throw new Error('Empty response from Gemini');
      }
      
      // Basic check for incomplete JSON (ends with incomplete key-value pair)
      if (trimmedContent.endsWith(':') || trimmedContent.endsWith('",') || trimmedContent.match(/"[^"]*":\s*$/)) {
        console.warn('[Gemini Provider] Response appears to be truncated:', trimmedContent.slice(-100));
        // Try to add a default completion for missing sections
        const incompleteTruncated = trimmedContent + '\n    ]\n  }\n}';
        try {
          const finalAnalysis = this.parseCompleteResponse(incompleteTruncated);
          yield {
            type: 'complete_analysis',
            data: finalAnalysis,
            timestamp: new Date().toISOString(),
            progress: 100,
          };
          return;
        } catch (truncatedError) {
          console.error('[Gemini Provider] Failed to parse truncated response:', truncatedError);
        }
      }
      
      const finalAnalysis = this.parseCompleteResponse(accumulatedContent);
      yield {
        type: 'complete_analysis',
        data: finalAnalysis,
        timestamp: new Date().toISOString(),
        progress: 100,
      };

    } catch (error) {
      console.error('[Gemini Provider] Streaming error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // --- Helper methods copied from OpenAIProvider for consistent parsing ---

  private tryParsePartialJSON(content: string): Partial<any> | null {
    try {
      // First, try to parse the whole thing. This works for complete or well-formed partial JSON.
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      // If that fails, it's likely incomplete. Use regex to extract key fields for UI updates.
      return this.extractPartialAnalysis(content);
    }
  }

  private extractPartialAnalysis(content: string): Partial<any> | null {
    const partial: any = {};
    
    // Regex for overall_score and ats_score
    const scoreMatch = content.match(/"(overall_score|ats_score)":\s*(\d+)/);
    if (scoreMatch) partial[scoreMatch[1]] = parseInt(scoreMatch[2]);

    // Regex for headline or main_roast
    const stringMatch = content.match(/"(analysis_headline|main_roast)":\s*"([^"]*)"?/);
    if (stringMatch) partial[stringMatch[1]] = stringMatch[2];
    
    // Regex for score_category
    const categoryMatch = content.match(/"score_category":\s*"([^"]*)"?/);
    if (categoryMatch) partial[categoryMatch[1]] = categoryMatch[2];

    return Object.keys(partial).length > 0 ? partial : null;
  }

  private cleanJsonResponse(content: string): string {
    try {
      let cleanedContent = content.trim();
      
      // Remove all types of markdown code blocks more aggressively
      // Handle ```json with optional newlines and spaces
      cleanedContent = cleanedContent.replace(/^```json\s*\n?/gi, '');
      cleanedContent = cleanedContent.replace(/\n?\s*```\s*$/gi, '');
      // Handle ``` without language
      cleanedContent = cleanedContent.replace(/^```\s*\n?/g, '');
      cleanedContent = cleanedContent.replace(/\n?\s*```\s*$/g, '');
      
      // Remove HTML comments like <!-- Generated using fallback model -->
      cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '').trim();
      
      // Remove any leading/trailing whitespace and newlines
      cleanedContent = cleanedContent.trim();
      
      // Enhanced JSON extraction - find the outermost complete JSON object
      const startIndex = cleanedContent.indexOf('{');
      if (startIndex >= 0) {
        let braceCount = 0;
        let endIndex = -1;
        let inString = false;
        let escapeNext = false;
        
        for (let i = startIndex; i < cleanedContent.length; i++) {
          const char = cleanedContent[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
          }
        }
        
        if (endIndex > startIndex) {
          cleanedContent = cleanedContent.substring(startIndex, endIndex + 1);
        }
      }
      
      // Validate that it's valid JSON by parsing and re-stringifying
      const parsed = JSON.parse(cleanedContent);
      return JSON.stringify(parsed);
    } catch (error) {
      console.error("Failed to clean JSON response from Gemini:", content);
      console.error("Attempting enhanced fallback cleanup...");
      
      // Enhanced fallback: try multiple approaches
      try {
        let fallbackContent = content.trim();
        
        // Method 1: Remove markdown blocks more aggressively
        fallbackContent = fallbackContent.replace(/```json\s*/gi, '').replace(/\s*```/g, '');
        fallbackContent = fallbackContent.replace(/```\s*/g, '').replace(/\s*```/g, '');
        
        // Method 2: Find JSON boundaries
        const startIndex = fallbackContent.indexOf('{');
        const lastBraceIndex = fallbackContent.lastIndexOf('}');
        
        if (startIndex >= 0 && lastBraceIndex > startIndex) {
          fallbackContent = fallbackContent.substring(startIndex, lastBraceIndex + 1);
          
          // Try to parse this cleaned content
          const parsed = JSON.parse(fallbackContent);
          console.log("Successfully recovered JSON with enhanced fallback method");
          return JSON.stringify(parsed);
        }
        
        throw new Error("Could not find valid JSON boundaries");
      } catch (fallbackError) {
        console.error("Enhanced fallback JSON cleaning also failed:", fallbackError);
        
        // Final attempt: try to extract partial JSON and complete it
        try {
          const partialMatch = content.match(/\{[\s\S]*(?="[^"]*":\s*$)/);
          if (partialMatch) {
            let partialJson = partialMatch[0];
            // Try to close incomplete structures
            if (!partialJson.endsWith('}')) {
              // Count unclosed braces and arrays
              const openBraces = (partialJson.match(/\{/g) || []).length;
              const closeBraces = (partialJson.match(/\}/g) || []).length;
              const openArrays = (partialJson.match(/\[/g) || []).length;
              const closeArrays = (partialJson.match(/\]/g) || []).length;
              
              // Close unclosed arrays first
              for (let i = 0; i < openArrays - closeArrays; i++) {
                partialJson += ']';
              }
              // Close unclosed objects
              for (let i = 0; i < openBraces - closeBraces; i++) {
                partialJson += '}';
              }
            }
            
            const parsed = JSON.parse(partialJson);
            console.log("Successfully recovered partial JSON with completion");
            return JSON.stringify(parsed);
          }
        } catch (completionError) {
          console.error("JSON completion attempt failed:", completionError);
        }
        
        // Absolutely final fallback: return a minimal error structure
        console.error("All JSON cleaning attempts failed, returning error structure");
        return JSON.stringify({
          overall_score: 0,
          ats_score: 0,
          main_roast: "Error parsing AI response",
          score_category: "Critical",
          resume_sections: [],
          missing_sections: []
        });
      }
    }
  }

  private parseCompleteResponse(content: string): any {
    try {
      // Use the same robust cleaning logic as cleanJsonResponse
      const cleanedContent = this.cleanJsonResponse(content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error("Failed to parse the complete JSON response from Gemini:", content);
      console.error("Parse error:", error);
      throw new Error("Could not parse the final AI response.");
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
  return getModelConfig();
}

// Enhanced service class with fallback support
export class ConsolidatedModelService {
  private provider: BaseModelProvider | null = null;
  private currentConfig: ModelConfig | null = null;
  private fallbackProvider: BaseModelProvider | null = null;
  private fallbackConfig: ModelConfig | null = null;

  // Get the active model provider with configuration from config.ts
  private getProvider(serviceName?: string): BaseModelProvider {
    try {
      // Get the model configuration from config.ts
      const modelConfig = getModelConfig();
      
      // Create new provider if config has changed
      if (!this.provider || JSON.stringify(this.currentConfig) !== JSON.stringify(modelConfig)) {
        this.currentConfig = modelConfig;
        
        this.provider = createModelProvider(this.currentConfig);
        console.log(`[ConsolidatedModelService] Created ${modelConfig.provider} provider with model ${modelConfig.model}`);
      }

      return this.provider;
    } catch (error) {
      console.error('[ConsolidatedModelService] Error getting provider:', error);
      throw error;
    }
  }

  // Get fallback provider from config.ts
  private getFallbackProvider(): BaseModelProvider {
    const fallbackConfig = getFallbackModelConfig();
    
    // Create new fallback provider if config has changed
    if (!this.fallbackProvider || JSON.stringify(this.fallbackConfig) !== JSON.stringify(fallbackConfig)) {
      this.fallbackConfig = fallbackConfig;
      this.fallbackProvider = createModelProvider(this.fallbackConfig);
      console.log(`[ConsolidatedModelService] Created fallback ${fallbackConfig.provider} provider with model ${fallbackConfig.model}`);
    }

    return this.fallbackProvider;
  }

  // Enhanced method that tries primary first, then fallback
  private async generateResponseWithFallback(input: ModelInput): Promise<ModelResponse> {
    try {
      // Try primary provider first
      const provider = this.getProvider();
      return await provider.generateResponse(input);
    } catch (primaryError) {
      const primaryErrorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn('[ConsolidatedModelService] Primary provider failed, trying fallback:', primaryErrorMessage);
      
      try {
        // Try fallback provider
        const fallbackProvider = this.getFallbackProvider();
        const response = await fallbackProvider.generateResponse(input);
        
        // Add a note that fallback was used
        console.log('[ConsolidatedModelService] Successfully used fallback provider');
        return {
          ...response,
          content: response.content + '\n\n<!-- Generated using fallback model -->'
        };
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error('[ConsolidatedModelService] Both primary and fallback providers failed:', {
          primaryError: primaryErrorMessage,
          fallbackError: fallbackErrorMessage
        });
        throw new Error(`Both primary and fallback models failed. Primary: ${primaryErrorMessage}, Fallback: ${fallbackErrorMessage}`);
      }
    }
  }

  // Enhanced streaming method with fallback
  private async *generateResponseStreamWithFallback(input: ModelInput): AsyncIterable<StreamingChunk> {
    try {
      // Try primary provider first
      const provider = this.getProvider();
      yield* provider.generateResponseStream(input);
    } catch (primaryError) {
      const primaryErrorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn('[ConsolidatedModelService] Primary streaming provider failed, trying fallback:', primaryErrorMessage);
      
      try {
        // Try fallback provider for streaming
        const fallbackProvider = this.getFallbackProvider();
        console.log('[ConsolidatedModelService] Using fallback provider for streaming');
        
        // Yield a metadata chunk to indicate fallback usage
        yield {
          type: 'metadata',
          data: { usingFallback: true },
          timestamp: new Date().toISOString(),
        };
        
        yield* fallbackProvider.generateResponseStream(input);
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error('[ConsolidatedModelService] Both primary and fallback streaming providers failed:', {
          primaryError: primaryErrorMessage,
          fallbackError: fallbackErrorMessage
        });
        
        yield {
          type: 'error',
          error: `Both primary and fallback models failed. Primary: ${primaryErrorMessage}, Fallback: ${fallbackErrorMessage}`,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  // NON-STREAMING METHODS (updated to use fallback)
  async analyzeResume(resumeFile: ModelFileInput): Promise<ModelResponse> {
    const { RESUME_ANALYSIS_SYSTEM_PROMPT, RESUME_ANALYSIS_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    return this.generateResponseWithFallback({
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
    const { RESUME_IMPROVEMENT_SYSTEM_PROMPT, RESUME_IMPROVEMENT_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    const userPrompt = RESUME_IMPROVEMENT_USER_PROMPT(targetRole, targetIndustry, customPrompt);

    return this.generateResponseWithFallback({
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
    const { RESUME_TAILORING_SYSTEM_PROMPT, RESUME_TAILORING_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    const userPrompt = RESUME_TAILORING_USER_PROMPT(currentResume, jobDescription, includeCoverLetter, companyName, jobTitle);

    return this.generateResponseWithFallback({
      messages: [
        { role: 'system', content: RESUME_TAILORING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
  }

  async extractJobInfo(jobUrl: string, tools?: any[], forceOpenAI?: boolean): Promise<ModelResponse> {
    const { JOB_EXTRACTION_SYSTEM_PROMPT, JOB_EXTRACTION_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    // Force OpenAI for URL extraction since web search tools are incompatible with Gemini
    if (forceOpenAI) {
      console.log('[ConsolidatedModelService] Forcing OpenAI for URL extraction operation');
      
      const openAIConfig: ModelConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 4000,
        topP: 1,
      };
      
      const openAIProvider = createModelProvider(openAIConfig);
      
      return await openAIProvider.generateResponse({
        messages: [
          { role: 'system', content: JOB_EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: JOB_EXTRACTION_USER_PROMPT(jobUrl) },
        ],
        tools,
      });
    }
    
    return this.generateResponseWithFallback({
      messages: [
        { role: 'system', content: JOB_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: JOB_EXTRACTION_USER_PROMPT(jobUrl) },
      ],
      tools,
    });
  }

  // STREAMING METHODS (updated to use fallback)
  async *analyzeResumeStream(userId: string, resumeFile: ModelFileInput): AsyncIterable<string> {
    const { RESUME_ANALYSIS_SYSTEM_PROMPT, RESUME_ANALYSIS_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');
    
    const stream = this.generateResponseStreamWithFallback({
        messages: [
            { role: 'system', content: RESUME_ANALYSIS_SYSTEM_PROMPT },
            { role: 'user', content: RESUME_ANALYSIS_USER_PROMPT },
        ],
        files: [resumeFile],
    });

    for await (const chunk of stream) {
        if (chunk.type === 'partial_analysis' || chunk.type === 'complete_analysis') {
            yield JSON.stringify(chunk.data);
        } else if (chunk.type === 'error') {
            yield JSON.stringify({ error: chunk.error });
        } else if (chunk.type === 'metadata') {
            // Pass through metadata (like fallback usage)
            yield JSON.stringify({ metadata: chunk.data });
        }
    }
  }

  async *improveResumeStream(
    userId: string,
    resumeFile: ModelFileInput,
    targetRole: string,
    targetIndustry: string,
    customPrompt?: string
  ): AsyncIterable<string> {
    const { RESUME_IMPROVEMENT_SYSTEM_PROMPT, RESUME_IMPROVEMENT_USER_PROMPT } = await import('@/lib/prompts/resume-prompts');

    const systemPrompt = RESUME_IMPROVEMENT_SYSTEM_PROMPT;
    const userPrompt = RESUME_IMPROVEMENT_USER_PROMPT(targetRole, targetIndustry, customPrompt);

    const stream = this.generateResponseStreamWithFallback({
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
        } else if (chunk.type === 'metadata') {
            // Pass through metadata (like fallback usage)
            yield JSON.stringify({ metadata: chunk.data });
        }
    }
  }

  // GENERIC METHODS (updated to use fallback)
  async generateResponse(messages: ModelMessage[], files?: ModelFileInput[], tools?: any[]): Promise<ModelResponse> {
    return this.generateResponseWithFallback({
      messages,
      files,
      tools,
    });
  }

  async refreshConfig(): Promise<void> {
    this.provider = null;
    this.currentConfig = null;
    this.fallbackProvider = null;
    this.fallbackConfig = null;
    console.log('[ConsolidatedModelService] Configuration cache cleared, will reload on next request');
  }

  // Utility method to test fallback configuration
  async testFallback(): Promise<{ primary: boolean; fallback: boolean }> {
    const testInput: ModelInput = {
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "test successful"' }
      ]
    };

    const results = { primary: false, fallback: false };

    // Test primary
    try {
      const provider = this.getProvider();
      await provider.generateResponse(testInput);
      results.primary = true;
    } catch (error) {
      console.log('[ConsolidatedModelService] Primary provider test failed:', error);
    }

    // Test fallback
    try {
      const fallbackProvider = this.getFallbackProvider();
      await fallbackProvider.generateResponse(testInput);
      results.fallback = true;
    } catch (error) {
      console.log('[ConsolidatedModelService] Fallback provider test failed:', error);
    }

    return results;
  }

  // New method to get current configuration for debugging
  getCurrentConfig(): { primary: ModelConfig; fallback: ModelConfig } {
    return {
      primary: getModelConfig(),
      fallback: getFallbackModelConfig()
    };
  }
}

// Export singleton instance for easy use
export const modelService = new ConsolidatedModelService();

// For backward compatibility, also export as streamingModelService
export const streamingModelService = modelService; 