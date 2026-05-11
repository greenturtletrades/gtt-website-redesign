-- Replace public email-based application lookup with an opaque token.
ALTER TABLE "TraderApplication"
ADD COLUMN "statusLookupToken" TEXT;

UPDATE "TraderApplication"
SET "statusLookupToken" = md5("id" || ':' || "email" || ':' || random()::text)
WHERE "statusLookupToken" IS NULL;

ALTER TABLE "TraderApplication"
ALTER COLUMN "statusLookupToken" SET NOT NULL;

CREATE UNIQUE INDEX "TraderApplication_statusLookupToken_key"
ON "TraderApplication"("statusLookupToken");
