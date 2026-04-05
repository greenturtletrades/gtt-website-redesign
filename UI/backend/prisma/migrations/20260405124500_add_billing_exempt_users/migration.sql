-- AlterTable
ALTER TABLE "User"
ADD COLUMN "billingExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "billingExemptReason" TEXT;
