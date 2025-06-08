/*
  Warnings:

  - You are about to drop the column `analysisId` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `generatedDocxUrl` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `generatedPdfUrl` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `jobDescription` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `tailoringAnalysis` on the `improved_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `resume_comparisons` table. All the data in the column will be lost.
  - You are about to drop the `cover_letters` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[resumeId,version]` on the table `improved_resumes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `comparisonType` to the `resume_comparisons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `resume_comparisons` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cover_letters" DROP CONSTRAINT "cover_letters_improvedResumeId_fkey";

-- DropForeignKey
ALTER TABLE "cover_letters" DROP CONSTRAINT "cover_letters_userId_fkey";

-- DropForeignKey
ALTER TABLE "improved_resumes" DROP CONSTRAINT "improved_resumes_analysisId_fkey";

-- DropIndex
DROP INDEX "improved_resumes_resumeId_createdAt_idx";

-- DropIndex
DROP INDEX "improved_resumes_userId_isFavorite_createdAt_idx";

-- DropIndex
DROP INDEX "resume_comparisons_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "improved_resumes" DROP COLUMN "analysisId",
DROP COLUMN "generatedDocxUrl",
DROP COLUMN "generatedPdfUrl",
DROP COLUMN "jobDescription",
DROP COLUMN "tailoringAnalysis",
ADD COLUMN     "customPrompt" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "generatedFileUrl" TEXT,
ADD COLUMN     "improvedScore" INTEGER,
ADD COLUMN     "improvementPercentage" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "keyChanges" JSONB,
ADD COLUMN     "modelUsed" TEXT,
ADD COLUMN     "originalScore" INTEGER,
ALTER COLUMN "version" DROP DEFAULT;

-- AlterTable
ALTER TABLE "resume_comparisons" DROP COLUMN "type",
ADD COLUMN     "comparisonType" "ComparisonType" NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 7;

-- DropTable
DROP TABLE "cover_letters";

-- CreateIndex
CREATE INDEX "improved_resumes_userId_isCompleted_createdAt_idx" ON "improved_resumes"("userId", "isCompleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improved_resumes_resumeId_isCompleted_createdAt_idx" ON "improved_resumes"("resumeId", "isCompleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "improved_resumes_userId_isActive_isFavorite_idx" ON "improved_resumes"("userId", "isActive", "isFavorite");

-- CreateIndex
CREATE UNIQUE INDEX "improved_resumes_resumeId_version_key" ON "improved_resumes"("resumeId", "version");
