import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  activityEvents,
  apiContracts,
  changes,
  consumerOperations,
  consumers,
  impactEdges,
  organizations,
  projects,
  releases,
  teams,
} from "../src/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const client = postgres(databaseUrl, { max: 1, prepare: false });
const db = drizzle(client);

const baselineDocument = {
  openapi: "3.1.0",
  info: { title: "Payments API", version: "2.8.0" },
  paths: {
    "/v1/payment_intents": {
      post: {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: { type: "integer" },
                  currency: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
};

const candidateDocument = {
  ...baselineDocument,
  info: { title: "Payments API", version: "3.0.0" },
  paths: {
    ...baselineDocument.paths,
    "/v1/payment_intents": {
      post: {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "currency"],
                properties: {
                  amount: { type: "integer" },
                  currency: { type: "string", enum: ["USD", "CAD"] },
                },
              },
            },
          },
        },
      },
    },
  },
};

const seededTeams = [
  { id: "team_checkout", slug: "checkout", name: "Checkout" },
  { id: "team_revenue", slug: "revenue", name: "Revenue" },
  { id: "team_ecosystem", slug: "ecosystem", name: "Ecosystem" },
  { id: "team_experience", slug: "experience", name: "Experience" },
  { id: "team_finance", slug: "finance", name: "Finance" },
];

const seededConsumers = [
  {
    id: "con_checkout_web",
    teamId: "team_checkout",
    name: "checkout-web",
    kind: "application" as const,
  },
  {
    id: "con_billing_worker",
    teamId: "team_revenue",
    name: "billing-worker",
    kind: "worker" as const,
  },
  {
    id: "con_partner_sdk",
    teamId: "team_ecosystem",
    name: "partner-sdk",
    kind: "sdk" as const,
  },
  {
    id: "con_customer_portal",
    teamId: "team_experience",
    name: "customer-portal",
    kind: "application" as const,
  },
  {
    id: "con_support_console",
    teamId: "team_experience",
    name: "support-console",
    kind: "application" as const,
  },
  {
    id: "con_refund_orchestrator",
    teamId: "team_revenue",
    name: "refund-orchestrator",
    kind: "worker" as const,
  },
  {
    id: "con_ledger_sync",
    teamId: "team_finance",
    name: "ledger-sync",
    kind: "worker" as const,
  },
  {
    id: "con_mobile_sdk",
    teamId: "team_ecosystem",
    name: "mobile-sdk",
    kind: "sdk" as const,
  },
];

const seededChanges = [
  {
    id: "chg_1042",
    ruleId: "request-property-became-required",
    severity: "breaking" as const,
    method: "POST",
    path: "/v1/payment_intents",
    title: "currency is now required",
    detail: "Request body changed from optional to required at #/currency.",
    jsonPointer:
      "/paths/~1v1~1payment_intents/post/requestBody/content/application~1json/schema/required",
    beforeSnapshot: ["amount"],
    afterSnapshot: ["amount", "currency"],
  },
  {
    id: "chg_1045",
    ruleId: "schema-property-removed",
    severity: "breaking" as const,
    method: "GET",
    path: "/v1/customers/{id}",
    title: "legacy_status was removed",
    detail: "Response consumers still read this field in two active releases.",
    jsonPointer:
      "/paths/~1v1~1customers~1{id}/get/responses/200/content/application~1json/schema/properties/legacy_status",
    beforeSnapshot: { type: "string" },
    afterSnapshot: null,
  },
  {
    id: "chg_1051",
    ruleId: "enum-values-removed",
    severity: "dangerous" as const,
    method: "POST",
    path: "/v1/refunds",
    title: "reason enum narrowed",
    detail: "Two previously accepted enum values are no longer valid.",
    jsonPointer:
      "/paths/~1v1~1refunds/post/requestBody/content/application~1json/schema/properties/reason/enum",
    beforeSnapshot: ["duplicate", "fraudulent", "requested", "other"],
    afterSnapshot: ["duplicate", "fraudulent"],
  },
  {
    id: "chg_1055",
    ruleId: "parameter-maximum-reduced",
    severity: "dangerous" as const,
    method: "GET",
    path: "/v1/invoices",
    title: "maximum page size reduced",
    detail: "The maximum page size changed from 500 to 100.",
    jsonPointer: "/paths/~1v1~1invoices/get/parameters/limit/schema/maximum",
    beforeSnapshot: 500,
    afterSnapshot: 100,
  },
  {
    id: "chg_1058",
    ruleId: "operation-removed",
    severity: "breaking" as const,
    method: "DELETE",
    path: "/v1/sources/{id}",
    title: "payment source deletion removed",
    detail: "An operation used by the mobile SDK is no longer available.",
    jsonPointer: "/paths/~1v1~1sources~1{id}/delete",
    beforeSnapshot: { responses: { 204: { description: "Deleted" } } },
    afterSnapshot: null,
  },
  ...Array.from({ length: 7 }, (_, index) => ({
    id: `chg_${1060 + index}`,
    ruleId: "operation-added",
    severity: "safe" as const,
    method: index % 2 === 0 ? "GET" : "POST",
    path: `/v1/additive-resource-${index + 1}`,
    title: `additive capability ${index + 1}`,
    detail: "A backwards-compatible operation or optional field was added.",
    jsonPointer: `/paths/~1v1~1additive-resource-${index + 1}`,
    beforeSnapshot: null,
    afterSnapshot: { added: true },
  })),
];

