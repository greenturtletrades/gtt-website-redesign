-- Website redesign: extended trader applications with file uploads, and investor enquiries.
-- Existing TraderApplication rows are kept; the legacy columns become optional.

-- AlterEnum
ALTER TYPE "BrokerPlatform" ADD VALUE 'OTHER';

-- CreateEnum
CREATE TYPE "TradingStyle" AS ENUM ('DISCRETIONARY', 'AUTOMATED', 'BOTH');

-- CreateEnum
CREATE TYPE "EquityRange" AS ENUM ('UNDER_5K', 'FROM_5K_TO_25K', 'FROM_25K_TO_100K', 'FROM_100K_TO_500K', 'OVER_500K');

-- CreateEnum
CREATE TYPE "HoldingPeriod" AS ENUM ('INTRADAY', 'DAYS', 'WEEKS', 'MONTHS');

-- CreateEnum
CREATE TYPE "TradingRecordType" AS ENUM ('LIVE', 'DEMO', 'COMPETITION');

-- CreateEnum
CREATE TYPE "TraderApplicationFileKind" AS ENUM ('CV', 'BROKER_STATEMENT', 'TRADE_HISTORY');

-- CreateEnum
CREATE TYPE "EnquiringAs" AS ENUM ('INDIVIDUAL', 'ORGANISATION');

-- CreateEnum
CREATE TYPE "ProfessionalStatusAnswer" AS ENUM ('YES', 'NO', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "AllocationRange" AS ENUM ('UNDER_50K', 'FROM_50K_TO_250K', 'FROM_250K_TO_1M', 'OVER_1M');

-- CreateEnum
CREATE TYPE "EnquiryTiming" AS ENUM ('WITHIN_3_MONTHS', 'FROM_3_TO_12_MONTHS', 'EXPLORING');

-- CreateEnum
CREATE TYPE "InvestorEnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- DropIndex: applicants may now reapply with the same email.
DROP INDEX "TraderApplication_email_key";

-- AlterTable
ALTER TABLE "TraderApplication"
ALTER COLUMN "accountNumber" DROP NOT NULL,
ALTER COLUMN "experienceLevel" DROP NOT NULL,
ADD COLUMN "phone" TEXT,
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "platformOther" TEXT,
ADD COLUMN "markets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "tradingStyle" "TradingStyle",
ADD COLUMN "historyStartDate" DATE,
ADD COLUMN "yearsExperience" DECIMAL(4,1),
ADD COLUMN "equityRange" "EquityRange",
ADD COLUMN "verifiedRecordUrl" TEXT,
ADD COLUMN "returnPct" DECIMAL(9,2),
ADD COLUMN "maxDrawdownPct" DECIMAL(5,2),
ADD COLUMN "calcMethod" TEXT,
ADD COLUMN "strategySummary" TEXT,
ADD COLUMN "holdingPeriod" "HoldingPeriod",
ADD COLUMN "sizingApproach" TEXT,
ADD COLUMN "recordType" "TradingRecordType",
ADD COLUMN "whyGtt" TEXT,
ADD COLUMN "suitability" TEXT,
ADD COLUMN "timeCommitment" TEXT,
ADD COLUMN "consentAccurateAt" TIMESTAMP(3),
ADD COLUMN "consentPrivacyAt" TIMESTAMP(3),
ADD COLUMN "submittedIp" TEXT;

-- CreateIndex
CREATE INDEX "TraderApplication_email_idx" ON "TraderApplication"("email");

-- CreateIndex
CREATE INDEX "TraderApplication_recordType_idx" ON "TraderApplication"("recordType");

-- CreateTable
CREATE TABLE "TraderApplicationFile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "TraderApplicationFileKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraderApplicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TraderApplicationFile_storageKey_key" ON "TraderApplicationFile"("storageKey");

-- CreateIndex
CREATE INDEX "TraderApplicationFile_applicationId_idx" ON "TraderApplicationFile"("applicationId");

-- AddForeignKey
ALTER TABLE "TraderApplicationFile" ADD CONSTRAINT "TraderApplicationFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TraderApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "InvestorEnquiry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "enquiringAs" "EnquiringAs" NOT NULL,
    "organisation" TEXT,
    "role" TEXT,
    "country" TEXT NOT NULL,
    "professionalStatus" "ProfessionalStatusAnswer" NOT NULL,
    "allocationRange" "AllocationRange" NOT NULL,
    "objectives" TEXT NOT NULL,
    "timing" "EnquiryTiming" NOT NULL,
    "message" TEXT,
    "consentPrivacyAt" TIMESTAMP(3) NOT NULL,
    "status" "InvestorEnquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNote" TEXT,
    "submittedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestorEnquiry_status_idx" ON "InvestorEnquiry"("status");

-- CreateIndex
CREATE INDEX "InvestorEnquiry_email_idx" ON "InvestorEnquiry"("email");
