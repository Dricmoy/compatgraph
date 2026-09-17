CREATE TABLE "consumer_operations" (
	"consumer_id" text NOT NULL,
	"project_id" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"evidence_source" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consumer_operations_consumer_id_project_id_method_path_pk" PRIMARY KEY("consumer_id","project_id","method","path")
);
--> statement-breakpoint
DROP INDEX "api_contracts_project_version_unique";--> statement-breakpoint
ALTER TABLE "changes" ADD COLUMN "rule_id" text DEFAULT 'legacy-evidence' NOT NULL;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "analysis_key" text;--> statement-breakpoint
ALTER TABLE "consumer_operations" ADD CONSTRAINT "consumer_operations_consumer_id_consumers_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."consumers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_operations" ADD CONSTRAINT "consumer_operations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consumer_operations_lookup_idx" ON "consumer_operations" USING btree ("project_id","method","path");--> statement-breakpoint
CREATE INDEX "api_contracts_project_version_idx" ON "api_contracts" USING btree ("project_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "releases_analysis_key_unique" ON "releases" USING btree ("analysis_key");