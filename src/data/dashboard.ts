import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import {
  activityEvents,
  apiContracts,
  changes,
  consumers,
  impactEdges,
  organizations,
  projects,
  releases,
  teams,
} from "@/db/schema";
import type { ChangeSeverity } from "@/lib/risk-score";

export type DashboardChange = {
  id: string;
  severity: ChangeSeverity;
  method: string;
  path: string;
  title: string;
  detail: string;
  consumers: string[];
};

export type DashboardConsumer = {
  id: string;
  name: string;
  owner: string;
  exposed: boolean;
};

export type DashboardActivity = {
  label: string;
  actor: string;
  time: string;
};

export type ReleaseDashboard = {
  organization: string;
  service: string;
  baseline: string;
  candidate: string;
  status: "analyzing" | "blocked" | "ready" | "released";
  score: number;
  findings: number;
  severityCounts: Record<ChangeSeverity, number>;
  consumers: number;
  consumerKindCounts: Record<"application" | "worker" | "sdk", number>;
  owners: number;
  analyzedAt: Date | null;
  priorityChanges: DashboardChange[];
  graphConsumers: DashboardConsumer[];
  activity: DashboardActivity[];
};

const severityRank: Record<ChangeSeverity, number> = {
  breaking: 0,
  dangerous: 1,
  safe: 2,
};

export async function getLatestReleaseDashboard(
  projectSlug: string,
): Promise<ReleaseDashboard> {
  const db = getDatabase();

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      organization: organizations.name,
    })
    .from(projects)
    .innerJoin(organizations, eq(projects.organizationId, organizations.id))
    .where(eq(projects.slug, projectSlug))
    .limit(1);

  if (!project) {
    throw new Error(`Project not found: ${projectSlug}`);
  }

  const [release] = await db
    .select()
    .from(releases)
    .where(eq(releases.projectId, project.id))
    .orderBy(desc(releases.createdAt))
    .limit(1);

  if (!release) {
    throw new Error(`No release found for project: ${projectSlug}`);
  }

  const contractRows = await db
    .select({ id: apiContracts.id, version: apiContracts.version })
    .from(apiContracts)
    .where(
      inArray(apiContracts.id, [
        release.baselineContractId,
        release.candidateContractId,
      ]),
    );

  const versionById = new Map(
    contractRows.map((contract) => [contract.id, contract.version]),
  );

  const changeRows = await db
    .select({
      changeId: changes.id,
      severity: changes.severity,
      method: changes.method,
      path: changes.path,
      title: changes.title,
      detail: changes.detail,
      consumerId: consumers.id,
      consumerName: consumers.name,
      consumerKind: consumers.kind,
      teamName: teams.name,
    })
    .from(changes)
    .leftJoin(impactEdges, eq(changes.id, impactEdges.changeId))
    .leftJoin(consumers, eq(impactEdges.consumerId, consumers.id))
    .leftJoin(teams, eq(consumers.teamId, teams.id))
    .where(eq(changes.releaseId, release.id))
    .orderBy(asc(changes.createdAt), asc(changes.id));

  const changeMap = new Map<string, DashboardChange>();
  const consumerMap = new Map<
    string,
    {
      name: string;
      owner: string;
      kind: "application" | "worker" | "sdk";
    }
  >();

  for (const row of changeRows) {
    const existing = changeMap.get(row.changeId);
    const change =
      existing ??
      ({
        id: row.changeId,
        severity: row.severity,
        method: row.method,
        path: row.path,
        title: row.title,
        detail: row.detail,
        consumers: [],
      } satisfies DashboardChange);

    if (
      row.consumerId &&
      row.consumerName &&
      row.consumerKind &&
      row.teamName
    ) {
      change.consumers.push(row.consumerName);
      consumerMap.set(row.consumerId, {
        name: row.consumerName,
        owner: row.teamName,
        kind: row.consumerKind,
      });
    }

    changeMap.set(row.changeId, change);
  }

  const allChanges = [...changeMap.values()].sort((a, b) => {
    const severityDifference =
      severityRank[a.severity] - severityRank[b.severity];
    return severityDifference || b.consumers.length - a.consumers.length;
  });

  const severityCounts = allChanges.reduce<Record<ChangeSeverity, number>>(
    (counts, change) => {
      counts[change.severity] += 1;
      return counts;
    },
    { breaking: 0, dangerous: 0, safe: 0 },
  );

  const selectedConsumerNames = new Set(allChanges[0]?.consumers ?? []);
  const graphConsumers = [...consumerMap.entries()]
    .map(([id, consumer]) => ({
      id,
      name: consumer.name,
      owner: consumer.owner,
      exposed: selectedConsumerNames.has(consumer.name),
    }))
    .sort((a, b) => Number(b.exposed) - Number(a.exposed))
    .slice(0, 4);

  const activityRows = await db
    .select({
      label: activityEvents.label,
      actor: activityEvents.actorLabel,
      createdAt: activityEvents.createdAt,
    })
    .from(activityEvents)
    .where(eq(activityEvents.releaseId, release.id))
    .orderBy(asc(activityEvents.createdAt));

  const latestEventAt = activityRows.at(-1)?.createdAt;
  const activity = activityRows.map((event) => ({
    label: event.label,
    actor: event.actor,
    time: formatTimelineOffset(event.createdAt, latestEventAt),
  }));

  const consumerKindCounts = [...consumerMap.values()].reduce<
    Record<"application" | "worker" | "sdk", number>
  >(
    (counts, consumer) => {
      counts[consumer.kind] += 1;
      return counts;
    },
    { application: 0, worker: 0, sdk: 0 },
  );

  return {
    organization: project.organization,
    service: project.name,
    baseline: versionById.get(release.baselineContractId) ?? "Unknown",
    candidate: versionById.get(release.candidateContractId) ?? "Unknown",
    status: release.status,
    score: release.riskScore,
    findings: allChanges.length,
    severityCounts,
    consumers: consumerMap.size,
    consumerKindCounts,
    owners: new Set([...consumerMap.values()].map((consumer) => consumer.owner))
      .size,
    analyzedAt: release.analyzedAt,
    priorityChanges: allChanges.slice(0, 3),
    graphConsumers,
    activity,
  };
}

function formatTimelineOffset(createdAt: Date, latestAt?: Date): string {
  if (!latestAt) return "Now";
  const differenceMinutes = Math.max(
    0,
    Math.round((latestAt.getTime() - createdAt.getTime()) / 60_000),
  );
  return differenceMinutes === 0 ? "Now" : `${differenceMinutes}m`;
}

export async function releaseExists(projectSlug: string): Promise<boolean> {
  const db = getDatabase();
  const [result] = await db
    .select({ id: releases.id })
    .from(releases)
    .innerJoin(projects, eq(releases.projectId, projects.id))
    .where(and(eq(projects.slug, projectSlug), eq(releases.status, "blocked")))
    .limit(1);
  return Boolean(result);
}
