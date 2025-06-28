import { db } from '@/lib/db';
import { ProcessingStatus } from '@prisma/client';

interface AnalysisCheckpointData {
  resumeId: string;
  userId: string;
  progress: number;
  partialAnalysis: any;
  status: ProcessingStatus;
}

interface ImprovementSessionData {
  resumeId: string;
  userId: string;
  targetRole?: string;
  targetIndustry?: string;
  improveInstructions?: string;
  partialImprovement?: any;
  progress: number;
  status: ProcessingStatus;
}

/**
 * StreamingAutoSave - Background auto-save service for CV processing workflows
 * 
 * Provides persistent checkpoint functionality for streaming analysis and improvement
 * operations, enabling recovery from interruptions and browser refresh/close events.
 */
export class StreamingAutoSave {
  /**
   * Save analysis progress to database checkpoint
   * Uses upsert to handle multiple saves for same resume/user combination
   */
  async saveAnalysisProgress(data: AnalysisCheckpointData): Promise<void> {
    try {
      await db.analysisCheckpoint.upsert({
        where: {
          resumeId_userId: {
            resumeId: data.resumeId,
            userId: data.userId,
          },
        },
        update: {
          progress: data.progress,
          partialAnalysis: data.partialAnalysis,
          status: data.status,
          updatedAt: new Date(),
        },
        create: {
          resumeId: data.resumeId,
          userId: data.userId,
          progress: data.progress,
          partialAnalysis: data.partialAnalysis,
          status: data.status,
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to save analysis progress:', error);
      // Don't throw - auto-save should be resilient and not interrupt user workflows
    }
  }

  /**
   * Save improvement session progress to database
   * Enables recovery of improvement workflows with targeting parameters
   */
  async saveImprovementProgress(data: ImprovementSessionData): Promise<void> {
    try {
      await db.improvementSession.upsert({
        where: {
          resumeId_userId: {
            resumeId: data.resumeId,
            userId: data.userId,
          },
        },
        update: {
          targetRole: data.targetRole,
          targetIndustry: data.targetIndustry,
          improveInstructions: data.improveInstructions,
          partialImprovement: data.partialImprovement,
          progress: data.progress,
          status: data.status,
          updatedAt: new Date(),
        },
        create: {
          resumeId: data.resumeId,
          userId: data.userId,
          targetRole: data.targetRole,
          targetIndustry: data.targetIndustry,
          improveInstructions: data.improveInstructions,
          partialImprovement: data.partialImprovement,
          progress: data.progress,
          status: data.status,
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to save improvement progress:', error);
      // Don't throw - maintain resilient auto-save behavior
    }
  }

  /**
   * Recover analysis state for a specific resume and user
   * Returns checkpoint data if available and recoverable
   */
  async recoverAnalysisState(resumeId: string, userId: string) {
    try {
      return await db.analysisCheckpoint.findUnique({
        where: {
          resumeId_userId: {
            resumeId,
            userId,
          },
        },
        include: { 
          resume: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              createdAt: true,
            }
          }
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to recover analysis state:', error);
      return null;
    }
  }

  /**
   * Recover improvement session for a specific resume and user
   * Returns session data with targeting parameters if available
   */
  async recoverImprovementSession(resumeId: string, userId: string) {
    try {
      return await db.improvementSession.findUnique({
        where: {
          resumeId_userId: {
            resumeId,
            userId,
          },
        },
        include: { 
          resume: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              createdAt: true,
            }
          }
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to recover improvement session:', error);
      return null;
    }
  }

  /**
   * Get all recoverable sessions for a user
   * Returns active checkpoints and sessions from the last 24 hours
   */
  async getRecoverableSessions(userId: string) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [analysisCheckpoints, improvementSessions] = await Promise.all([
        db.analysisCheckpoint.findMany({
          where: { 
            userId, 
            status: { in: ['IN_PROGRESS', 'PAUSED'] },
            updatedAt: { gte: oneDayAgo }
          },
          include: { 
            resume: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                createdAt: true,
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
        }),
        db.improvementSession.findMany({
          where: { 
            userId, 
            status: { in: ['IN_PROGRESS', 'PAUSED'] },
            updatedAt: { gte: oneDayAgo }
          },
          include: { 
            resume: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                createdAt: true,
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      return {
        analysisCheckpoints,
        improvementSessions,
        total: analysisCheckpoints.length + improvementSessions.length,
      };
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to get recoverable sessions:', error);
      return {
        analysisCheckpoints: [],
        improvementSessions: [],
        total: 0,
      };
    }
  }

  /**
   * Mark a checkpoint as completed
   * Used when a workflow finishes successfully
   */
  async markAnalysisCompleted(resumeId: string, userId: string, finalAnalysis?: any): Promise<void> {
    try {
      await db.analysisCheckpoint.update({
        where: {
          resumeId_userId: {
            resumeId,
            userId,
          },
        },
        data: {
          status: 'COMPLETED',
          progress: 1.0,
          partialAnalysis: finalAnalysis,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to mark analysis completed:', error);
    }
  }

  /**
   * Mark an improvement session as completed
   */
  async markImprovementCompleted(resumeId: string, userId: string, finalImprovement?: any): Promise<void> {
    try {
      await db.improvementSession.update({
        where: {
          resumeId_userId: {
            resumeId,
            userId,
          },
        },
        data: {
          status: 'COMPLETED',
          progress: 1.0,
          partialImprovement: finalImprovement,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to mark improvement completed:', error);
    }
  }

  /**
   * Mark a workflow as cancelled/dismissed by user
   */
  async cancelWorkflow(type: 'analysis' | 'improvement', id: string, userId: string): Promise<void> {
    try {
      if (type === 'analysis') {
        await db.analysisCheckpoint.update({
          where: { id, userId },
          data: { status: 'CANCELLED', updatedAt: new Date() },
        });
      } else {
        await db.improvementSession.update({
          where: { id, userId },
          data: { status: 'CANCELLED', updatedAt: new Date() },
        });
      }
    } catch (error) {
      console.error(`[StreamingAutoSave] Failed to cancel ${type} workflow:`, error);
    }
  }

  /**
   * Clean up old completed, cancelled, and error checkpoints
   * Should be run periodically to maintain database hygiene
   */
  async cleanupOldCheckpoints(): Promise<{ analysisDeleted: number; improvementDeleted: number }> {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    const errorExpiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours for errors
    
    try {
      const [analysisResult, improvementResult] = await Promise.all([
        db.analysisCheckpoint.deleteMany({
          where: {
            OR: [
              { 
                status: { in: ['COMPLETED', 'CANCELLED'] }, 
                updatedAt: { lt: expiredDate } 
              },
              { 
                status: 'ERROR', 
                updatedAt: { lt: errorExpiredDate } 
              }
            ]
          }
        }),
        db.improvementSession.deleteMany({
          where: {
            OR: [
              { 
                status: { in: ['COMPLETED', 'CANCELLED'] }, 
                updatedAt: { lt: expiredDate } 
              },
              { 
                status: 'ERROR', 
                updatedAt: { lt: errorExpiredDate } 
              }
            ]
          }
        }),
      ]);

      const result = {
        analysisDeleted: analysisResult.count,
        improvementDeleted: improvementResult.count,
      };

      console.log('[StreamingAutoSave] Cleanup completed:', result);
      return result;
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to cleanup old checkpoints:', error);
      return { analysisDeleted: 0, improvementDeleted: 0 };
    }
  }

  /**
   * Get statistics about current checkpoints
   * Useful for monitoring and debugging
   */
  async getCheckpointStats() {
    try {
      const [analysisStats, improvementStats] = await Promise.all([
        db.analysisCheckpoint.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        db.improvementSession.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      ]);

      return {
        analysis: analysisStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        improvement: improvementStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to get checkpoint stats:', error);
      return {
        analysis: {},
        improvement: {},
      };
    }
  }
}

// Export singleton instance for app-wide usage
export const streamingAutoSave = new StreamingAutoSave();