import { createHash } from "node:crypto";

import type {
  AnalysisResult,
  CompatibilityFinding,
  FindingOperation,
  FindingSeverity,
  OpenApiDocument,
  RuleId,
} from "./types";
import { severityOrder } from "./types";

const operationMethods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

type JsonObject = Record<string, unknown>;
type SchemaDirection = "request" | "response";
type PendingFinding = Omit<CompatibilityFinding, "id">;

interface OperationEntry {
  operation: FindingOperation;
  pointer: string;
  value: JsonObject;
}

interface SchemaLocation {
  pointer: string;
  schema: unknown;
}

interface CompareSchemaInput {
  baseline: unknown;
  candidate: unknown;
  baselineDocument: OpenApiDocument;
  candidateDocument: OpenApiDocument;
  direction: SchemaDirection;
  operation: FindingOperation;
  pointer: string;
  findings: PendingFinding[];
}

export function analyzeContracts(
  baseline: OpenApiDocument,
  candidate: OpenApiDocument,
): AnalysisResult {
  const findings: PendingFinding[] = [];
  const baselineOperations = collectOperations(baseline);
  const candidateOperations = collectOperations(candidate);
  const operationKeys = new Set([
    ...baselineOperations.keys(),
    ...candidateOperations.keys(),
  ]);

  for (const key of [...operationKeys].sort()) {
    const before = baselineOperations.get(key);
    const after = candidateOperations.get(key);

    if (before && !after) {
      findings.push(
        finding(
          "operation-removed",
          "breaking",
          before.operation,
          before.pointer,
          "Operation removed",
          `${formatOperation(before.operation)} no longer exists in the candidate contract.`,
          { present: true },
          { present: false },
        ),
      );
      continue;
    }

    if (!before && after) {
      findings.push(
        finding(
          "operation-added",
          "safe",
          after.operation,
          after.pointer,
          "Operation added",
          `${formatOperation(after.operation)} is a new operation.`,
          { present: false },
          { present: true },
        ),
      );
      continue;
    }

    if (before && after) {
      compareOperation(baseline, candidate, before, after, findings);
    }
  }

  const finalized = findings
    .map((item) => ({ ...item, id: stableFindingId(item) }))
    .sort(compareFindings);
  const summary = {
    breaking: finalized.filter((item) => item.severity === "breaking").length,
    dangerous: finalized.filter((item) => item.severity === "dangerous").length,
    safe: finalized.filter((item) => item.severity === "safe").length,
  };

  return {
    engineVersion: "1",
    compatible: summary.breaking === 0,
    findings: finalized,
    summary,
  };
}

function compareOperation(
  baselineDocument: OpenApiDocument,
  candidateDocument: OpenApiDocument,
  baseline: OperationEntry,
  candidate: OperationEntry,
  findings: PendingFinding[],
) {
  const baselineBody = asObject(baseline.value.requestBody);
  const candidateBody = asObject(candidate.value.requestBody);
  const baselineRequired = baselineBody?.required === true;
  const candidateRequired = candidateBody?.required === true;

  if (!baselineRequired && candidateRequired) {
    findings.push(
      finding(
        "request-body-became-required",
        "breaking",
        candidate.operation,
        `${candidate.pointer}/requestBody/required`,
        "Request body became required",
        `${formatOperation(candidate.operation)} now rejects requests without a body.`,
        baselineRequired,
        candidateRequired,
      ),
    );
  }

  const baselineRequestSchema = findContentSchema(
    baselineBody,
    `${baseline.pointer}/requestBody`,
  );
  const candidateRequestSchema = findContentSchema(
    candidateBody,
    `${candidate.pointer}/requestBody`,
  );

  if (baselineRequestSchema && candidateRequestSchema) {
    compareSchema({
      baseline: baselineRequestSchema.schema,
      candidate: candidateRequestSchema.schema,
      baselineDocument,
      candidateDocument,
      direction: "request",
      operation: candidate.operation,
      pointer: candidateRequestSchema.pointer,
      findings,
    });
  }

  compareResponses(
    baselineDocument,
    candidateDocument,
    baseline,
    candidate,
    findings,
  );
}

