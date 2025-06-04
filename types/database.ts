import { 
  User, 
  Resume, 
  Analysis, 
  Improvement, 
  CreditTransaction, 
  Subscription, 
  UsageEvent, 
  PricingPlan, 
  Feedback, 
  SystemConfig, 
  WaitlistEntry,
  CreditTransactionType,
  SubscriptionStatus,
  UsageEventType,
  FeedbackType,
  FeedbackStatus
} from '@prisma/client'

// ===== BASIC TYPES =====
export type {
  User,
  Resume,
  Analysis,
  Improvement,
  CreditTransaction,
  Subscription,
  UsageEvent,
  PricingPlan,
  Feedback,
  SystemConfig,
  WaitlistEntry,
  CreditTransactionType,
  SubscriptionStatus,
  UsageEventType,
  FeedbackType,
  FeedbackStatus
}

// ===== EXTENDED TYPES WITH RELATIONS =====

export type UserWithRelations = User & {
  resumes: (Resume & {
    analyses: Analysis[]
    improvements: Improvement[]
  })[]
  creditTransactions: CreditTransaction[]
  subscriptions: Subscription[]
  usageEvents: UsageEvent[]
  feedback: Feedback[]
}

export type ResumeWithRelations = Resume & {
  user: User
  analyses: Analysis[]
  improvements: Improvement[]
}

export type AnalysisWithRelations = Analysis & {
  user: User
  resume: Resume
  creditTransactions: CreditTransaction[]
  improvements: Improvement[]
}

export type ImprovementWithRelations = Improvement & {
  user: User
  resume: Resume
  analysis?: Analysis
  creditTransactions: CreditTransaction[]
}

export type SubscriptionWithUser = Subscription & {
  user: User
}

// ===== UTILITY TYPES =====

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'>

export type CreateResumeData = Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>

export type CreateAnalysisData = Omit<Analysis, 'id' | 'createdAt' | 'updatedAt'>

export type CreateImprovementData = Omit<Improvement, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateUserData = Partial<Omit<User, 'id' | 'clerkId' | 'createdAt' | 'updatedAt'>>

// ===== CREDIT SYSTEM TYPES =====

export interface CreditOperation {
  userId: string
  amount: number
  type: CreditTransactionType
  description: string
  relatedId?: string
}

export interface CreditBalance {
  current: number
  used: number
  available: number
  lastTransaction?: CreditTransaction
}

export interface CreditSummary {
  balance: CreditBalance
  recentTransactions: CreditTransaction[]
  monthlyUsage: {
    analyses: number
    improvements: number
    totalCredits: number
  }
}

// ===== ANALYSIS TYPES =====

export interface AnalysisResult {
  overallScore: number
  atsScore: number
  scoreCategory: string
  mainRoast: string
  analysisData: Record<string, any> // JSON data
}

export interface CreateAnalysisRequest {
  resumeId: string
  fileName: string
  fileData: string
}

export interface AnalysisResponse {
  success: boolean
  analysis?: Analysis
  error?: string
  creditsRemaining?: number
}

// ===== IMPROVEMENT TYPES =====

export interface ImprovementRequest {
  resumeId: string
  analysisId?: string
  targetRole: string
  targetIndustry: string
}

export interface ImprovementResult {
  improvedResumeData: Record<string, any>
  improvementSummary?: string
  generatedFileUrl?: string
}

export interface ImprovementResponse {
  success: boolean
  improvement?: Improvement
  error?: string
  creditsRemaining?: number
}

// ===== SUBSCRIPTION TYPES =====

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  monthlyCredits: number
  price: number
  features: string[]
  isPopular: boolean
}

export interface SubscriptionData {
  planId: string
  planName: string
  status: SubscriptionStatus
  priceId?: string
  customerId?: string
  subscriptionId?: string
  monthlyCredits: number
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
}

// ===== ANALYTICS TYPES =====

export interface UserAnalytics {
  events: UsageEvent[]
  totalAnalyses: number
  totalImprovements: number
  period: number
}

export interface SystemAnalytics {
  totalUsers: number
  totalResumes: number
  totalAnalyses: number
  totalImprovements: number
  activeSubscriptions: number
  revenue: number
  period: {
    start: Date
    end: Date
  }
}

export interface TrackEventData {
  eventType: UsageEventType
  userId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// ===== SYSTEM CONFIG TYPES =====

export interface SystemConfigUpdate {
  key: string
  value: string
  description?: string
  category?: string
}

export interface ConfigCategory {
  category: string
  configs: SystemConfig[]
}

// ===== WAITLIST TYPES =====

export interface WaitlistData {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  role?: string
  source?: string
  referrer?: string
}

// ===== FILE UPLOAD TYPES =====

export interface FileUploadData {
  fileName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
}

export interface UploadResponse {
  success: boolean
  fileUrl?: string
  error?: string
}

// ===== BILLING TYPES =====

export interface BillingInfo {
  customerId?: string
  subscriptionId?: string
  currentPlan?: PricingPlan
  billingHistory: CreditTransaction[]
  nextBilling?: Date
  cancelAtPeriodEnd?: boolean
}

export interface PaymentIntent {
  clientSecret: string
  amount: number
  currency: string
}

// ===== DASHBOARD TYPES =====

export interface DashboardData {
  user: UserWithRelations
  creditSummary: CreditSummary
  recentAnalyses: Analysis[]
  recentImprovements: Improvement[]
  analytics: UserAnalytics
  subscription?: SubscriptionWithUser
}

export interface AdminDashboardData {
  systemAnalytics: SystemAnalytics
  recentUsers: User[]
  recentFeedback: Feedback[]
  systemHealth: {
    databaseStatus: 'healthy' | 'degraded' | 'down'
    apiStatus: 'healthy' | 'degraded' | 'down'
    storageStatus: 'healthy' | 'degraded' | 'down'
  }
} 