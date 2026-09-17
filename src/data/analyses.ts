import "server-only";

import { createHash } from "node:crypto";

import { and, asc, eq, inArray } from "drizzle-orm";

import { analyzeContracts, parseContract } from "@/analysis";
import type {
  CompatibilityFinding,
  FindingSeverity,
  OpenApiDocument,
} from "@/analysis";
import { getDatabase } from "@/db/client";
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
} from "@/db/schema";
import { calculateReleaseRisk } from "@/lib/risk-score";

export interface CreateAnalysisInput {
  projectSlug: string;
  baselineSource: string;
  candidateSource: string;
}

export interface CreateAnalysisResult {
  releaseId: string;
  created: boolean;
}

export interface AnalysisConsumer {
  id: string;
  name: string;
  kind: "application" | "worker" | "sdk";
  owner: string;
  evidenceSource: string;
}

export interface AnalysisFindingView {
  id: string;
  ruleId: string;
  severity: FindingSeverity;
  method: string;
  path: string;
  pointer: string;
  title: string;
  detail: string;
  before: unknown;
  after: unknown;
  consumers: AnalysisConsumer[];
}

export interface StoredAnalysisView {
  id: string;
  organization: string;
  project: string;
  projectSlug: string;
  baselineVersion: string;
  candidateVersion: string;
  status: "analyzing" | "blocked" | "ready" | "released";
  riskScore: number;
  analyzedAt: Date | null;
  findings: AnalysisFindingView[];
  summary: Record<FindingSeverity, number>;
  impactedConsumers: number;
  activities: Array<{
    id: string;
    label: string;
    actor: string;
    createdAt: Date;
  }>;
}

export class AnalysisPersistenceError extends Error {
  readonly code: "project_not_found";

  constructor(projectSlug: string) {
    super(`Project not found: ${projectSlug}`);
    this.name = "AnalysisPersistenceError";
    this.code = "project_not_found";
  }
}

