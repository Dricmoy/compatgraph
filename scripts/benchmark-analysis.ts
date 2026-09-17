import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { analyzeContracts, parseContract } from "../src/analysis";

const fixtureDirectory = resolve(process.cwd(), "tests", "fixtures", "openapi");
const [baselineSource, candidateSource] = await Promise.all([
  readFile(resolve(fixtureDirectory, "payments-v1.yaml"), "utf8"),
  readFile(resolve(fixtureDirectory, "payments-v2.yaml"), "utf8"),
]);
const baseline = parseContract(baselineSource);
const candidate = parseContract(candidateSource);
const iterations = 500;
const durations: number[] = [];
let result = analyzeContracts(baseline, candidate);

for (let iteration = 0; iteration < iterations; iteration += 1) {
  const startedAt = performance.now();
  result = analyzeContracts(baseline, candidate);
  durations.push(performance.now() - startedAt);
}

durations.sort((left, right) => left - right);
const digest = createHash("sha256")
  .update(JSON.stringify(result))
  .digest("hex")
  .slice(0, 16);

console.info(
  JSON.stringify(
    {
      benchmark: "openapi-fixture-comparison",
      iterations,
      node: process.version,
      medianMs: round(percentile(durations, 0.5)),
      p95Ms: round(percentile(durations, 0.95)),
      maxMs: round(durations.at(-1) ?? 0),
      findings: result.findings.length,
      digest,
    },
    null,
    2,
  ),
);

function percentile(values: number[], quantile: number) {
  return (
    values[Math.min(values.length - 1, Math.floor(values.length * quantile))] ??
    0
  );
}

function round(value: number) {
  return Math.round(value * 1_000) / 1_000;
}
