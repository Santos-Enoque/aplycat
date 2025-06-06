// lib/cache/prompt-cache.ts
import { db } from '@/lib/db';

// Service-based prompt organization
export type ServiceType = 
  | 'RESUME_ANALYSIS'
  | 'RESUME_IMPROVEMENT' 
  | 'RESUME_TAILORING'
  | 'JOB_EXTRACTION';

export type PromptRole = 'SYSTEM' | 'USER';

interface ServicePrompts {
  RESUME_ANALYSIS: {
    SYSTEM: string;
    USER: string;
  };
  RESUME_IMPROVEMENT: {
    SYSTEM: string;
    USER: string;
  };
  RESUME_TAILORING: {
    SYSTEM: string;
    USER: string;
  };
  JOB_EXTRACTION: {
    SYSTEM: string;
    USER: string;
  };
}

interface CachedModelConfig {
  id: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  isActive: boolean;
}

class PromptCacheService {
  private prompts: ServicePrompts | null = null;
  private modelConfig: CachedModelConfig | null = null;
  private lastUpdated: Date | null = null;
  private isLoading = false;

  /**
   * Get cached prompts for a specific service (loads from DB if not cached)
   */
  async getServicePrompts(service: ServiceType): Promise<{ system: string; user: string }> {
    if (!this.prompts || this.isStale()) {
      await this.loadFromDatabase();
    }
    return {
      system: this.prompts![service].SYSTEM,
      user: this.prompts![service].USER,
    };
  }

  /**
   * Get cached model config (loads from DB if not cached)
   */
  async getModelConfig(): Promise<CachedModelConfig> {
    if (!this.modelConfig || this.isStale()) {
      await this.loadFromDatabase();
    }
    return this.modelConfig!;
  }

  /**
   * Invalidate cache and force reload
   */
  async invalidateCache(): Promise<void> {
    console.log('[PROMPT_CACHE] Invalidating cache - forcing reload from database');
    this.prompts = null;
    this.modelConfig = null;
    this.lastUpdated = null;
    await this.loadFromDatabase();
  }

  /**
   * Check if cache is stale (older than 5 minutes)
   */
  private isStale(): boolean {
    if (!this.lastUpdated) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastUpdated < fiveMinutesAgo;
  }

