-- CreateTable
CREATE TABLE "AccountDeletionAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousEmail" TEXT NOT NULL,
    "deletedEmail" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "hadBillingHistory" BOOLEAN NOT NULL DEFAULT false,
    "hadBrokerAccounts" BOOLEAN NOT NULL DEFAULT false,
    "hadApiKeys" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "AccountDeletionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletionAudit_userId_deletedAt_idx" ON "AccountDeletionAudit"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "AccountDeletionAudit" ADD CONSTRAINT "AccountDeletionAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
