CREATE TYPE "SignupReviewStatus" AS ENUM ('ACTIVE', 'SUSPECT', 'INVALID');

CREATE TABLE "SignupReview" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SignupReviewStatus" NOT NULL DEFAULT 'ACTIVE',
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignupReview_email_key" ON "SignupReview"("email");
CREATE INDEX "SignupReview_status_updatedAt_idx" ON "SignupReview"("status", "updatedAt");
CREATE INDEX "SignupReview_doNotContact_updatedAt_idx" ON "SignupReview"("doNotContact", "updatedAt");

ALTER TABLE "SignupReview"
ADD CONSTRAINT "SignupReview_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
