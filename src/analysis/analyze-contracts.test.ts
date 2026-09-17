import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { analyzeContracts, ContractParseError, parseContract } from ".";

const baselineSource = readFixture("payments-v1.yaml");
const candidateSource = readFixture("payments-v2.yaml");

describe("parseContract", () => {
  it("parses OpenAPI 3.0 YAML and OpenAPI 3.1 JSON", () => {
    const baseline = parseContract(baselineSource);
    const candidateYaml = parseContract(candidateSource);
    const candidateJson = parseContract(JSON.stringify(candidateYaml));

    expect(baseline.openapi).toBe("3.0.3");
    expect(candidateJson).toEqual(candidateYaml);
  });

  it("returns actionable errors for invalid syntax and unsupported contracts", () => {
    expect(() => parseContract("openapi: [3.0.3")).toThrowError(
      ContractParseError,
    );

    try {
      parseContract(
        "swagger: '2.0'\ninfo: {title: Legacy, version: '1'}\npaths: {}\n",
      );
      expect.unreachable("the unsupported contract should fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ContractParseError);
      expect(error).toMatchObject({ code: "invalid_openapi" });
    }
  });
});

describe("analyzeContracts", () => {
  it("classifies a realistic compatibility change corpus exactly", () => {
    const result = analyzeContracts(
      parseContract(baselineSource),
      parseContract(candidateSource),
    );

    expect(result.compatible).toBe(false);
    expect(result.summary).toEqual({ breaking: 7, dangerous: 2, safe: 5 });
    expect(
      result.findings.map(({ ruleId, severity, operation }) => ({
        ruleId,
        severity,
        operation: `${operation.method} ${operation.path}`,
      })),
    ).toEqual([
      {
        ruleId: "operation-removed",
        severity: "breaking",
        operation: "GET /legacy",
      },
      {
        ruleId: "schema-type-changed",
        severity: "breaking",
        operation: "POST /payments",
      },
      {
        ruleId: "enum-values-removed",
        severity: "breaking",
        operation: "POST /payments",
      },
      {
        ruleId: "request-property-became-required",
        severity: "breaking",
        operation: "POST /payments",
      },
      {
        ruleId: "request-body-became-required",
        severity: "breaking",
        operation: "POST /payments",
      },
      {
        ruleId: "schema-property-removed",
        severity: "breaking",
        operation: "GET /payments/{id}",
      },
      {
        ruleId: "response-removed",
        severity: "breaking",
        operation: "GET /payments/{id}",
      },
      {
        ruleId: "request-property-removed",
        severity: "dangerous",
        operation: "POST /payments",
      },
      {
        ruleId: "enum-values-added",
        severity: "dangerous",
        operation: "GET /payments/{id}",
      },
      {
        ruleId: "schema-property-added",
        severity: "safe",
        operation: "POST /payments",
      },
      {
        ruleId: "response-added",
        severity: "safe",
        operation: "POST /payments",
      },
      {
        ruleId: "enum-values-removed",
        severity: "safe",
        operation: "GET /payments/{id}",
      },
      {
        ruleId: "schema-property-added",
        severity: "safe",
        operation: "GET /payments/{id}",
      },
      {
        ruleId: "operation-added",
        severity: "safe",
        operation: "POST /refunds",
      },
    ]);
    expect(
      result.findings.every((finding) => /^chg_[a-f0-9]{16}$/.test(finding.id)),
    ).toBe(true);
    expect(new Set(result.findings.map((finding) => finding.id)).size).toBe(
      result.findings.length,
    );
    expect(
      result.findings.every((finding) => finding.pointer.startsWith("/paths/")),
    ).toBe(true);
  });

  it("is stable across runs and returns no findings for identical contracts", () => {
    const baseline = parseContract(baselineSource);
    const candidate = parseContract(candidateSource);

    expect(analyzeContracts(baseline, candidate)).toEqual(
      analyzeContracts(baseline, candidate),
    );
    expect(analyzeContracts(baseline, baseline)).toEqual({
      engineVersion: "1",
      compatible: true,
      findings: [],
      summary: { breaking: 0, dangerous: 0, safe: 0 },
    });
  });
});

function readFixture(name: string) {
  return readFileSync(
    resolve(process.cwd(), "tests", "fixtures", "openapi", name),
    "utf8",
  );
}
