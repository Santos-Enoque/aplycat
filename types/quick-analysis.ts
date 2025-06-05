// types/quick-analysis.ts

export interface TopIssue {
    issue: string;
    roast: string;
    fix: string;
  }
  
  export interface ShareableRoast {
    text: string;
    category: string;
    social_text: string;
  }
  
  export interface QuickResumeAnalysis {
    overall_score: number;
    ats_score: number;
    main_roast: string;
    score_category: string;
    top_issues: TopIssue[];
    actually_good: string[];
    shareable_roasts: ShareableRoast[];
    improvement_tease: string;
  }
  
  export interface QuickAnalysisResponse {
    success: boolean;
    analysis: QuickResumeAnalysis;
    fileName: string;
    resumeId?: string;
    analysisId?: string;
    processingTimeMs: number;
    timestamp: string;
    parseStrategy?: string;
    cached?: boolean;
    message?: string;
    warning?: string;
    error?: string;
    details?: string;
  }