-- CreateTable
CREATE TABLE "AnalysisSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "tradesAnalysed" INTEGER,
    "avgRMultiple" DOUBLE PRECISION,
    "winRate" DOUBLE PRECISION,
    "sharpeRatio" DOUBLE PRECISION,
    "maxDrawdownR" DOUBLE PRECISION,
    "totalR" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisSnapshot_userId_updatedAt_idx" ON "AnalysisSnapshot"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "AnalysisSnapshot" ADD CONSTRAINT "AnalysisSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
