interface BackgroundOperationResult {
  resumeId?: string;
  analysisId?: string;
  uploadUrl?: string;
  fileKey?: string;
  operationId: string;
  error?: string;
  success: boolean;
  timestamp: string;
}

interface UploadResult {
  url: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
}

interface DatabaseUser {
  id: string;
  credits: number;
  totalCreditsUsed: number;
}

export class BackgroundOperations {
  private static operations = new Map<string, Promise<BackgroundOperationResult>>();
  private static readonly OPERATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Start background operations for streaming analysis
   * Returns operation ID immediately, operations run in background
   */
  static async startAnalysisOperations(
    userId: string,
    fileData: string,
    fileName: string
  ): Promise<string> {
    const operationId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[BACKGROUND_OPS] Starting operations: ${operationId}`);
    
    const operation = this.executeAnalysisOperations(userId, fileData, fileName, operationId);
    this.operations.set(operationId, operation);
    
    // Clean up after timeout
    setTimeout(() => {
      this.operations.delete(operationId);
      console.log(`[BACKGROUND_OPS] Cleaned up operation: ${operationId}`);
    }, this.OPERATION_TIMEOUT);
    
    return operationId;
  }

  /**
   * Get the result of a background operation
   */
  static async getOperationResult(operationId: string): Promise<BackgroundOperationResult | null> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`[BACKGROUND_OPS] Operation not found: ${operationId}`);
      return null;
    }
    
    try {
      const result = await operation;
      console.log(`[BACKGROUND_OPS] Retrieved result for: ${operationId}`);
      return result;
    } catch (error) {
      console.error(`[BACKGROUND_OPS] Operation failed: ${operationId}`, error);
      return { 
        operationId,
        error: error instanceof Error ? error.message : 'Operation failed',
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute the main analysis operations in background
   */
  private static async executeAnalysisOperations(
    userId: string,
    fileData: string,
    fileName: string,
    operationId: string
  ): Promise<BackgroundOperationResult> {
    const startTime = Date.now();
    console.log(`[BACKGROUND_OPS] Executing operations: ${operationId}`);
    
    try {
      // Step 1: Validate user and check credits
      const dbUser = await this.validateUserAndCredits(userId);
      
      // Step 2: Upload file (parallel with other operations)
      const uploadPromise = this.uploadFile(fileData, fileName);
      
      // Step 3: Create initial resume record (can run while upload is happening)
      const [uploadResult, resumeRecord] = await Promise.all([
        uploadPromise,
        this.createResumeRecord(userId, fileName, fileData)
      ]);

      // Update resume record with permanent URL if upload succeeded
      let finalResumeRecord = resumeRecord;
      if (uploadResult.url !== resumeRecord.fileUrl) {
        finalResumeRecord = await this.updateResumeRecord(resumeRecord.id, uploadResult);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[BACKGROUND_OPS] Operations completed in ${processingTime}ms: ${operationId}`);

      return {
        operationId,
        resumeId: finalResumeRecord.id,
        uploadUrl: uploadResult.url,
        fileKey: uploadResult.fileKey,
        success: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[BACKGROUND_OPS] Operations failed after ${processingTime}ms: ${operationId}`, error);
      
      return { 
        operationId,
        error: error instanceof Error ? error.message : 'Operations failed',
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate user exists and has credits
   */
  private static async validateUserAndCredits(userId: string): Promise<DatabaseUser> {
    const { getCurrentUserFromDB } = await import('@/lib/auth/user-sync');
    
    const dbUser = await getCurrentUserFromDB();
    if (!dbUser) {
      throw new Error('User not found in database');
    }

    if (dbUser.credits <= 0) {
      throw new Error('Insufficient credits for analysis');
    }

    console.log(`[BACKGROUND_OPS] User validated: ${userId}, Credits: ${dbUser.credits}`);
    return dbUser;
  }

  /**
   * Upload file to storage (UploadThing or similar)
   */
  private static async uploadFile(fileData: string, fileName: string): Promise<UploadResult> {
    try {
      console.log(`[BACKGROUND_OPS] Starting file upload: ${fileName}`);
      
      // TODO: Implement actual UploadThing upload
      // For now, simulate an upload delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileSize = Math.round((fileData.length * 3) / 4); // Approximate size from base64
      const mockResult: UploadResult = {
        url: `https://mock-storage.com/${Date.now()}-${fileName}`,
        fileKey: `resumes/${Date.now()}-${fileName}`,
        fileName,
        fileSize,
      };

