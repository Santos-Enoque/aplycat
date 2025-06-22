/*
  Warnings:

  - The values [GENERATION_PURCHASE,GENERATION_USE] on the enum `CreditTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `detectedCountry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `generations` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `preferredCurrency` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalGenerationsUsed` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `trialUsed` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `generation_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paysuite_payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "CreditTransactionType_new" AS ENUM ('PURCHASE', 'SUBSCRIPTION_CREDIT', 'ANALYSIS_USE', 'IMPROVEMENT_USE', 'BONUS_CREDIT', 'REFUND');
ALTER TABLE "credit_transactions" ALTER COLUMN "type" TYPE "CreditTransactionType_new" USING ("type"::text::"CreditTransactionType_new");
ALTER TYPE "CreditTransactionType" RENAME TO "CreditTransactionType_old";
ALTER TYPE "CreditTransactionType_new" RENAME TO "CreditTransactionType";
DROP TYPE "CreditTransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "generation_transactions" DROP CONSTRAINT "generation_transactions_relatedAnalysisId_fkey";

-- DropForeignKey
ALTER TABLE "generation_transactions" DROP CONSTRAINT "generation_transactions_relatedImprovedResumeId_fkey";

-- DropForeignKey
ALTER TABLE "generation_transactions" DROP CONSTRAINT "generation_transactions_relatedImprovementId_fkey";

-- DropForeignKey
ALTER TABLE "generation_transactions" DROP CONSTRAINT "generation_transactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "paysuite_payments" DROP CONSTRAINT "paysuite_payments_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "detectedCountry",
DROP COLUMN "generations",
DROP COLUMN "preferredCurrency",
DROP COLUMN "totalGenerationsUsed",
DROP COLUMN "trialUsed",
ADD COLUMN     "phoneNumber" TEXT,
ALTER COLUMN "credits" SET DEFAULT 5;

-- DropTable
DROP TABLE "generation_transactions";

-- DropTable
DROP TABLE "paysuite_payments";

-- DropEnum
DROP TYPE "GenerationTransactionType";

-- CreateTable
CREATE TABLE "mpesa_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "customerMsisdn" TEXT NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "thirdPartyReference" TEXT NOT NULL,
    "mpesaConversationId" TEXT,
    "mpesaTransactionId" TEXT,
    "mpesaResponseCode" TEXT,
    "mpesaResponseDescription" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mpesa_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_payments_transactionReference_key" ON "mpesa_payments"("transactionReference");

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_payments_thirdPartyReference_key" ON "mpesa_payments"("thirdPartyReference");

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_payments_mpesaConversationId_key" ON "mpesa_payments"("mpesaConversationId");

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_payments_mpesaTransactionId_key" ON "mpesa_payments"("mpesaTransactionId");

-- CreateIndex
CREATE INDEX "mpesa_payments_userId_createdAt_idx" ON "mpesa_payments"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "mpesa_payments_status_idx" ON "mpesa_payments"("status");

-- AddForeignKey
ALTER TABLE "mpesa_payments" ADD CONSTRAINT "mpesa_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
