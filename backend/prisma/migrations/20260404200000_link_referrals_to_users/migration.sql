-- AlterTable
ALTER TABLE "User"
ADD COLUMN "appliedReferralCodeId" TEXT,
ADD COLUMN "accountDiscountPercent" DOUBLE PRECISION,
ADD COLUMN "mlRunDiscountPercent" DOUBLE PRECISION,
ADD COLUMN "referralDiscountExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_appliedReferralCodeId_idx" ON "User"("appliedReferralCodeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_appliedReferralCodeId_fkey" FOREIGN KEY ("appliedReferralCodeId") REFERENCES "ReferralCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
