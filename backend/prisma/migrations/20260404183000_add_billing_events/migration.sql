-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "stripeEventId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeInvoiceId" TEXT,
    "eventType" TEXT NOT NULL,
    "status" "BillingEventStatus",
    "currency" TEXT,
    "amount" DOUBLE PRECISION,
    "amountSubtotal" DOUBLE PRECISION,
    "amountTax" DOUBLE PRECISION,
    "amountPaid" DOUBLE PRECISION,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_stripeEventId_key" ON "BillingEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_userId_occurredAt_idx" ON "BillingEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "BillingEvent_stripeCustomerId_occurredAt_idx" ON "BillingEvent"("stripeCustomerId", "occurredAt");

-- CreateIndex
CREATE INDEX "BillingEvent_stripeSubscriptionId_occurredAt_idx" ON "BillingEvent"("stripeSubscriptionId", "occurredAt");

-- CreateIndex
CREATE INDEX "BillingEvent_stripeInvoiceId_idx" ON "BillingEvent"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "BillingEvent_eventType_occurredAt_idx" ON "BillingEvent"("eventType", "occurredAt");

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
