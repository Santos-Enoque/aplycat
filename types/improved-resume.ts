// types/improved-resume.ts

export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  }
  
  export interface Experience {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }
  
  export interface Education {
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }

  export interface Project {
    name: string;
    description?: string;
    technologies?: string;
    achievements?: string[];
  }
  
  export interface Skills {
    technical: string[];
    certifications: string[];
    otherRelevantSkills?: string[]; // Made optional for backward compatibility
    languages?: string[]; // New: For language skills
    methodologies?: string[]; // New: For methodologies like Agile, Scrum
  }
  
  export interface ImprovementsAnalysis {
    originalResumeEffectivenessEstimateForTarget: string;
    targetOptimizedResumeScore: string;
    analysisHeadline: string;
    keyRevisionsImplemented: string[];
    recommendationsForUser: string[];
  }
  
  export interface ImprovedResume {
    personalInfo: PersonalInfo;
    professionalSummary: string;
    experience: Experience[];
    projects?: Project[]; // New: Optional projects section
    education: Education[];
    skills: Skills;
    improvementsAnalysis: ImprovementsAnalysis;
  }

  // Database-stored improved resume with versioning
  export interface ImprovedResumeVersion {
    id: string;
    resumeId: string;
    version: number;
    versionName?: string;
    targetRole: string;
    targetIndustry: string;
    customPrompt?: string;
    improvedResumeData: ImprovedResume;
    improvementSummary?: string;
    keyChanges?: { changes: string[] };
    originalScore?: number;
    improvedScore?: number;
    improvementPercentage?: number;
    fileName?: string;
    generatedFileUrl?: string;
    creditsUsed: number;
    processingTimeMs?: number;
    modelUsed?: string;
    isFavorite: boolean;
    isCompleted: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    resume?: {
      id: string;
      fileName: string;
      title?: string;
      fileUrl?: string;
    };
  }

  // Grouped versions by resume
  export interface ResumeVersionGroup {
    resumeId: string;
    resume: {
      id: string;
      fileName: string;
      title?: string;
      fileUrl?: string;
    };
    versions: ImprovedResumeVersion[];
    totalVersions: number;
    latestVersion: ImprovedResumeVersion | null;
  }
  
  export interface ImprovementResponse {
    success: boolean;
    improvedResume: ImprovedResume;
    targetRole: string;
    targetIndustry: string;
    fileName: string;
    resumeId?: string;
    improvedResumeId?: string; // New: ID of the saved improved resume
    version?: number; // New: Version number
    versionName?: string; // New: Version name
    processingTimeMs?: number;
    timestamp?: string;
    cached?: boolean;
    error?: string;
    details?: string;
  }

  // Request interface for creating improvements
  export interface ImprovementRequest {
    resumeId?: string; // New approach
    fileData?: string; // Legacy approach
    fileName: string;
    targetRole: string;
    targetIndustry: string;
    customPrompt?: string; // New: Custom instructions
    versionName?: string; // New: Version name
  }

  // Improved resumes list response
  export interface ImprovedResumesResponse {
    success: boolean;
    improvedResumes: ImprovedResumeVersion[];
    groupedByResume?: ResumeVersionGroup[] | null;
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    timestamp: string;
  }

  // Single improved resume response
  export interface ImprovedResumeResponse {
    success: boolean;
    improvedResume: ImprovedResumeVersion;
    timestamp: string;
  }