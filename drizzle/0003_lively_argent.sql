CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_request_count_positive" CHECK ("rate_limit_buckets"."request_count" > 0)
);
--> statement-breakpoint
CREATE INDEX "rate_limit_updated_idx" ON "rate_limit_buckets" USING btree ("updated_at");