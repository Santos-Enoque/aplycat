import { StreamingAutoSave } from './streaming-auto-save';

interface AutoSaveJob {
  id: string;
  type: 'SAVE_ANALYSIS_PROGRESS' | 'SAVE_IMPROVEMENT_PROGRESS' | 'CLEANUP_EXPIRED' | 'MARK_COMPLETED';
  data: any;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

/**
 * BackgroundProcessor - In-memory job queue for auto-save operations
 * 
 * Provides non-blocking background processing for auto-save operations to prevent
 * interrupting user workflows. Includes debouncing, retry logic, and error handling.
 * 
 * Can be upgraded to Redis-based queue for production scaling if needed.
 */
export class BackgroundProcessor {
  private jobs: Map<string, AutoSaveJob> = new Map();
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  private autoSave = new StreamingAutoSave();

  constructor() {
    // Start background processing loop
    this.startProcessingLoop();
  }

  /**
   * Start the background processing loop
   * Processes jobs every 2 seconds to balance responsiveness and performance
   */
  private startProcessingLoop(): void {
    if (this.processInterval) return;

    this.processInterval = setInterval(() => {
      this.processJobs();
    }, 2000); // Process every 2 seconds
  }

  /**
   * Stop the background processing loop
   * Useful for cleanup during app shutdown
   */
  public stopProcessingLoop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Add job to queue with debouncing support
   * 
   * @param type - Type of auto-save operation
   * @param data - Data for the operation
   * @param key - Optional key for debouncing (replaces existing job with same key)
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  async addJob(
    type: AutoSaveJob['type'], 
    data: any, 
    key?: string, 
    maxRetries: number = 3
  ): Promise<void> {
    const jobId = key || `${type}-${Date.now()}-${Math.random()}`;
    
    // Debounce: replace existing job with same key
    this.jobs.set(jobId, {
      id: jobId,
      type,
      data,
      timestamp: new Date(),
      retries: 0,
      maxRetries,
    });

    // Trigger immediate processing for high priority jobs
    if (type === 'MARK_COMPLETED') {
      setImmediate(() => this.processJobs());
    }
  }

  /**
   * Add analysis progress save job with debouncing
   */
  async saveAnalysisProgress(data: {
    resumeId: string;
    userId: string;
    progress: number;
    partialAnalysis: any;
    status: any;
  }): Promise<void> {
    const key = `analysis-progress-${data.resumeId}-${data.userId}`;
    await this.addJob('SAVE_ANALYSIS_PROGRESS', data, key);
  }

  /**
   * Add improvement progress save job with debouncing
   */
  async saveImprovementProgress(data: {
    resumeId: string;
    userId: string;
    targetRole?: string;
    targetIndustry?: string;
    improveInstructions?: string;
    partialImprovement?: any;
    progress: number;
    status: any;
  }): Promise<void> {
    const key = `improvement-progress-${data.resumeId}-${data.userId}`;
    await this.addJob('SAVE_IMPROVEMENT_PROGRESS', data, key);
  }

  /**
   * Mark workflow as completed with high priority processing
   */
  async markCompleted(type: 'analysis' | 'improvement', data: {
    resumeId: string;
    userId: string;
    finalData?: any;
  }): Promise<void> {
    await this.addJob('MARK_COMPLETED', { type, ...data }, undefined, 5);
  }

  /**
   * Schedule cleanup job (no debouncing needed)
   */
  async scheduleCleanup(): Promise<void> {
    await this.addJob('CLEANUP_EXPIRED', {}, undefined, 2);
  }

  /**
   * Process all queued jobs in background
   * Includes retry logic and error handling
   */
  private async processJobs(): Promise<void> {
    if (this.isProcessing || this.jobs.size === 0) return;
    
    this.isProcessing = true;

    const jobsToProcess = Array.from(this.jobs.entries());
    
    for (const [jobId, job] of jobsToProcess) {
      try {
        await this.processJob(job);
        this.jobs.delete(jobId);
      } catch (error) {
        console.error(`[BackgroundProcessor] Job ${jobId} failed:`, error);
        
        job.retries++;
        if (job.retries >= job.maxRetries) {
          console.error(`[BackgroundProcessor] Job ${jobId} failed after ${job.maxRetries} retries, removing`);
          this.jobs.delete(jobId);
        } else {
          // Keep job for retry with exponential backoff
          console.log(`[BackgroundProcessor] Retrying job ${jobId} (attempt ${job.retries + 1})`);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process individual job based on type
   */
  private async processJob(job: AutoSaveJob): Promise<void> {
    switch (job.type) {
      case 'SAVE_ANALYSIS_PROGRESS':
        await this.autoSave.saveAnalysisProgress(job.data);
        break;
        
      case 'SAVE_IMPROVEMENT_PROGRESS':
        await this.autoSave.saveImprovementProgress(job.data);
        break;
        
      case 'MARK_COMPLETED':
        if (job.data.type === 'analysis') {
          await this.autoSave.markAnalysisCompleted(
            job.data.resumeId, 
            job.data.userId, 
            job.data.finalData
          );
        } else {
          await this.autoSave.markImprovementCompleted(
            job.data.resumeId, 
            job.data.userId, 
            job.data.finalData
          );
        }
        break;
        
      case 'CLEANUP_EXPIRED':
        await this.autoSave.cleanupOldCheckpoints();
        break;
        
      default:
        console.warn(`[BackgroundProcessor] Unknown job type: ${job.type}`);
    }
  }

  /**
   * Get current queue status for monitoring
   */
  getQueueStatus(): {
    totalJobs: number;
    jobsByType: Record<string, number>;
    isProcessing: boolean;
    oldestJob?: Date;
  } {
    const jobsByType: Record<string, number> = {};
    let oldestJob: Date | undefined;

    for (const job of this.jobs.values()) {
      jobsByType[job.type] = (jobsByType[job.type] || 0) + 1;
      if (!oldestJob || job.timestamp < oldestJob) {
        oldestJob = job.timestamp;
      }
    }

    return {
      totalJobs: this.jobs.size,
      jobsByType,
      isProcessing: this.isProcessing,
      oldestJob,
    };
  }

  /**
   * Clear all jobs (useful for testing or emergency situations)
   */
  clearQueue(): void {
    this.jobs.clear();
  }

  /**
   * Force immediate processing of all jobs
   */
  async forceProcessJobs(): Promise<void> {
    await this.processJobs();
  }
}

// Export singleton instance for app-wide usage
export const backgroundProcessor = new BackgroundProcessor();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    backgroundProcessor.stopProcessingLoop();
  });
  
  process.on('SIGTERM', () => {
    backgroundProcessor.stopProcessingLoop();
  });
}