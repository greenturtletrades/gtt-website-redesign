-- AlterTable
ALTER TABLE "StoredTrade"
ADD COLUMN "lastAnalysedAt" TIMESTAMP(3),
ADD COLUMN "analysisCount" INTEGER NOT NULL DEFAULT 0;
