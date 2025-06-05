-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('SIGNUP_BONUS', 'PURCHASE', 'SUBSCRIPTION', 'ANALYSIS_USE', 'IMPROVEMENT_USE', 'ADMIN_ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "ComparisonType" AS ENUM ('VERSION_TO_VERSION', 'ORIGINAL_TO_IMPROVED', 'BULK_COMPARISON');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'TRIALING');

-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('SIGNUP', 'LOGIN', 'RESUME_UPLOAD', 'ANALYSIS_START', 'ANALYSIS_COMPLETE', 'IMPROVEMENT_START', 'IMPROVEMENT_COMPLETE', 'CREDIT_PURCHASE', 'SUBSCRIPTION_START', 'SUBSCRIPTION_CANCEL', 'FILE_DOWNLOAD');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK', 'SUPPORT_REQUEST');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('AUTH_ERROR', 'FILE_ERROR', 'OPENAI_ERROR', 'JSON_PARSE_ERROR', 'DATABASE_ERROR', 'NETWORK_ERROR', 'VALIDATION_ERROR', 'RATE_LIMIT_ERROR', 'UNKNOWN_ERROR');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('SYSTEM', 'USER', 'TEMPLATE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "credits" INTEGER NOT NULL DEFAULT 10,
    "totalCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "relatedAnalysisId" TEXT,
    "relatedImprovementId" TEXT,
    "relatedImprovedResumeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "title" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "processingTimeMs" INTEGER,
    "overallScore" INTEGER NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "scoreCategory" TEXT NOT NULL,
    "mainRoast" TEXT NOT NULL,
    "analysisData" JSONB NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improvements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "analysisId" TEXT,
    "targetRole" TEXT NOT NULL,
    "targetIndustry" TEXT NOT NULL,
    "improvedResumeData" JSONB NOT NULL,
    "improvementSummary" TEXT,
    "generatedFileUrl" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 2,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improved_resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "versionName" TEXT,
    "targetRole" TEXT NOT NULL,
    "targetIndustry" TEXT NOT NULL,
    "customPrompt" TEXT,
    "improvedResumeData" JSONB NOT NULL,
    "improvementSummary" TEXT,
    "keyChanges" JSONB,
    "originalScore" INTEGER,
    "improvedScore" INTEGER,
    "improvementPercentage" DOUBLE PRECISION,
    "generatedFileUrl" TEXT,
    "fileName" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 3,
    "processingTimeMs" INTEGER,
    "modelUsed" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improved_resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalResumeId" TEXT NOT NULL,
    "improvedResumeId" TEXT NOT NULL,
    "comparisonType" "ComparisonType" NOT NULL,
    "comparisonData" JSONB NOT NULL,
    "summary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "priceId" TEXT,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "monthlyCredits" INTEGER NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "UsageEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyCredits" INTEGER NOT NULL,
    "analysisCredits" INTEGER NOT NULL DEFAULT 1,
    "improvementCredits" INTEGER NOT NULL DEFAULT 2,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "FeedbackType" NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "rating" SMALLINT,
    "page" TEXT,
    "userAgent" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "role" TEXT,
    "source" TEXT,
    "referrer" TEXT,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "type" "ErrorType" NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "ErrorSeverity" NOT NULL,
    "requestId" TEXT,
    "fileName" TEXT,
    "endpoint" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "stackTrace" TEXT,
    "rawResponse" TEXT,
    "context" JSONB,
    "processingTime" INTEGER,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "parseStrategy" TEXT,
    "fileSize" INTEGER,
    "processingSteps" JSONB,
    "modelResponseTime" INTEGER,
    "parseTime" INTEGER,
    "dbOperationTime" INTEGER,
    "fileName" TEXT,
    "userId" TEXT,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "cacheStrategy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parse_success_logs" (
    "id" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "requestId" TEXT,
    "fileName" TEXT,
    "parseTime" INTEGER,
    "userId" TEXT,
    "responseLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parse_success_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER DEFAULT 4000,
    "topP" DOUBLE PRECISION DEFAULT 1.0,
    "frequencyPenalty" DOUBLE PRECISION DEFAULT 0.0,
    "presencePenalty" DOUBLE PRECISION DEFAULT 0.0,
    "additionalParams" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "model_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_prompts" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "promptType" "PromptType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT,
    "userPrompt" TEXT,
    "templateVariables" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "testGroup" TEXT,
    "successRate" DOUBLE PRECISION,
    "avgScore" DOUBLE PRECISION,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "model_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_usage" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "promptId" TEXT,
    "requestId" TEXT,
    "endpoint" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "responseTime" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "userSatisfaction" INTEGER,
    "parseSuccess" BOOLEAN,
    "parseStrategy" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "improved_resumes_resumeId_version_key" ON "improved_resumes"("resumeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_name_key" ON "pricing_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

-- CreateIndex
CREATE INDEX "error_logs_type_createdAt_idx" ON "error_logs"("type", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_severity_createdAt_idx" ON "error_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_requestId_idx" ON "error_logs"("requestId");

-- CreateIndex
CREATE INDEX "performance_logs_endpoint_createdAt_idx" ON "performance_logs"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "performance_logs_responseTime_idx" ON "performance_logs"("responseTime");

-- CreateIndex
CREATE INDEX "performance_logs_cacheHit_idx" ON "performance_logs"("cacheHit");

-- CreateIndex
CREATE INDEX "parse_success_logs_strategy_createdAt_idx" ON "parse_success_logs"("strategy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "model_configurations_name_key" ON "model_configurations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "model_prompts_configurationId_promptType_name_key" ON "model_prompts"("configurationId", "promptType", "name");

-- CreateIndex
CREATE INDEX "model_usage_configurationId_createdAt_idx" ON "model_usage"("configurationId", "createdAt");

-- CreateIndex
CREATE INDEX "model_usage_success_createdAt_idx" ON "model_usage"("success", "createdAt");

-- CreateIndex
CREATE INDEX "model_usage_responseTime_idx" ON "model_usage"("responseTime");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_relatedAnalysisId_fkey" FOREIGN KEY ("relatedAnalysisId") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_relatedImprovementId_fkey" FOREIGN KEY ("relatedImprovementId") REFERENCES "improvements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_relatedImprovedResumeId_fkey" FOREIGN KEY ("relatedImprovedResumeId") REFERENCES "improved_resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvements" ADD CONSTRAINT "improvements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvements" ADD CONSTRAINT "improvements_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvements" ADD CONSTRAINT "improvements_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improved_resumes" ADD CONSTRAINT "improved_resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improved_resumes" ADD CONSTRAINT "improved_resumes_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_comparisons" ADD CONSTRAINT "resume_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_comparisons" ADD CONSTRAINT "resume_comparisons_originalResumeId_fkey" FOREIGN KEY ("originalResumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_comparisons" ADD CONSTRAINT "resume_comparisons_improvedResumeId_fkey" FOREIGN KEY ("improvedResumeId") REFERENCES "improved_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_logs" ADD CONSTRAINT "performance_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parse_success_logs" ADD CONSTRAINT "parse_success_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_prompts" ADD CONSTRAINT "model_prompts_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "model_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
