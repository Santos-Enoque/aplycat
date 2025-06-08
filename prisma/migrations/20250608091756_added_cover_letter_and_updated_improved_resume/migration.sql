/*
  Warnings:

  - The values [SIGNUP_BONUS,SUBSCRIPTION,ADMIN_ADJUSTMENT] on the enum `CreditTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customPrompt` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `generatedFileUrl` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `improvedScore` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `improvementPercentage` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `keyChanges` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `modelUsed` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `originalScore` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `additionalParams` on the `model_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `modelVersion` on the `model_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `avgScore` on the `model_prompts` table. All the data in the column will be lost.
  - You are about to drop the column `successRate` on the `model_prompts` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `model_prompts` table. All the data in the column will be lost.
  - You are about to drop the column `comparisonType` on the `resume_comparisons` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `resume_comparisons` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `resume_comparisons` table. All the data in the column will be lost.
  - You are about to drop the `error_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `model_usage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parse_success_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `performance_logs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `resume_comparisons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CreditTransactionType_new" AS ENUM ('PURCHASE', 'SUBSCRIPTION_CREDIT', 'ANALYSIS_USE', 'IMPROVEMENT_USE', 'BONUS_CREDIT', 'REFUND');
ALTER TABLE "credit_transactions" ALTER COLUMN "type" TYPE "CreditTransactionType_new" USING ("type"::text::"CreditTransactionType_new");
ALTER TYPE "CreditTransactionType" RENAME TO "CreditTransactionType_old";
ALTER TYPE "CreditTransactionType_new" RENAME TO "CreditTransactionType";
DROP TYPE "CreditTransactionType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE_EXPIRED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'UNPAID';

-- DropForeignKey
ALTER TABLE "error_logs" DROP CONSTRAINT "error_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "model_usage" DROP CONSTRAINT "model_usage_userId_fkey";

-- DropForeignKey
ALTER TABLE "parse_success_logs" DROP CONSTRAINT "parse_success_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "performance_logs" DROP CONSTRAINT "performance_logs_userId_fkey";

-- DropIndex
DROP INDEX "improved_resumes_resumeId_version_key";

-- AlterTable
ALTER TABLE "analyses" ALTER COLUMN "creditsUsed" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "improved_resumes" DROP COLUMN "customPrompt",
DROP COLUMN "fileName",
DROP COLUMN "generatedFileUrl",
DROP COLUMN "improvedScore",
DROP COLUMN "improvementPercentage",
DROP COLUMN "isActive",
DROP COLUMN "keyChanges",
DROP COLUMN "modelUsed",
DROP COLUMN "originalScore",
ADD COLUMN     "analysisId" TEXT,
ADD COLUMN     "generatedDocxUrl" TEXT,
ADD COLUMN     "generatedPdfUrl" TEXT,
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "tailoringAnalysis" JSONB,
ALTER COLUMN "version" SET DEFAULT 1,
ALTER COLUMN "creditsUsed" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "improvements" ALTER COLUMN "creditsUsed" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "model_configurations" DROP COLUMN "additionalParams",
DROP COLUMN "modelVersion",
ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "baseUrl" TEXT;

-- AlterTable
ALTER TABLE "model_prompts" DROP COLUMN "avgScore",
DROP COLUMN "successRate",
DROP COLUMN "usageCount";

-- AlterTable
ALTER TABLE "resume_comparisons" DROP COLUMN "comparisonType",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "type" "ComparisonType" NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 5;

-- DropTable
DROP TABLE "error_logs";

-- DropTable
DROP TABLE "model_usage";

-- DropTable
DROP TABLE "parse_success_logs";

-- DropTable
DROP TABLE "performance_logs";

-- DropEnum
DROP TYPE "ErrorSeverity";

-- DropEnum
DROP TYPE "ErrorType";

-- CreateTable
CREATE TABLE "cover_letters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "improvedResumeId" TEXT,
    "generatedContent" TEXT NOT NULL,
    "tailoringAnalysis" JSONB,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cover_letters_userId_createdAt_idx" ON "cover_letters"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "cover_letters_improvedResumeId_idx" ON "cover_letters"("improvedResumeId");

-- CreateIndex
CREATE INDEX "analyses_userId_isCompleted_createdAt_idx" ON "analyses"("userId", "isCompleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analyses_resumeId_isCompleted_createdAt_idx" ON "analyses"("resumeId", "isCompleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analyses_userId_resumeId_isCompleted_idx" ON "analyses"("userId", "resumeId", "isCompleted");

-- CreateIndex
CREATE INDEX "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "credit_transactions_type_createdAt_idx" ON "credit_transactions"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improved_resumes_userId_isFavorite_createdAt_idx" ON "improved_resumes"("userId", "isFavorite", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improved_resumes_resumeId_createdAt_idx" ON "improved_resumes"("resumeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improvements_userId_createdAt_idx" ON "improvements"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improvements_resumeId_createdAt_idx" ON "improvements"("resumeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improvements_analysisId_idx" ON "improvements"("analysisId");

-- CreateIndex
CREATE INDEX "resume_comparisons_userId_createdAt_idx" ON "resume_comparisons"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "resumes_userId_isActive_createdAt_idx" ON "resumes"("userId", "isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "resumes_userId_createdAt_idx" ON "resumes"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_createdAt_idx" ON "subscriptions"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "subscriptions_status_currentPeriodEnd_idx" ON "subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "users_clerkId_idx" ON "users"("clerkId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastActiveAt_idx" ON "users"("lastActiveAt");

-- AddForeignKey
ALTER TABLE "improved_resumes" ADD CONSTRAINT "improved_resumes_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_improvedResumeId_fkey" FOREIGN KEY ("improvedResumeId") REFERENCES "improved_resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
