'use server';

import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardCache } from './dashboard-actions';
import { getCachedData, cacheKeys, cacheTTL, dashboardCache } from '@/lib/redis-cache';

// Type definitions
export interface ResumeRecord {
  id: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  title: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRecord {
  id: string;
  resumeId: string;
  fileName: string;
  overallScore: number;
  atsScore: number;
  scoreCategory: string | null;
  mainRoast: string | null;
  analysisData: any;
  createdAt: Date;
  processingTimeMs: number | null;
}

export interface ImprovementRecord {
  id: string;
  version: number;
  versionName: string | null;
  targetRole: string;
  targetIndustry: string;
  originalScore: number | null;
  improvedScore: number | null;
  improvementSummary: string | null;
  createdAt: Date;
  resume: {
    fileName: string;
    id: string;
  };
}

/**
 * Get user's resumes with pagination
 */
export async function getUserResumes(
  limit: number = 10,
  offset: number = 0
): Promise<{ resumes: ResumeRecord[]; total: number } | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.userResumes(user.id, limit, offset),
      async () => {
        const [resumes, total] = await Promise.all([
          db.resume.findMany({
            where: { userId: user.id, isActive: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          db.resume.count({
            where: { userId: user.id, isActive: true },
          }),
        ]);

        return { resumes, total };
      },
      cacheTTL.userResumes
    );
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error getting user resumes:', error);
    return null;
  }
}

/**
 * Get user's analyses with pagination
 */
export async function getUserAnalyses(
  limit: number = 10,
  offset: number = 0
): Promise<{ analyses: AnalysisRecord[]; total: number } | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.userAnalyses(user.id, limit, offset),
      async () => {
        const [analyses, total] = await Promise.all([
          db.analysis.findMany({
            where: { userId: user.id, isCompleted: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              resumeId: true,
              fileName: true,
              overallScore: true,
              atsScore: true,
              scoreCategory: true,
              mainRoast: true,
              analysisData: true,
              createdAt: true,
              processingTimeMs: true,
            },
          }),
          db.analysis.count({
            where: { userId: user.id, isCompleted: true },
          }),
        ]);

        return { analyses, total };
      },
      cacheTTL.userAnalyses
    );
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error getting user analyses:', error);
    return null;
  }
}

/**
 * Get user's improvements with pagination
 */
export async function getUserImprovements(
  limit: number = 10,
  offset: number = 0
): Promise<{ improvements: ImprovementRecord[]; total: number } | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.userImprovements(user.id, limit, offset),
      async () => {
        const [improvements, total] = await Promise.all([
          db.improvedResume.findMany({
            where: { 
              userId: user.id, 
              isCompleted: true,
              isActive: true 
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              version: true,
              versionName: true,
              targetRole: true,
              targetIndustry: true,
              originalScore: true,
              improvedScore: true,
              improvementSummary: true,
              createdAt: true,
              resume: {
                select: {
                  fileName: true,
                  id: true,
                },
              },
            },
          }),
          db.improvedResume.count({
            where: { 
              userId: user.id, 
              isCompleted: true,
              isActive: true 
            },
          }),
        ]);

        return { improvements, total };
      },
      cacheTTL.userImprovements
    );
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error getting user improvements:', error);
    return null;
  }
}

/**
 * Get a specific analysis by ID
 */
export async function getAnalysisById(analysisId: string): Promise<AnalysisRecord | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    return getCachedData(
      cacheKeys.analysisById(analysisId),
      async () => {
        const analysis = await db.analysis.findFirst({
          where: { 
            id: analysisId, 
            userId: user.id,
            isCompleted: true 
          },
          select: {
            id: true,
            resumeId: true,
            fileName: true,
            overallScore: true,
            atsScore: true,
            scoreCategory: true,
            mainRoast: true,
            analysisData: true,
            createdAt: true,
            processingTimeMs: true,
          },
        });

        return analysis;
      },
      cacheTTL.analysisById
    );
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error getting analysis:', error);
    return null;
  }
}

/**
 * Soft delete a resume
 */
export async function deleteResume(resumeId: string): Promise<boolean> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return false;

    await db.resume.update({
      where: { 
        id: resumeId,
        userId: user.id 
      },
      data: { isActive: false },
    });

    // Invalidate caches
    await dashboardCache.invalidateResume(user.id);
    revalidatePath('/dashboard');

    return true;
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error deleting resume:', error);
    return false;
  }
}

/**
 * Get resume file data for analysis
 */
export async function getResumeFileData(resumeId: string): Promise<{
  resumeId: string;
  fileName: string;
  fileData: string;
} | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    // This would need to be implemented based on your file storage strategy
    // For now, returning null as the actual implementation depends on how files are stored
    console.log('[RESUME_ACTIONS] File data retrieval not implemented for resume:', resumeId);
    return null;
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error getting resume file data:', error);
    return null;
  }
}

/**
 * Save a new resume record
 */
export async function saveResumeRecord(
  fileName: string,
  fileUrl: string,
  fileSize?: number | null,
  mimeType?: string | null,
  title?: string | null,
  description?: string | null
): Promise<ResumeRecord | null> {
  try {
    const user = await getCurrentUserFromDB();
    if (!user) return null;

    const resume = await db.resume.create({
      data: {
        userId: user.id,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        title: title || null,
        description: description || null,
      },
    });

    // Invalidate caches
    await dashboardCache.invalidateResume(user.id);
    revalidatePath('/dashboard');

    return resume;
  } catch (error) {
    console.error('[RESUME_ACTIONS] Error saving resume:', error);
    return null;
  }
} 