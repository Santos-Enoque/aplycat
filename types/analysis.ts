// types/analysis.ts

export interface ImprovementPotential {
  points_possible: number;
  headline: string;
}

export interface ResumeSection {
  section_name: string;
  found: boolean;
  score: number;
  roast: string;
  
  // Primary format (matching new prompt structure)
  issues: string[];
  strengths: string[];
  tips: Array<{
    issue: string;
    tip: string;
    example: string;
  }>;
  
  // Backward compatibility - legacy format (optional)
  rating?: string; // "Critical" | "Needs Work" | "Good" | "Excellent"
  good_things?: string[]; // Max 3 items
  issues_found?: string[]; // Max 3 items
  quick_fixes?: string[]; // Max 3 items
  improvements?: Array<{
    issue: string;
    fix: string;
    example: string;
  }>;
}
  
export interface MissingSection {
  section_name: string;
  importance: 'Critical' | 'Important' | 'Nice-to-have';
  roast: string;
  recommendation: string;
}
  
export interface FormattingIssue {
  issue: string;
  severity: 'High' | 'Medium' | 'Low';
  fix: string;
}
  
export interface KeywordAnalysis {
  missing_keywords: string[];
  overused_buzzwords: string[];
  weak_action_verbs: string[];
}
  
export interface QuantificationIssues {
  missing_metrics: string[];
  vague_statements: string[];
}
  
export interface IndustryAdvice {
  detected_industry: string;
  industry_standards: string[];
  industry_keywords: string[];
}
  
export interface ActionItem {
  title: string;
  description: string;
  icon: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'gray';
  time_estimate: string;
}
  
export interface GoodStuff {
  title: string;
  roast: string;
  description: string;
}
  
export interface NeedsWork {
  title: string;
  roast: string;
  issue: string;
  fix: string;
  example: string;
}
  
export interface CriticalIssue {
  title: string;
  roast: string;
  disaster: string;
  fix: string;
  example: string;
}
  
export interface ShareableRoast {
  id: string;
  text: string;
  category: string;
  shareText: string;
  platform: string;
}
  
export interface ActionPlan {
  immediate: ActionItem[];
  longTerm: ActionItem[];
}
  
export interface ResumeAnalysis {
  overall_score: number;
  ats_score: number;
  main_roast: string;
  score_category: string; // "Critical" | "Needs Work" | "Good" | "Excellent"
  improvement_potential?: ImprovementPotential;
  resume_sections: ResumeSection[];
  missing_sections: MissingSection[];
  
  // Comprehensive analysis fields (required with new prompt)
  good_stuff: GoodStuff[];
  needs_work: NeedsWork[];
  critical_issues: CriticalIssue[];
  shareable_roasts: ShareableRoast[];
  ats_issues: string[];
  formatting_issues: FormattingIssue[];
  keyword_analysis: KeywordAnalysis;
  quantification_issues: QuantificationIssues;
  action_plan: ActionPlan;
  recommendations: {
    priority: string;
    timeline: string;
    next_steps: string[];
  };
  
  // Backward compatibility - legacy format (optional)
  industry_specific_advice?: IndustryAdvice;
}
  
export interface AnalysisResponse {
  success: boolean;
  analysis: ResumeAnalysis;
  fileName: string;
  resumeId?: string;
  analysisId?: string;
  processingTimeMs?: number;
  timestamp?: string;
  cached?: boolean;
  fileData?: string; // For improvement functionality when resumeId not available
  message?: string;
  error?: string;
  details?: string;
}