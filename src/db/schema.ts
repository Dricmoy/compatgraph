import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const contractFormat = pgEnum("contract_format", [
  "openapi-3.0",
  "openapi-3.1",
]);
export const releaseStatus = pgEnum("release_status", [
  "analyzing",
  "blocked",
  "ready",
  "released",
]);
export const changeSeverity = pgEnum("change_severity", [
  "breaking",
  "dangerous",
  "safe",
]);
export const consumerKind = pgEnum("consumer_kind", [
  "application",
  "worker",
  "sdk",
]);
export const actorKind = pgEnum("actor_kind", ["person", "system"]);

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const teams = pgTable(
  "teams",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("teams_org_slug_unique").on(table.organizationId, table.slug),
    index("teams_organization_idx").on(table.organizationId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    repositoryUrl: text("repository_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("projects_org_slug_unique").on(
      table.organizationId,
      table.slug,
    ),
    index("projects_organization_idx").on(table.organizationId),
  ],
);

export const apiContracts = pgTable(
  "api_contracts",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    format: contractFormat("format").notNull(),
    checksum: text("checksum").notNull(),
    document: jsonb("document").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("api_contracts_project_version_unique").on(
      table.projectId,
      table.version,
    ),
    uniqueIndex("api_contracts_checksum_unique").on(
      table.projectId,
      table.checksum,
    ),
  ],
);

export const releases = pgTable(
  "releases",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    baselineContractId: text("baseline_contract_id")
      .notNull()
      .references(() => apiContracts.id, { onDelete: "restrict" }),
    candidateContractId: text("candidate_contract_id")
      .notNull()
      .references(() => apiContracts.id, { onDelete: "restrict" }),
    status: releaseStatus("status").notNull(),
    riskScore: integer("risk_score").notNull(),
    analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "releases_risk_score_range",
      sql`${table.riskScore} between 0 and 100`,
    ),
    index("releases_project_created_idx").on(table.projectId, table.createdAt),
  ],
);

export const changes = pgTable(
  "changes",
  {
    id: text("id").primaryKey(),
    releaseId: text("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    severity: changeSeverity("severity").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    jsonPointer: text("json_pointer").notNull(),
    beforeSnapshot: jsonb("before_snapshot"),
    afterSnapshot: jsonb("after_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("changes_release_severity_idx").on(table.releaseId, table.severity),
  ],
);

export const consumers = pgTable(
  "consumers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    kind: consumerKind("kind").notNull(),
    repositoryUrl: text("repository_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("consumers_org_name_unique").on(
      table.organizationId,
      table.name,
    ),
    index("consumers_team_idx").on(table.teamId),
  ],
);

export const impactEdges = pgTable(
  "impact_edges",
  {
    changeId: text("change_id")
      .notNull()
      .references(() => changes.id, { onDelete: "cascade" }),
    consumerId: text("consumer_id")
      .notNull()
      .references(() => consumers.id, { onDelete: "cascade" }),
    evidenceSource: text("evidence_source").notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.changeId, table.consumerId] }),
    index("impact_edges_consumer_idx").on(table.consumerId),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    releaseId: text("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    actorKind: actorKind("actor_kind").notNull(),
    actorLabel: text("actor_label").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("activity_events_release_created_idx").on(
      table.releaseId,
      table.createdAt,
    ),
  ],
);
