CREATE TYPE "public"."actor_kind" AS ENUM('person', 'system');--> statement-breakpoint
CREATE TYPE "public"."change_severity" AS ENUM('breaking', 'dangerous', 'safe');--> statement-breakpoint
CREATE TYPE "public"."consumer_kind" AS ENUM('application', 'worker', 'sdk');--> statement-breakpoint
CREATE TYPE "public"."contract_format" AS ENUM('openapi-3.0', 'openapi-3.1');--> statement-breakpoint
CREATE TYPE "public"."release_status" AS ENUM('analyzing', 'blocked', 'ready', 'released');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" text PRIMARY KEY NOT NULL,
	"release_id" text NOT NULL,
	"actor_kind" "actor_kind" NOT NULL,
	"actor_label" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"version" text NOT NULL,
	"format" "contract_format" NOT NULL,
	"checksum" text NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changes" (
	"id" text PRIMARY KEY NOT NULL,
	"release_id" text NOT NULL,
	"severity" "change_severity" NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"json_pointer" text NOT NULL,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "consumer_kind" NOT NULL,
	"repository_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_edges" (
	"change_id" text NOT NULL,
	"consumer_id" text NOT NULL,
	"evidence_source" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "impact_edges_change_id_consumer_id_pk" PRIMARY KEY("change_id","consumer_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"repository_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"baseline_contract_id" text NOT NULL,
	"candidate_contract_id" text NOT NULL,
	"status" "release_status" NOT NULL,
	"risk_score" integer NOT NULL,
	"analyzed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "releases_risk_score_range" CHECK ("releases"."risk_score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_contracts" ADD CONSTRAINT "api_contracts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_edges" ADD CONSTRAINT "impact_edges_change_id_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."changes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_edges" ADD CONSTRAINT "impact_edges_consumer_id_consumers_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."consumers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_baseline_contract_id_api_contracts_id_fk" FOREIGN KEY ("baseline_contract_id") REFERENCES "public"."api_contracts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_candidate_contract_id_api_contracts_id_fk" FOREIGN KEY ("candidate_contract_id") REFERENCES "public"."api_contracts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_release_created_idx" ON "activity_events" USING btree ("release_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_contracts_project_version_unique" ON "api_contracts" USING btree ("project_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "api_contracts_checksum_unique" ON "api_contracts" USING btree ("project_id","checksum");--> statement-breakpoint
CREATE INDEX "changes_release_severity_idx" ON "changes" USING btree ("release_id","severity");--> statement-breakpoint
CREATE UNIQUE INDEX "consumers_org_name_unique" ON "consumers" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "consumers_team_idx" ON "consumers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "impact_edges_consumer_idx" ON "impact_edges" USING btree ("consumer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_org_slug_unique" ON "projects" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "projects_organization_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "releases_project_created_idx" ON "releases" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_org_slug_unique" ON "teams" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "teams_organization_idx" ON "teams" USING btree ("organization_id");