  /**
   * Load prompts and model config from database
   */
  private async loadFromDatabase(): Promise<void> {
    if (this.isLoading) {
      // Wait for ongoing load
      return new Promise((resolve) => {
        const checkLoad = () => {
          if (!this.isLoading) {
            resolve();
          } else {
            setTimeout(checkLoad, 50);
          }
        };
        checkLoad();
      });
    }

    this.isLoading = true;
    
    try {
      console.log('[PROMPT_CACHE] Loading prompts and model config from database...');
      
      // Get active model configuration
      const activeModelConfig = await db.modelConfiguration.findFirst({
        where: { isActive: true, isDefault: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeModelConfig) {
        console.log('[PROMPT_CACHE] No active model config found, creating default...');
        await this.createDefaultModelConfig();
        return this.loadFromDatabase();
      }

      // Get all active prompts for this configuration, organized by service
      const prompts = await db.modelPrompt.findMany({
        where: {
          configurationId: activeModelConfig.id,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Check if we have all required service prompts
      const requiredServices: ServiceType[] = [
        'RESUME_ANALYSIS',
        'RESUME_IMPROVEMENT', 
        'RESUME_TAILORING',
        'JOB_EXTRACTION'
      ];

      const missingServices = requiredServices.filter(service => {
        const systemPrompt = prompts.find(p => p.name === `${service}_SYSTEM` && p.promptType === 'SYSTEM');
        const userPrompt = prompts.find(p => p.name === `${service}_USER` && (p.promptType === 'USER' || p.promptType === 'TEMPLATE'));
        return !systemPrompt || !userPrompt;
      });

      if (missingServices.length > 0) {
        console.log('[PROMPT_CACHE] Missing service prompts detected, creating defaults:', missingServices);
        await this.createDefaultServicePrompts(activeModelConfig.id, missingServices);
        return this.loadFromDatabase();
      }

      // Build service-based cache
      this.prompts = {} as ServicePrompts;
      
      for (const service of requiredServices) {
        const systemPrompt = prompts.find(p => p.name === `${service}_SYSTEM` && p.promptType === 'SYSTEM');
        const userPrompt = prompts.find(p => p.name === `${service}_USER` && (p.promptType === 'USER' || p.promptType === 'TEMPLATE'));
        
        this.prompts[service] = {
          SYSTEM: systemPrompt?.systemPrompt || '',
          USER: userPrompt?.userPrompt || '',
        };
      }

      this.modelConfig = {
        id: activeModelConfig.id,
        provider: activeModelConfig.provider as 'openai' | 'anthropic' | 'gemini',
        model: activeModelConfig.modelName,
        temperature: activeModelConfig.temperature || 0.1,
        maxTokens: activeModelConfig.maxTokens || 4000,
        topP: activeModelConfig.topP || 1.0,
        isActive: activeModelConfig.isActive,
      };

      this.lastUpdated = new Date();
      console.log('[PROMPT_CACHE] Successfully loaded prompts and model config from database');
      
    } catch (error) {
      console.error('[PROMPT_CACHE] Error loading from database:', error);
      
      // Fallback to file-based prompts if database fails
      console.log('[PROMPT_CACHE] Falling back to file-based prompts...');
      await this.loadFallbackPrompts();
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create default model configuration
   */
  private async createDefaultModelConfig(): Promise<void> {
    const defaultConfig = await db.modelConfiguration.create({
      data: {
        name: 'Default OpenAI GPT-4o Mini',
        description: 'Default OpenAI GPT-4o Mini configuration for all resume services',
        provider: 'openai',
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 4000,
        topP: 1.0,
        isActive: true,
        isDefault: true,
        createdBy: 'system',
      },
    });

    console.log('[PROMPT_CACHE] Created default model configuration:', defaultConfig.id);
  }

  /**
   * Create default service prompts
   */
  private async createDefaultServicePrompts(configurationId: string, services?: ServiceType[]): Promise<void> {
    // Import default prompts from file
    const {
      RESUME_ANALYSIS_SYSTEM_PROMPT,
      RESUME_ANALYSIS_USER_PROMPT,
      RESUME_IMPROVEMENT_SYSTEM_PROMPT,
      RESUME_IMPROVEMENT_USER_PROMPT,
      RESUME_TAILORING_SYSTEM_PROMPT,
      RESUME_TAILORING_USER_PROMPT,
      JOB_EXTRACTION_SYSTEM_PROMPT,
      JOB_EXTRACTION_USER_PROMPT,
    } = await import('@/lib/prompts/resume-prompts');

    const servicePrompts = [
      // Resume Analysis Service
      {
        name: 'RESUME_ANALYSIS_SYSTEM',
        service: 'RESUME_ANALYSIS' as ServiceType,
        promptType: 'SYSTEM' as const,
        systemPrompt: RESUME_ANALYSIS_SYSTEM_PROMPT,
        description: 'System prompt for resume analysis service',
      },
      {
        name: 'RESUME_ANALYSIS_USER',
        service: 'RESUME_ANALYSIS' as ServiceType,
        promptType: 'USER' as const,
        userPrompt: RESUME_ANALYSIS_USER_PROMPT,
        description: 'User prompt for resume analysis service',
      },
      // Resume Improvement Service
      {
        name: 'RESUME_IMPROVEMENT_SYSTEM',
        service: 'RESUME_IMPROVEMENT' as ServiceType,
        promptType: 'SYSTEM' as const,
        systemPrompt: RESUME_IMPROVEMENT_SYSTEM_PROMPT,
        description: 'System prompt for resume improvement service',
      },
      {
        name: 'RESUME_IMPROVEMENT_USER',
        service: 'RESUME_IMPROVEMENT' as ServiceType,
        promptType: 'TEMPLATE' as const,
        userPrompt: RESUME_IMPROVEMENT_USER_PROMPT('{{targetRole}}', '{{targetIndustry}}', '{{customPrompt}}'),
        description: 'User prompt template for resume improvement service',
        templateVariables: {
          targetRole: 'string',
          targetIndustry: 'string',
          customPrompt: 'string?',
        },
      },
      // Resume Tailoring Service
      {
        name: 'RESUME_TAILORING_SYSTEM',
        service: 'RESUME_TAILORING' as ServiceType,
        promptType: 'SYSTEM' as const,
        systemPrompt: RESUME_TAILORING_SYSTEM_PROMPT,
        description: 'System prompt for resume tailoring service',
      },
      {
        name: 'RESUME_TAILORING_USER',
        service: 'RESUME_TAILORING' as ServiceType,
        promptType: 'TEMPLATE' as const,
        userPrompt: RESUME_TAILORING_USER_PROMPT(
          '{{currentResume}}',
          '{{jobDescription}}',
          false, // placeholder for includeCoverLetter
          '{{companyName}}',
          '{{jobTitle}}'
        ).replace('false', '{{includeCoverLetter}}'),
        description: 'User prompt template for resume tailoring service',
        templateVariables: {
          currentResume: 'object',
          jobDescription: 'string',
          includeCoverLetter: 'boolean',
          companyName: 'string?',
          jobTitle: 'string?',
        },
      },
      // Job Extraction Service
      {
        name: 'JOB_EXTRACTION_SYSTEM',
        service: 'JOB_EXTRACTION' as ServiceType,
        promptType: 'SYSTEM' as const,
        systemPrompt: JOB_EXTRACTION_SYSTEM_PROMPT,
        description: 'System prompt for job extraction service',
      },
      {
        name: 'JOB_EXTRACTION_USER',
        service: 'JOB_EXTRACTION' as ServiceType,
        promptType: 'TEMPLATE' as const,
        userPrompt: JOB_EXTRACTION_USER_PROMPT('{{jobUrl}}'),
        description: 'User prompt template for job extraction service',
        templateVariables: {
          jobUrl: 'string',
        },
      },
    ];

    // Filter by requested services if provided
    const promptsToCreate = services 
      ? servicePrompts.filter(p => services.includes(p.service))
      : servicePrompts;

    for (const promptData of promptsToCreate) {
      // Check if prompt already exists to avoid duplicates
      const existing = await db.modelPrompt.findFirst({
        where: {
          configurationId,
          name: promptData.name,
        },
      });

      if (!existing) {
                 await db.modelPrompt.create({
           data: {
             configurationId,
             name: promptData.name,
             promptType: promptData.promptType,
             systemPrompt: promptData.systemPrompt || null,
             userPrompt: promptData.userPrompt || null,
             description: promptData.description,
             templateVariables: promptData.templateVariables || undefined,
             isActive: true,
             createdBy: 'system',
           },
         });
      }
    }

    console.log('[PROMPT_CACHE] Created default service prompts for configuration:', configurationId);
  }

  /**
   * Fallback to file-based prompts if database is unavailable
   */
  private async loadFallbackPrompts(): Promise<void> {
    try {
      const {
        RESUME_ANALYSIS_SYSTEM_PROMPT,
        RESUME_ANALYSIS_USER_PROMPT,
        RESUME_IMPROVEMENT_SYSTEM_PROMPT,
        RESUME_IMPROVEMENT_USER_PROMPT,
        RESUME_TAILORING_SYSTEM_PROMPT,
        RESUME_TAILORING_USER_PROMPT,
        JOB_EXTRACTION_SYSTEM_PROMPT,
        JOB_EXTRACTION_USER_PROMPT,
      } = await import('@/lib/prompts/resume-prompts');

      this.prompts = {
        RESUME_ANALYSIS: {
          SYSTEM: RESUME_ANALYSIS_SYSTEM_PROMPT,
          USER: RESUME_ANALYSIS_USER_PROMPT,
        },
        RESUME_IMPROVEMENT: {
          SYSTEM: RESUME_IMPROVEMENT_SYSTEM_PROMPT,
          USER: RESUME_IMPROVEMENT_USER_PROMPT('{{targetRole}}', '{{targetIndustry}}', '{{customPrompt}}'),
        },
        RESUME_TAILORING: {
          SYSTEM: RESUME_TAILORING_SYSTEM_PROMPT,
          USER: RESUME_TAILORING_USER_PROMPT('{{currentResume}}', '{{jobDescription}}', false, '{{companyName}}', '{{jobTitle}}').replace('false', '{{includeCoverLetter}}'),
        },
        JOB_EXTRACTION: {
          SYSTEM: JOB_EXTRACTION_SYSTEM_PROMPT,
          USER: JOB_EXTRACTION_USER_PROMPT('{{jobUrl}}'),
        },
      };

      this.modelConfig = {
        id: 'fallback',
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 4000,
        topP: 1.0,
        isActive: true,
      };

      this.lastUpdated = new Date();
      console.log('[PROMPT_CACHE] Loaded fallback prompts from files');
      
    } catch (error) {
      console.error('[PROMPT_CACHE] Fatal error - cannot load fallback prompts:', error);
      throw new Error('Failed to load prompts from both database and files');
    }
  }

  /**
   * Reset to default configuration and prompts
   */
  async resetToDefaults(): Promise<void> {
    console.log('[PROMPT_CACHE] Resetting to default configuration and prompts...');
    
    try {
      // Deactivate all current configurations
      await db.modelConfiguration.updateMany({
        where: { isActive: true },
        data: { isActive: false, isDefault: false },
      });

      // Create new default configuration
      await this.createDefaultModelConfig();
      
      // Invalidate cache to force reload
      await this.invalidateCache();
      
      console.log('[PROMPT_CACHE] Successfully reset to defaults');
    } catch (error) {
      console.error('[PROMPT_CACHE] Error resetting to defaults:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const promptCache = new PromptCacheService();