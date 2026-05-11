-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "ChurnFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "feedback" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurnFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChurnFeedback_userId_idx" ON "ChurnFeedback"("userId");

-- CreateIndex
CREATE INDEX "ChurnFeedback_createdAt_idx" ON "ChurnFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "ChurnFeedback_reason_idx" ON "ChurnFeedback"("reason");

-- AddForeignKey
ALTER TABLE "ChurnFeedback" ADD CONSTRAINT "ChurnFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
