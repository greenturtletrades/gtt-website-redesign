ALTER TYPE "BrokerPlatform" ADD VALUE IF NOT EXISTS 'TRADING212';

ALTER TABLE "User"
ADD COLUMN "trading212ApiKeyEncrypted" TEXT,
ADD COLUMN "trading212ApiSecretEncrypted" TEXT,
ADD COLUMN "trading212Environment" TEXT;
