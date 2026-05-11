-- AlterTable
ALTER TABLE "User"
ADD COLUMN "platformComped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "platformCompedReason" TEXT;
