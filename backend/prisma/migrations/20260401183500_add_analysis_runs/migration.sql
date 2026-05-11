-- CreateEnum
CREATE TYPE "AnalysisRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisSnapshotId" TEXT,
    "status" "AnalysisRunStatus" NOT NULL DEFAULT 'RUNNING',
    "mode" TEXT NOT NULL,
    "requestedTrades" INTEGER,
    "tradesAnalysed" INTEGER,
    "cost" DOUBLE PRECISION,
    "periodDescription" TEXT,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisRun_userId_createdAt_idx" ON "AnalysisRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_status_createdAt_idx" ON "AnalysisRun"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_analysisSnapshotId_fkey" FOREIGN KEY ("analysisSnapshotId") REFERENCES "AnalysisSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
