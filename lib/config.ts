import { ModelConfig } from './models';

// Default model configuration
export const defaultModelConfig: ModelConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 4000,
  topP: 1,
};

// You can override these settings for different environments
export const modelConfig: ModelConfig = {
  ...defaultModelConfig,
  // Override settings here if needed
  // provider: 'openai',
  // model: 'gpt-4o-mini',
}; 