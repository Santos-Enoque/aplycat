// Types for the Enhanced Resume Library Dashboard

import { Resume, Analysis, ImprovedResume, ResumeTag, ResumeAnalytics } from '@prisma/client';

export type ViewMode = 'grid' | 'list' | 'timeline';

export type SortOption = 
  | 'dateUploaded' 
  | 'lastModified' 
  | 'title' 
  | 'analysisScore'
  | 'mostAnalyzed'
  | 'mostImproved';

export interface FilterOptions {
  status: ProcessingStatus[];
  dateRange: [Date, Date] | null;
  hasAnalysis: boolean | null;
  hasImprovements: boolean | null;
  targetRole: string[];
  tags: string[];
  scoreRange: [number, number] | null;
}

export interface ResumeLibraryView {
  viewMode: ViewMode;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  filters: FilterOptions;
  searchQuery: string;
}

export interface ResumeWithRelations extends Resume {
  analyses: Analysis[];
  improvedResumes: ImprovedResume[];
  tags: ResumeTag[];
  analytics: ResumeAnalytics | null;
  _count?: {
    analyses: number;
    improvements: number;
    improvedResumes: number;
  };
}

export interface CVWorkflowStage {
  completed: boolean;
  date?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
}

export interface CVWorkflowState {
  resumeId: string;
  stages: {
    upload: CVWorkflowStage;
    analysis: CVWorkflowStage & { 
      score?: number;
      count?: number;
    };
    improvement: CVWorkflowStage & { 
      versions: number;
    };
    jobTailoring: CVWorkflowStage & {
      count: number;
      lastTailored?: Date;
    };
    export: {
      lastExported?: Date;
      formats: ('pdf' | 'docx' | 'txt')[];
    };
  };
  overallProgress: number; // 0-100
  nextRecommendedAction: string;
}

export interface BulkOperation {
  type: 'delete' | 'analyze' | 'improve' | 'export' | 'duplicate' | 'tag' | 'untag';
  resumeIds: string[];
  options?: Record<string, any>;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'zip';
  includeAnalysis: boolean;
  includeImprovements: boolean;
  includeMetadata: boolean;
  compressionLevel: 'none' | 'standard' | 'high';
}

export interface LibraryStatistics {
  totalResumes: number;
  totalAnalyses: number;
  totalImprovements: number;
  averageScore: number;
  recentActivity: {
    uploaded: number;
    analyzed: number;
    improved: number;
  };
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED'
}