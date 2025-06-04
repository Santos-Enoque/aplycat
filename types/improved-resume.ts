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
  
  export interface Skills {
    technical: string[];
    certifications: string[];
    otherRelevantSkills: string[];
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
    education: Education[];
    skills: Skills;
    improvementsAnalysis: ImprovementsAnalysis;
  }
  
  export interface ImprovementResponse {
    success: boolean;
    improvedResume: ImprovedResume;
    targetRole: string;
    targetIndustry: string;
    fileName: string;
    error?: string;
    details?: string;
  }