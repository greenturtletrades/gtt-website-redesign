CREATE UNIQUE INDEX "User_leaderboard_public_display_name_unique_idx"
ON "User" (LOWER(REGEXP_REPLACE(BTRIM("leaderboardDisplayName"), '\s+', ' ', 'g')))
WHERE "leaderboardOptIn" = true
  AND "leaderboardDisplayName" IS NOT NULL
  AND BTRIM("leaderboardDisplayName") <> '';
