-- CreateEnum
CREATE TYPE "GenerationTransactionType" AS ENUM ('PURCHASE', 'USE_IMPROVEMENT', 'USE_TAILORING', 'USE_COVER_LETTER', 'USE_COMBO', 'USE_CUSTOM', 'REFUND');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CreditTransactionType" ADD VALUE 'GENERATION_PURCHASE';
ALTER TYPE "CreditTransactionType" ADD VALUE 'GENERATION_USE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "detectedCountry" TEXT,
ADD COLUMN     "generations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredCurrency" TEXT,
ADD COLUMN     "totalGenerationsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trialUsed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "credits" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "paysuite_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MZN',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "paysuite_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GenerationTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "relatedAnalysisId" TEXT,
    "relatedImprovementId" TEXT,
    "relatedImprovedResumeId" TEXT,
    "packageType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- CreateIndex
CREATE INDEX "generation_transactions_userId_createdAt_idx" ON "generation_transactions"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "generation_transactions_type_createdAt_idx" ON "generation_transactions"("type", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "paysuite_payments" ADD CONSTRAINT "paysuite_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_transactions" ADD CONSTRAINT "generation_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_transactions" ADD CONSTRAINT "generation_transactions_relatedAnalysisId_fkey" FOREIGN KEY ("relatedAnalysisId") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_transactions" ADD CONSTRAINT "generation_transactions_relatedImprovementId_fkey" FOREIGN KEY ("relatedImprovementId") REFERENCES "improvements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_transactions" ADD CONSTRAINT "generation_transactions_relatedImprovedResumeId_fkey" FOREIGN KEY ("relatedImprovedResumeId") REFERENCES "improved_resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