function compareResponses(
  baselineDocument: OpenApiDocument,
  candidateDocument: OpenApiDocument,
  baseline: OperationEntry,
  candidate: OperationEntry,
  findings: PendingFinding[],
) {
  const baselineResponses = asObject(baseline.value.responses) ?? {};
  const candidateResponses = asObject(candidate.value.responses) ?? {};
  const codes = new Set([
    ...Object.keys(baselineResponses),
    ...Object.keys(candidateResponses),
  ]);

  for (const code of [...codes].sort()) {
    const before = asObject(baselineResponses[code]);
    const after = asObject(candidateResponses[code]);
    const responsePointer = `${candidate.pointer}/responses/${escapePointer(code)}`;

    if (before && !after) {
      findings.push(
        finding(
          "response-removed",
          "breaking",
          candidate.operation,
          responsePointer,
          `Response ${code} removed`,
          `${formatOperation(candidate.operation)} no longer documents response ${code}.`,
          { present: true },
          { present: false },
        ),
      );
      continue;
    }

    if (!before && after) {
      findings.push(
        finding(
          "response-added",
          "safe",
          candidate.operation,
          responsePointer,
          `Response ${code} added`,
          `${formatOperation(candidate.operation)} now documents response ${code}.`,
          { present: false },
          { present: true },
        ),
      );
      continue;
    }

    if (before && after) {
      const baselineSchema = findContentSchema(
        before,
        `${baseline.pointer}/responses/${escapePointer(code)}`,
      );
      const candidateSchema = findContentSchema(after, responsePointer);

      if (baselineSchema && candidateSchema) {
        compareSchema({
          baseline: baselineSchema.schema,
          candidate: candidateSchema.schema,
          baselineDocument,
          candidateDocument,
          direction: "response",
          operation: candidate.operation,
          pointer: candidateSchema.pointer,
          findings,
        });
      }
    }
  }
}

