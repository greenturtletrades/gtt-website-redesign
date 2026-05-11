-- Preserve contact form subjects so stored messages match the public API contract.
ALTER TABLE "ContactMessage"
ADD COLUMN "subject" TEXT;
