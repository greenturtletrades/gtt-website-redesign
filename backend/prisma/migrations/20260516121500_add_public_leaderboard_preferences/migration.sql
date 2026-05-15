ALTER TABLE "User"
ADD COLUMN "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "leaderboardDisplayName" TEXT,
ADD COLUMN "leaderboardPublishedAt" TIMESTAMP(3);

CREATE INDEX "User_leaderboardOptIn_status_idx" ON "User"("leaderboardOptIn", "status");