      console.log(`[BACKGROUND_OPS] File upload completed: ${fileName}`);
      return mockResult;
      
    } catch (error) {
      console.error(`[BACKGROUND_OPS] File upload failed: ${fileName}`, error);
      
      // Fallback to base64 storage if upload fails
      const fileSize = Math.round((fileData.length * 3) / 4);
      return {
        url: `data:application/pdf;base64,${fileData}`,
        fileKey: `temp-${Date.now()}`,
        fileName,
        fileSize,
      };
    }
  }

  /**
   * Create initial resume record in database
   */
  private static async createResumeRecord(
    userId: string, 
    fileName: string, 
    fileData: string
  ) {
    const { db } = await import('@/lib/db');
    
    try {
      const fileSize = Math.round((fileData.length * 3) / 4);
      
      const resume = await db.resume.create({
        data: {
          userId,
          fileName,
          fileUrl: `data:application/pdf;base64,${fileData}`, // Temporary URL
          fileSize,
          mimeType: 'application/pdf',
          title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        },
      });

      console.log(`[BACKGROUND_OPS] Resume record created: ${resume.id}`);
      return resume;
      
    } catch (error) {
      console.error(`[BACKGROUND_OPS] Failed to create resume record:`, error);
      throw new Error(`Failed to create resume record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update resume record with permanent storage URL
   */
  private static async updateResumeRecord(resumeId: string, uploadResult: UploadResult) {
    const { db } = await import('@/lib/db');
    
    try {
      const updatedResume = await db.resume.update({
        where: { id: resumeId },
        data: {
          fileUrl: uploadResult.url,
          fileSize: uploadResult.fileSize,
        },
      });

      console.log(`[BACKGROUND_OPS] Resume record updated: ${resumeId}`);
      return updatedResume;
      
    } catch (error) {
      console.error(`[BACKGROUND_OPS] Failed to update resume record:`, error);
      throw error;
    }
  }

  /**
   * Save analysis result to database after streaming completes
   */
  static async saveAnalysisResult(
    operationId: string,
    analysisData: any,
    fileName: string,
    processingTimeMs: number
  ): Promise<string | null> {
    try {
      console.log(`[BACKGROUND_OPS] Saving analysis result: ${operationId}`);
      
      // Get background operation result
      const backgroundResult = await this.getOperationResult(operationId);
      if (!backgroundResult?.success || !backgroundResult.resumeId) {
        console.warn(`[BACKGROUND_OPS] No valid background result for: ${operationId}`);
        return null;
      }

      const { db } = await import('@/lib/db');
      const { getCurrentUserFromDB } = await import('@/lib/auth/user-sync');
      const { dashboardCache } = await import('@/lib/redis-cache');
      
      // Get user for database operations
      const dbUser = await getCurrentUserFromDB();
      if (!dbUser) {
        throw new Error('User not found for analysis save');
      }

      // Create analysis record
      const savedAnalysis = await db.analysis.create({
        data: {
          userId: dbUser.id,
          resumeId: backgroundResult.resumeId,
          fileName,
          processingTimeMs,
          overallScore: analysisData.overall_score || 0,
          atsScore: analysisData.ats_score || 0,
          scoreCategory: analysisData.score_category || 'Unknown',
          mainRoast: analysisData.main_roast || 'Analysis completed',
          analysisData,
          creditsUsed: 1,
          isCompleted: true,
        },
      });

      console.log(`[BACKGROUND_OPS] Analysis saved: ${savedAnalysis.id}`);

      // Record credit transaction
      await db.creditTransaction.create({
        data: {
          userId: dbUser.id,
          type: 'ANALYSIS_USE',
          amount: -1,
          description: `Streaming resume analysis: ${fileName}`,
          relatedAnalysisId: savedAnalysis.id,
        },
      });

      // Update user credits
      await db.user.update({
        where: { id: dbUser.id },
        data: {
          credits: { decrement: 1 },
          totalCreditsUsed: { increment: 1 },
        },
      });

      console.log(`[BACKGROUND_OPS] Credits deducted for user: ${dbUser.id}`);

      // Invalidate cache
      await dashboardCache.invalidateAnalysis(savedAnalysis.id, dbUser.id);

      return savedAnalysis.id;
      
    } catch (error) {
      console.error(`[BACKGROUND_OPS] Failed to save analysis:`, error);
      return null;
    }
  }

  /**
   * Get operation status for monitoring
   */
  static getOperationStatus(operationId: string): 'pending' | 'completed' | 'not_found' {
    const operation = this.operations.get(operationId);
    if (!operation) return 'not_found';
    
    // Check if promise is resolved (this is a simple heuristic)
    return 'pending'; // In a real implementation, you'd track the status properly
  }

  /**
   * Cancel an operation (if possible)
   */
  static cancelOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) return false;
    
    this.operations.delete(operationId);
    console.log(`[BACKGROUND_OPS] Cancelled operation: ${operationId}`);
    return true;
  }

  /**
   * Get all active operations (for monitoring)
   */
  static getActiveOperations(): string[] {
    return Array.from(this.operations.keys());
  }

  /**
   * Clean up old operations manually
   */
  static cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [operationId] of this.operations) {
      // Extract timestamp from operationId
      const timestampMatch = operationId.match(/analysis_(\d+)_/);
      if (timestampMatch) {
        const operationTime = parseInt(timestampMatch[1]);
        if (now - operationTime > this.OPERATION_TIMEOUT) {
          toDelete.push(operationId);
        }
      }
    }
    
    for (const operationId of toDelete) {
      this.operations.delete(operationId);
      console.log(`[BACKGROUND_OPS] Cleaned up expired operation: ${operationId}`);
    }
    
    console.log(`[BACKGROUND_OPS] Cleanup completed. Active operations: ${this.operations.size}`);
  }
}

// Export utility functions
export async function startStreamingAnalysisBackground(
  userId: string,
  fileData: string,
  fileName: string
): Promise<string> {
  return BackgroundOperations.startAnalysisOperations(userId, fileData, fileName);
}

export async function saveStreamingAnalysisResult(
  operationId: string,
  analysisData: any,
  fileName: string,
  processingTimeMs: number
): Promise<string | null> {
  return BackgroundOperations.saveAnalysisResult(operationId, analysisData, fileName, processingTimeMs);
}

export function getBackgroundOperationResult(operationId: string): Promise<BackgroundOperationResult | null> {
  return BackgroundOperations.getOperationResult(operationId);
}