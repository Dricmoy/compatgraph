import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createAnalysis, getAnalysisById } from "./analyses";

const baselineSource = readFixture("payments-v1.yaml");
const candidateSource = readFixture("payments-v2.yaml");

describe("persisted release analysis", () => {
  it("stores exact findings and operation-level consumer impact", async () => {
    const created = await createAnalysis({
      projectSlug: "analysis-lab",
      baselineSource,
      candidateSource,
    });
    const analysis = await getAnalysisById(created.releaseId);

    expect(analysis).not.toBeNull();
    expect(analysis).toMatchObject({
      id: created.releaseId,
      baselineVersion: "1.4.0",
      candidateVersion: "2.0.0",
      status: "blocked",
      riskScore: 100,
      summary: { breaking: 7, dangerous: 2, safe: 5 },
      impactedConsumers: 6,
    });
    expect(analysis?.findings).toHaveLength(14);
    expect(
      analysis?.findings.find(
        (finding) => finding.ruleId === "request-body-became-required",
      )?.consumers,
    ).toHaveLength(3);
    expect(
      analysis?.findings.find(
        (finding) => finding.ruleId === "operation-removed",
      )?.consumers,
    ).toHaveLength(0);
  });

  it("returns the same release without duplicating a repeated analysis", async () => {
    const first = await createAnalysis({
      projectSlug: "analysis-lab",
      baselineSource,
      candidateSource,
    });
    const second = await createAnalysis({
      projectSlug: "analysis-lab",
      baselineSource,
      candidateSource,
    });

    expect(second).toEqual({ releaseId: first.releaseId, created: false });
  });
});

function readFixture(name: string) {
  return readFileSync(
    resolve(process.cwd(), "tests", "fixtures", "openapi", name),
    "utf8",
  );
}
