/*
  Warnings:

  - Added the required column `credits` to the `mpesa_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageType` to the `mpesa_payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mpesa_payments" ADD COLUMN     "credits" INTEGER NOT NULL,
ADD COLUMN     "packageType" TEXT NOT NULL;