function compareSchema(input: CompareSchemaInput) {
  const baseline = resolveSchema(input.baselineDocument, input.baseline);
  const candidate = resolveSchema(input.candidateDocument, input.candidate);

  if (!baseline || !candidate) {
    return;
  }

  const baselineType = schemaType(baseline);
  const candidateType = schemaType(candidate);

  if (
    baselineType &&
    candidateType &&
    canonicalStringify(baselineType) !== canonicalStringify(candidateType)
  ) {
    input.findings.push(
      finding(
        "schema-type-changed",
        "breaking",
        input.operation,
        `${input.pointer}/type`,
        "Schema type changed",
        `${input.direction === "request" ? "Request" : "Response"} type changed from ${formatValue(baselineType)} to ${formatValue(candidateType)}.`,
        baselineType,
        candidateType,
      ),
    );
    return;
  }

  compareEnums(input, baseline, candidate);

  const baselineProperties = asObject(baseline.properties) ?? {};
  const candidateProperties = asObject(candidate.properties) ?? {};
  const baselineRequired = stringSet(baseline.required);
  const candidateRequired = stringSet(candidate.required);
  const propertyNames = new Set([
    ...Object.keys(baselineProperties),
    ...Object.keys(candidateProperties),
  ]);

  for (const propertyName of [...propertyNames].sort()) {
    const before = baselineProperties[propertyName];
    const after = candidateProperties[propertyName];
    const propertyPointer = `${input.pointer}/properties/${escapePointer(propertyName)}`;

    if (before !== undefined && after === undefined) {
      const isResponse = input.direction === "response";
      input.findings.push(
        finding(
          isResponse ? "schema-property-removed" : "request-property-removed",
          isResponse ? "breaking" : "dangerous",
          input.operation,
          propertyPointer,
          `${capitalize(input.direction)} property removed`,
          `${propertyName} was removed from the ${input.direction} schema.`,
          summarizeSchema(before),
          null,
        ),
      );
      continue;
    }

    if (before === undefined && after !== undefined) {
      const newlyRequired =
        input.direction === "request" && candidateRequired.has(propertyName);
      input.findings.push(
        finding(
          newlyRequired
            ? "request-property-became-required"
            : "schema-property-added",
          newlyRequired ? "breaking" : "safe",
          input.operation,
          propertyPointer,
          newlyRequired
            ? "Required request property added"
            : `${capitalize(input.direction)} property added`,
          newlyRequired
            ? `${propertyName} is a new required request property.`
            : `${propertyName} was added to the ${input.direction} schema.`,
          null,
          summarizeSchema(after),
        ),
      );
      continue;
    }

    if (before !== undefined && after !== undefined) {
      if (
        input.direction === "request" &&
        !baselineRequired.has(propertyName) &&
        candidateRequired.has(propertyName)
      ) {
        input.findings.push(
          finding(
            "request-property-became-required",
            "breaking",
            input.operation,
            propertyPointer,
            "Request property became required",
            `${propertyName} must now be supplied by every caller.`,
            false,
            true,
          ),
        );
      }

      if (
        input.direction === "response" &&
        baselineRequired.has(propertyName) &&
        !candidateRequired.has(propertyName)
      ) {
        input.findings.push(
          finding(
            "response-property-became-optional",
            "breaking",
            input.operation,
            propertyPointer,
            "Response property became optional",
            `${propertyName} is no longer guaranteed in the response.`,
            true,
            false,
          ),
        );
      }

      compareSchema({
        ...input,
        baseline: before,
        candidate: after,
        pointer: propertyPointer,
      });
    }
  }

  const baselineItems = baseline.items;
  const candidateItems = candidate.items;
  if (baselineItems !== undefined && candidateItems !== undefined) {
    compareSchema({
      ...input,
      baseline: baselineItems,
      candidate: candidateItems,
      pointer: `${input.pointer}/items`,
    });
  }
}

function compareEnums(
  input: CompareSchemaInput,
  baseline: JsonObject,
  candidate: JsonObject,
) {
  if (!Array.isArray(baseline.enum) || !Array.isArray(candidate.enum)) {
    return;
  }

  const baselineValues = new Map(
    baseline.enum.map((value) => [canonicalStringify(value), value]),
  );
  const candidateValues = new Map(
    candidate.enum.map((value) => [canonicalStringify(value), value]),
  );
  const removed = [...baselineValues]
    .filter(([key]) => !candidateValues.has(key))
    .map(([, value]) => value);
  const added = [...candidateValues]
    .filter(([key]) => !baselineValues.has(key))
    .map(([, value]) => value);

  if (removed.length > 0) {
    input.findings.push(
      finding(
        "enum-values-removed",
        input.direction === "request" ? "breaking" : "safe",
        input.operation,
        `${input.pointer}/enum`,
        "Enum values removed",
        `${removed.map(formatValue).join(", ")} ${removed.length === 1 ? "is" : "are"} no longer allowed in the ${input.direction}.`,
        baseline.enum,
        candidate.enum,
      ),
    );
  }

  if (added.length > 0) {
    input.findings.push(
      finding(
        "enum-values-added",
        input.direction === "response" ? "dangerous" : "safe",
        input.operation,
        `${input.pointer}/enum`,
        "Enum values added",
        `${added.map(formatValue).join(", ")} ${added.length === 1 ? "is" : "are"} newly possible in the ${input.direction}.`,
        baseline.enum,
        candidate.enum,
      ),
    );
  }
}

