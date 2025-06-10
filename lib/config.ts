import { ModelConfig } from './models-consolidated';

/**
 * Model Configuration from Environment Variables
 * 
 * Primary Model Configuration:
 * - MODEL_PROVIDER: 'openai' | 'gemini' | 'anthropic' (default: 'gemini')
 * - MODEL_NAME: string (default: 'gemini-2.0-flash')
 * - MODEL_TEMPERATURE: number (default: 0.1)
 * - MODEL_MAX_TOKENS: number (default: 4000)
 * - MODEL_TOP_P: number (default: 1)
 * 
 * Fallback Model Configuration:
 * - FALLBACK_MODEL_PROVIDER: 'openai' | 'gemini' | 'anthropic' (default: 'openai')
 * - FALLBACK_MODEL_NAME: string (default: 'gpt-4o-mini')
 * - FALLBACK_MODEL_TEMPERATURE: number (default: 0.1)
 * - FALLBACK_MODEL_MAX_TOKENS: number (default: 4000)
 * - FALLBACK_MODEL_TOP_P: number (default: 1)
 * 
 * Predefined Configuration Overrides:
 * Fast Mode:
 * - FAST_MODEL_PROVIDER, FAST_MODEL_NAME, FAST_MODEL_TEMPERATURE, FAST_MODEL_MAX_TOKENS, FAST_MODEL_TOP_P
 * 
 * Detailed Mode:
 * - DETAILED_MODEL_PROVIDER, DETAILED_MODEL_NAME, DETAILED_MODEL_TEMPERATURE, DETAILED_MODEL_MAX_TOKENS, DETAILED_MODEL_TOP_P
 * 
 * Creative Mode:
 * - CREATIVE_MODEL_PROVIDER, CREATIVE_MODEL_NAME, CREATIVE_MODEL_TEMPERATURE, CREATIVE_MODEL_MAX_TOKENS, CREATIVE_MODEL_TOP_P
 * 
 * Economical Mode:
 * - ECONOMICAL_MODEL_PROVIDER, ECONOMICAL_MODEL_NAME, ECONOMICAL_MODEL_TEMPERATURE, ECONOMICAL_MODEL_MAX_TOKENS, ECONOMICAL_MODEL_TOP_P
 */

// Helper function to safely parse numbers from environment variables
const parseEnvNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseEnvInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Primary model configuration - loaded from environment variables
export const defaultModelConfig: ModelConfig = {
  provider: (process.env.MODEL_PROVIDER as 'openai' | 'gemini' | 'anthropic') || 'gemini',
  model: process.env.MODEL_NAME || 'gemini-2.0-flash',
  temperature: parseEnvNumber(process.env.MODEL_TEMPERATURE, 0.1),
  maxTokens: parseEnvInt(process.env.MODEL_MAX_TOKENS, 4000),
  topP: parseEnvNumber(process.env.MODEL_TOP_P, 1),
};

// Fallback model configuration - loaded from environment variables
export const defaultFallbackModelConfig: ModelConfig = {
  provider: (process.env.FALLBACK_MODEL_PROVIDER as 'openai' | 'gemini' | 'anthropic') || 'openai',
  model: process.env.FALLBACK_MODEL_NAME || 'gpt-4o-mini',
  temperature: parseEnvNumber(process.env.FALLBACK_MODEL_TEMPERATURE, 0.1),
  maxTokens: parseEnvInt(process.env.FALLBACK_MODEL_MAX_TOKENS, 4000),
  topP: parseEnvNumber(process.env.FALLBACK_MODEL_TOP_P, 1),
};

// Environment-based configuration with fallbacks to defaults
export const getModelConfig = (): ModelConfig => {
  // Since defaultModelConfig already loads from env vars, we can just return it
  // But we keep this function for potential runtime overrides
  return {
    ...defaultModelConfig
  };
};

// Environment-based fallback configuration with fallbacks to defaults
export const getFallbackModelConfig = (): ModelConfig => {
  // Since defaultFallbackModelConfig already loads from env vars, we can just return it
  // But we keep this function for potential runtime overrides
  return {
    ...defaultFallbackModelConfig
  };
};

// Predefined configurations for different use cases - customizable via environment variables
export const modelConfigs = {
  // Fast analysis - optimized for speed
  fast: {
    ...defaultModelConfig,
    provider: (process.env.FAST_MODEL_PROVIDER as 'openai' | 'gemini' | 'anthropic') || 'openai',
    model: process.env.FAST_MODEL_NAME || 'gpt-4o-mini',
    temperature: parseEnvNumber(process.env.FAST_MODEL_TEMPERATURE, 0.1),
    maxTokens: parseEnvInt(process.env.FAST_MODEL_MAX_TOKENS, 2000),
    topP: parseEnvNumber(process.env.FAST_MODEL_TOP_P, 1),
  },
  
  // Detailed analysis - optimized for quality
  detailed: {
    ...defaultModelConfig,
    provider: (process.env.DETAILED_MODEL_PROVIDER as 'openai' | 'gemini' | 'anthropic') || defaultModelConfig.provider,
    model: process.env.DETAILED_MODEL_NAME || 'gpt-4o',
    temperature: parseEnvNumber(process.env.DETAILED_MODEL_TEMPERATURE, 0.1),
    maxTokens: parseEnvInt(process.env.DETAILED_MODEL_MAX_TOKENS, 8000),
    topP: parseEnvNumber(process.env.DETAILED_MODEL_TOP_P, defaultModelConfig.topP || 1),
  },
  
  // Creative tasks - higher temperature
  creative: {
    ...defaultModelConfig,
    provider: (process.env.CREATIVE_MODEL_PROVIDER as 'openai' | 'gemini' | 'anthropic') || defaultModelConfig.provider,
    model: process.env.CREATIVE_MODEL_NAME || defaultModelConfig.model,
    temperature: parseEnvNumber(process.env.CREATIVE_MODEL_TEMPERATURE, 0.7),
    maxTokens: parseEnvInt(process.env.CREATIVE_MODEL_MAX_TOKENS, 4000),
    topP: parseEnvNumber(process.env.CREATIVE_MODEL_TOP_P, defaultModelConfig.topP || 1),
  },
  
  // Cost-effective - using cheaper models
  economical: {
    provider: (process.env.ECONOMICAL_MODEL_PROVIDER as 'openai' | 'gemini' | 'anthropic') || 'gemini',
    model: process.env.ECONOMICAL_MODEL_NAME || 'gemini-1.5-flash',
    temperature: parseEnvNumber(process.env.ECONOMICAL_MODEL_TEMPERATURE, 0.1),
    maxTokens: parseEnvInt(process.env.ECONOMICAL_MODEL_MAX_TOKENS, 4000),
    topP: parseEnvNumber(process.env.ECONOMICAL_MODEL_TOP_P, 1),
  },
} as const;

// Export primary configuration (can be overridden in production)
export const modelConfig: ModelConfig = {
  ...defaultModelConfig,
  // Override settings here if needed for specific environments
  // provider: 'openai',
  // model: 'gpt-4o-mini',
  // temperature: 0.1,
  // maxTokens: 4000,
  // topP: 1,
}; 