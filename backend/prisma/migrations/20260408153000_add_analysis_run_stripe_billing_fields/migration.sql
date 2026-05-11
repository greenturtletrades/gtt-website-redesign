ALTER TABLE "AnalysisRun"
ADD COLUMN "stripeInvoiceId" TEXT,
ADD COLUMN "stripeBillingStatus" TEXT,
ADD COLUMN "stripeBilledAt" TIMESTAMP(3),
ADD COLUMN "stripeAmountPaid" DOUBLE PRECISION;

ALTER TABLE "BillingEvent"
ADD COLUMN "category" TEXT;