function collectOperations(document: OpenApiDocument) {
  const operations = new Map<string, OperationEntry>();

  for (const path of Object.keys(document.paths).sort()) {
    const pathItem = asObject(document.paths[path]);
    if (!pathItem) continue;

    for (const method of operationMethods) {
      const value = asObject(pathItem[method]);
      if (!value) continue;

      const operation = { method: method.toUpperCase(), path };
      operations.set(`${method} ${path}`, {
        operation,
        pointer: `/paths/${escapePointer(path)}/${method}`,
        value,
      });
    }
  }

  return operations;
}

function findContentSchema(
  container: JsonObject | undefined,
  pointer: string,
): SchemaLocation | undefined {
  const content = asObject(container?.content);
  if (!content) return undefined;

  const mediaTypes = Object.keys(content).sort((left, right) => {
    if (left === "application/json") return -1;
    if (right === "application/json") return 1;
    return left.localeCompare(right);
  });

  for (const mediaType of mediaTypes) {
    const media = asObject(content[mediaType]);
    if (media?.schema !== undefined) {
      return {
        pointer: `${pointer}/content/${escapePointer(mediaType)}/schema`,
        schema: media.schema,
      };
    }
  }

  return undefined;
}

function resolveSchema(
  document: OpenApiDocument,
  input: unknown,
  seen = new Set<string>(),
): JsonObject | undefined {
  const schema = asObject(input);
  if (!schema) return undefined;

  if (typeof schema.$ref !== "string") {
    return schema;
  }

  if (
    !schema.$ref.startsWith("#/components/schemas/") ||
    seen.has(schema.$ref)
  ) {
    return undefined;
  }

  const name = decodeURIComponent(
    schema.$ref.slice("#/components/schemas/".length),
  )
    .replaceAll("~1", "/")
    .replaceAll("~0", "~");
  const target = document.components?.schemas?.[name];
  seen.add(schema.$ref);
  return resolveSchema(document, target, seen);
}

function schemaType(schema: JsonObject) {
  if (typeof schema.type === "string") return schema.type;
  if (
    Array.isArray(schema.type) &&
    schema.type.every((value) => typeof value === "string")
  ) {
    return [...schema.type].sort();
  }
  if (schema.properties) return "object";
  if (schema.items) return "array";
  return undefined;
}

function summarizeSchema(value: unknown) {
  const schema = asObject(value);
  if (!schema) return value;
  return {
    type: schemaType(schema) ?? null,
    required: Array.isArray(schema.required) ? schema.required : [],
    enum: Array.isArray(schema.enum) ? schema.enum : undefined,
  };
}

function finding(
  ruleId: RuleId,
  severity: FindingSeverity,
  operation: FindingOperation,
  pointer: string,
  title: string,
  detail: string,
  before: unknown,
  after: unknown,
): PendingFinding {
  return {
    ruleId,
    severity,
    operation,
    pointer,
    title,
    detail,
    before,
    after,
  };
}

function stableFindingId(finding: PendingFinding) {
  const identity = {
    ruleId: finding.ruleId,
    operation: finding.operation,
    pointer: finding.pointer,
    before: finding.before,
    after: finding.after,
  };
  return `chg_${createHash("sha256")
    .update(canonicalStringify(identity))
    .digest("hex")
    .slice(0, 16)}`;
}

function compareFindings(
  left: CompatibilityFinding,
  right: CompatibilityFinding,
) {
  return (
    severityOrder[left.severity] - severityOrder[right.severity] ||
    left.operation.path.localeCompare(right.operation.path) ||
    left.operation.method.localeCompare(right.operation.method) ||
    left.pointer.localeCompare(right.pointer) ||
    left.ruleId.localeCompare(right.ruleId)
  );
}

function canonicalStringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  return `{${Object.entries(value as JsonObject)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalStringify(item)}`)
    .join(",")}}`;
}

function asObject(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function stringSet(value: unknown) {
  return new Set(
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [],
  );
}

function escapePointer(value: string) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function formatOperation(operation: FindingOperation) {
  return `${operation.method} ${operation.path}`;
}

function formatValue(value: unknown) {
  return typeof value === "string" ? `\`${value}\`` : canonicalStringify(value);
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