export async function createAnalysis(
  input: CreateAnalysisInput,
): Promise<CreateAnalysisResult> {
  const baseline = parseContract(input.baselineSource);
  const candidate = parseContract(input.candidateSource);
  const result = analyzeContracts(baseline, candidate);
  const db = getDatabase();

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, input.projectSlug))
    .limit(1);

  if (!project) {
    throw new AnalysisPersistenceError(input.projectSlug);
  }

  const baselineChecksum = checksumDocument(baseline);
  const candidateChecksum = checksumDocument(candidate);
  const analysisKey = sha256(
    [
      project.id,
      baselineChecksum,
      candidateChecksum,
      result.engineVersion,
    ].join(":"),
  );
  const releaseId = stableId("release", analysisKey);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: releases.id })
      .from(releases)
      .where(eq(releases.analysisKey, analysisKey))
      .limit(1);

    if (existing) {
      return { releaseId: existing.id, created: false };
    }

    const baselineContractId = await persistContract(
      tx,
      project.id,
      baseline,
      baselineChecksum,
    );
    const candidateContractId = await persistContract(
      tx,
      project.id,
      candidate,
      candidateChecksum,
    );
    const analyzedAt = new Date();
    const status = result.compatible ? "ready" : "blocked";

    const [insertedRelease] = await tx
      .insert(releases)
      .values({
        id: releaseId,
        projectId: project.id,
        baselineContractId,
        candidateContractId,
        analysisKey,
        status,
        riskScore: 0,
        analyzedAt,
      })
      .onConflictDoNothing({ target: releases.analysisKey })
      .returning({ id: releases.id });

    if (!insertedRelease) {
      const [concurrentRelease] = await tx
        .select({ id: releases.id })
        .from(releases)
        .where(eq(releases.analysisKey, analysisKey))
        .limit(1);
      if (!concurrentRelease) {
        throw new Error("Analysis idempotency conflict could not be resolved.");
      }
      return { releaseId: concurrentRelease.id, created: false };
    }

    const usageRows = await tx
      .select({
        consumerId: consumerOperations.consumerId,
        method: consumerOperations.method,
        path: consumerOperations.path,
        evidenceSource: consumerOperations.evidenceSource,
      })
      .from(consumerOperations)
      .where(eq(consumerOperations.projectId, project.id));
    const usages = new Map<
      string,
      Array<{ consumerId: string; evidenceSource: string }>
    >();

    for (const usage of usageRows) {
      const key = operationKey(usage.method, usage.path);
      usages.set(key, [
        ...(usages.get(key) ?? []),
        {
          consumerId: usage.consumerId,
          evidenceSource: usage.evidenceSource,
        },
      ]);
    }

    const riskInputs: Array<{
      severity: FindingSeverity;
      impactedConsumers: number;
    }> = [];

    for (const analysisFinding of result.findings) {
      const changeId = stableId("change", `${releaseId}:${analysisFinding.id}`);
      await tx.insert(changes).values({
        id: changeId,
        releaseId,
        ruleId: analysisFinding.ruleId,
        severity: analysisFinding.severity,
        method: analysisFinding.operation.method,
        path: analysisFinding.operation.path,
        title: analysisFinding.title,
        detail: analysisFinding.detail,
        jsonPointer: analysisFinding.pointer,
        beforeSnapshot: normalizeSnapshot(analysisFinding.before),
        afterSnapshot: normalizeSnapshot(analysisFinding.after),
      });

      const matchedConsumers =
        usages.get(
          operationKey(
            analysisFinding.operation.method,
            analysisFinding.operation.path,
          ),
        ) ?? [];

      for (const matched of matchedConsumers) {
        await tx.insert(impactEdges).values({
          changeId,
          consumerId: matched.consumerId,
          evidenceSource: matched.evidenceSource,
        });
      }

      riskInputs.push({
        severity: analysisFinding.severity,
        impactedConsumers: matchedConsumers.length,
      });
    }

    const riskScore = calculateReleaseRisk(riskInputs);
    await tx
      .update(releases)
      .set({ riskScore })
      .where(eq(releases.id, releaseId));

    const impactedConsumerIds = new Set(
      result.findings.flatMap(
        (analysisFinding) =>
          usages
            .get(
              operationKey(
                analysisFinding.operation.method,
                analysisFinding.operation.path,
              ),
            )
            ?.map((usage) => usage.consumerId) ?? [],
      ),
    );
    await tx.insert(activityEvents).values([
      {
        id: stableId("event", `${releaseId}:uploaded`),
        releaseId,
        actorKind: "person",
        actorLabel: "Demo visitor",
        label: "Contract pair submitted",
        createdAt: new Date(analyzedAt.getTime() - 2_000),
      },
      {
        id: stableId("event", `${releaseId}:analyzed`),
        releaseId,
        actorKind: "system",
        actorLabel: "CompatGraph engine",
        label: `${result.findings.length} changes classified`,
        createdAt: new Date(analyzedAt.getTime() - 1_000),
      },
      {
        id: stableId("event", `${releaseId}:mapped`),
        releaseId,
        actorKind: "system",
        actorLabel: "Impact mapper",
        label: `${impactedConsumerIds.size} consumers matched`,
        createdAt: analyzedAt,
      },
    ]);

    return { releaseId, created: true };
  });
}