const analyzedAt = new Date("2026-09-16T23:00:00.000Z");

const seededConsumerOperations = [
  ["con_checkout_web", "POST", "/v1/payment_intents"],
  ["con_billing_worker", "POST", "/v1/payment_intents"],
  ["con_partner_sdk", "POST", "/v1/payment_intents"],
  ["con_customer_portal", "GET", "/v1/customers/{id}"],
  ["con_support_console", "GET", "/v1/customers/{id}"],
  ["con_refund_orchestrator", "POST", "/v1/refunds"],
  ["con_ledger_sync", "GET", "/v1/invoices"],
  ["con_mobile_sdk", "DELETE", "/v1/sources/{id}"],
  ["con_checkout_web", "POST", "/payments"],
  ["con_billing_worker", "POST", "/payments"],
  ["con_partner_sdk", "POST", "/payments"],
  ["con_customer_portal", "GET", "/payments/{id}"],
  ["con_support_console", "GET", "/payments/{id}"],
  ["con_refund_orchestrator", "POST", "/refunds"],
] as const;

try {
  await db.transaction(async (tx) => {
    await tx
      .insert(organizations)
      .values({ id: "org_acme", slug: "acme-platform", name: "Acme Platform" })
      .onConflictDoUpdate({
        target: organizations.id,
        set: { name: "Acme Platform" },
      });

    for (const team of seededTeams) {
      await tx
        .insert(teams)
        .values({ ...team, organizationId: "org_acme" })
        .onConflictDoUpdate({
          target: teams.id,
          set: { name: team.name, slug: team.slug },
        });
    }

    await tx
      .insert(projects)
      .values({
        id: "project_payments",
        organizationId: "org_acme",
        slug: "payments-api",
        name: "Payments API",
        description: "Public payment orchestration and customer billing API.",
        repositoryUrl: "https://github.com/acme/payments-api",
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: "Payments API",
          description: "Public payment orchestration and customer billing API.",
        },
      });

    await tx
      .insert(projects)
      .values({
        id: "project_analysis_lab",
        organizationId: "org_acme",
        slug: "analysis-lab",
        name: "Analysis Lab",
        description:
          "Public sandbox for deterministic contract compatibility analysis.",
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: "Analysis Lab",
          description:
            "Public sandbox for deterministic contract compatibility analysis.",
        },
      });

    const contractRows = [
      {
        id: "contract_payments_2_8_0",
        projectId: "project_payments",
        version: "v2.8.0",
        format: "openapi-3.1" as const,
        checksum: "demo-sha256-payments-2.8.0",
        document: baselineDocument,
      },
      {
        id: "contract_payments_3_0_0",
        projectId: "project_payments",
        version: "v3.0.0",
        format: "openapi-3.1" as const,
        checksum: "demo-sha256-payments-3.0.0",
        document: candidateDocument,
      },
    ];

    for (const contract of contractRows) {
      await tx
        .insert(apiContracts)
        .values(contract)
        .onConflictDoUpdate({
          target: apiContracts.id,
          set: {
            checksum: contract.checksum,
            document: contract.document,
            version: contract.version,
          },
        });
    }

    await tx
      .insert(releases)
      .values({
        id: "release_payments_3_0_0",
        projectId: "project_payments",
        baselineContractId: "contract_payments_2_8_0",
        candidateContractId: "contract_payments_3_0_0",
        analysisKey: "demo-payments-2.8.0-to-3.0.0",
        status: "blocked",
        riskScore: 78,
        analyzedAt,
      })
      .onConflictDoUpdate({
        target: releases.id,
        set: {
          analysisKey: "demo-payments-2.8.0-to-3.0.0",
          status: "blocked",
          riskScore: 78,
          analyzedAt,
        },
      });

    for (const change of seededChanges) {
      await tx
        .insert(changes)
        .values({ ...change, releaseId: "release_payments_3_0_0" })
        .onConflictDoUpdate({
          target: changes.id,
          set: {
            severity: change.severity,
            ruleId: change.ruleId,
            title: change.title,
            detail: change.detail,
            beforeSnapshot: change.beforeSnapshot,
            afterSnapshot: change.afterSnapshot,
          },
        });
    }

    for (const consumer of seededConsumers) {
      await tx
        .insert(consumers)
        .values({
          ...consumer,
          organizationId: "org_acme",
          repositoryUrl: `https://github.com/acme/${consumer.name}`,
        })
        .onConflictDoUpdate({
          target: consumers.id,
          set: {
            teamId: consumer.teamId,
            kind: consumer.kind,
            name: consumer.name,
          },
        });
    }

    for (const [consumerId, method, path] of seededConsumerOperations) {
      const projectId = path.startsWith("/v1/")
        ? "project_payments"
        : "project_analysis_lab";
      await tx
        .insert(consumerOperations)
        .values({
          consumerId,
          projectId,
          method,
          path,
          evidenceSource: "repository-callsite",
          lastSeenAt: analyzedAt,
        })
        .onConflictDoUpdate({
          target: [
            consumerOperations.consumerId,
            consumerOperations.projectId,
            consumerOperations.method,
            consumerOperations.path,
          ],
          set: {
            evidenceSource: "repository-callsite",
            lastSeenAt: analyzedAt,
          },
        });
    }

    const edges = [
      ["chg_1042", "con_checkout_web"],
      ["chg_1042", "con_billing_worker"],
      ["chg_1042", "con_partner_sdk"],
      ["chg_1045", "con_customer_portal"],
      ["chg_1045", "con_support_console"],
      ["chg_1051", "con_refund_orchestrator"],
      ["chg_1055", "con_ledger_sync"],
      ["chg_1058", "con_mobile_sdk"],
    ] as const;

    for (const [changeId, consumerId] of edges) {
      await tx
        .insert(impactEdges)
        .values({ changeId, consumerId, evidenceSource: "repository-callsite" })
        .onConflictDoNothing();
    }

    const events = [
      {
        id: "event_contract",
        actorKind: "person" as const,
        actorLabel: "Maya Chen",
        label: "Candidate contract uploaded",
        createdAt: new Date("2026-09-16T22:57:00.000Z"),
      },
      {
        id: "event_analyzed",
        actorKind: "system" as const,
        actorLabel: "Analyzer",
        label: "12 changes classified",
        createdAt: new Date("2026-09-16T22:58:00.000Z"),
      },
      {
        id: "event_mapped",
        actorKind: "system" as const,
        actorLabel: "Impact mapper",
        label: "8 consumers matched",
        createdAt: new Date("2026-09-16T22:59:00.000Z"),
      },
      {
        id: "event_review",
        actorKind: "person" as const,
        actorLabel: "Maya Chen",
        label: "Migration review requested",
        createdAt: analyzedAt,
      },
    ];

    for (const event of events) {
      await tx
        .insert(activityEvents)
        .values({ ...event, releaseId: "release_payments_3_0_0" })
        .onConflictDoUpdate({
          target: activityEvents.id,
          set: {
            label: event.label,
            actorLabel: event.actorLabel,
            createdAt: event.createdAt,
          },
        });
    }
  });

  console.info("Seeded the CompatGraph demonstration workspace.");
} finally {
  await client.end();
}
