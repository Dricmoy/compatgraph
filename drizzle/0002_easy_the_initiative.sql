UPDATE "releases"
SET "analysis_key" = 'legacy:' || "id"
WHERE "analysis_key" IS NULL;--> statement-breakpoint
ALTER TABLE "releases" ALTER COLUMN "analysis_key" SET NOT NULL;
