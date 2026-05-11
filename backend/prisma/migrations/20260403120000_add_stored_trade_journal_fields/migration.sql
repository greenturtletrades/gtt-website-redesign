-- Add persisted journal note fields to stored trades so account trade notes
-- survive refresh, logout, and future analysis runs.
ALTER TABLE "StoredTrade"
ADD COLUMN "notes" TEXT,
ADD COLUMN "emotions" TEXT,
ADD COLUMN "lessonsLearned" TEXT;