export async function getAnalysisById(
  releaseId: string,
): Promise<StoredAnalysisView | null> {
  const db = getDatabase();
  const [release] = await db
    .select({
      id: releases.id,
      projectId: releases.projectId,
      baselineContractId: releases.baselineContractId,
      candidateContractId: releases.candidateContractId,
      status: releases.status,
      riskScore: releases.riskScore,
      analyzedAt: releases.analyzedAt,
      project: projects.name,
      projectSlug: projects.slug,
      organization: organizations.name,
    })
    .from(releases)
    .innerJoin(projects, eq(releases.projectId, projects.id))
    .innerJoin(organizations, eq(projects.organizationId, organizations.id))
    .where(eq(releases.id, releaseId))
    .limit(1);

  if (!release) return null;

  const contractRows = await db
    .select({ id: apiContracts.id, version: apiContracts.version })
    .from(apiContracts)
    .where(
      inArray(apiContracts.id, [
        release.baselineContractId,
        release.candidateContractId,
      ]),
    );
  const versions = new Map(contractRows.map((row) => [row.id, row.version]));
  const rows = await db
    .select({
      id: changes.id,
      ruleId: changes.ruleId,
      severity: changes.severity,
      method: changes.method,
      path: changes.path,
      pointer: changes.jsonPointer,
      title: changes.title,
      detail: changes.detail,
      before: changes.beforeSnapshot,
      after: changes.afterSnapshot,
      consumerId: consumers.id,
      consumerName: consumers.name,
      consumerKind: consumers.kind,
      owner: teams.name,
      evidenceSource: impactEdges.evidenceSource,
    })
    .from(changes)
    .leftJoin(impactEdges, eq(changes.id, impactEdges.changeId))
    .leftJoin(consumers, eq(impactEdges.consumerId, consumers.id))
    .leftJoin(teams, eq(consumers.teamId, teams.id))
    .where(eq(changes.releaseId, releaseId))
    .orderBy(asc(changes.createdAt), asc(changes.id));

  const findings = new Map<string, AnalysisFindingView>();
  for (const row of rows) {
    const entry =
      findings.get(row.id) ??
      ({
        id: row.id,
        ruleId: row.ruleId,
        severity: row.severity,
        method: row.method,
        path: row.path,
        pointer: row.pointer,
        title: row.title,
        detail: row.detail,
        before: row.before,
        after: row.after,
        consumers: [],
      } satisfies AnalysisFindingView);

    if (
      row.consumerId &&
      row.consumerName &&
      row.consumerKind &&
      row.owner &&
      row.evidenceSource
    ) {
      entry.consumers.push({
        id: row.consumerId,
        name: row.consumerName,
        kind: row.consumerKind,
        owner: row.owner,
        evidenceSource: row.evidenceSource,
      });
    }

    findings.set(row.id, entry);
  }

  const findingList = [...findings.values()].sort(compareFindingViews);
  const summary = findingList.reduce<Record<FindingSeverity, number>>(
    (counts, findingView) => {
      counts[findingView.severity] += 1;
      return counts;
    },
    { breaking: 0, dangerous: 0, safe: 0 },
  );
  const activities = await db
    .select({
      id: activityEvents.id,
      label: activityEvents.label,
      actor: activityEvents.actorLabel,
      createdAt: activityEvents.createdAt,
    })
    .from(activityEvents)
    .where(eq(activityEvents.releaseId, releaseId))
    .orderBy(asc(activityEvents.createdAt));

  return {
    id: release.id,
    organization: release.organization,
    project: release.project,
    projectSlug: release.projectSlug,
    baselineVersion:
      versions.get(release.baselineContractId) ?? "Unknown baseline",
    candidateVersion:
      versions.get(release.candidateContractId) ?? "Unknown candidate",
    status: release.status,
    riskScore: release.riskScore,
    analyzedAt: release.analyzedAt,
    findings: findingList,
    summary,
    impactedConsumers: new Set(
      findingList.flatMap((findingView) =>
        findingView.consumers.map((consumer) => consumer.id),
      ),
    ).size,
    activities,
  };
}

async function persistContract(
  tx: Parameters<
    Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
  >[0],
  projectId: string,
  document: OpenApiDocument,
  checksum: string,
) {
  const id = stableId("contract", `${projectId}:${checksum}`);
  await tx
    .insert(apiContracts)
    .values({
      id,
      projectId,
      version: document.info.version,
      format: document.openapi.startsWith("3.0")
        ? "openapi-3.0"
        : "openapi-3.1",
      checksum,
      document,
    })
    .onConflictDoNothing({
      target: [apiContracts.projectId, apiContracts.checksum],
    });

  const [stored] = await tx
    .select({ id: apiContracts.id })
    .from(apiContracts)
    .where(
      and(
        eq(apiContracts.projectId, projectId),
        eq(apiContracts.checksum, checksum),
      ),
    )
    .limit(1);

  if (!stored) throw new Error("Failed to persist API contract.");
  return stored.id;
}

function checksumDocument(document: OpenApiDocument) {
  return sha256(canonicalStringify(document));
}

function canonicalStringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalStringify(item)}`)
    .join(",")}}`;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stableId(prefix: string, value: string) {
  return `${prefix}_${sha256(value).slice(0, 24)}`;
}

function operationKey(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`;
}

function normalizeSnapshot(value: CompatibilityFinding["before"]) {
  return value === undefined ? null : value;
}

const severityOrder: Record<FindingSeverity, number> = {
  breaking: 0,
  dangerous: 1,
  safe: 2,
};

function compareFindingViews(
  left: AnalysisFindingView,
  right: AnalysisFindingView,
) {
  return (
    severityOrder[left.severity] - severityOrder[right.severity] ||
    right.consumers.length - left.consumers.length ||
    left.path.localeCompare(right.path) ||
    left.method.localeCompare(right.method) ||
    left.pointer.localeCompare(right.pointer)
  );
}
