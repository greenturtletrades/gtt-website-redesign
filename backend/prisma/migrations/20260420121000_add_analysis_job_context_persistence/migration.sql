ALTER TABLE "AnalysisRun"
ADD COLUMN "pythonJobId" TEXT,
ADD COLUMN "jobContext" JSONB;

CREATE UNIQUE INDEX "AnalysisRun_pythonJobId_key" ON "AnalysisRun"("pythonJobId");
