export const severityOrder = {
  breaking: 0,
  dangerous: 1,
  safe: 2,
} as const;

export type FindingSeverity = keyof typeof severityOrder;

export type RuleId =
  | "operation-added"
  | "operation-removed"
  | "request-body-became-required"
  | "request-property-removed"
  | "request-property-became-required"
  | "response-added"
  | "response-removed"
  | "response-property-became-optional"
  | "schema-property-added"
  | "schema-property-removed"
  | "schema-type-changed"
  | "enum-values-added"
  | "enum-values-removed";

export interface FindingOperation {
  method: string;
  path: string;
}

export interface CompatibilityFinding {
  id: string;
  ruleId: RuleId;
  severity: FindingSeverity;
  operation: FindingOperation;
  pointer: string;
  title: string;
  detail: string;
  before: unknown;
  after: unknown;
}

export interface AnalysisSummary {
  breaking: number;
  dangerous: number;
  safe: number;
}

export interface AnalysisResult {
  engineVersion: "1";
  compatible: boolean;
  findings: CompatibilityFinding[];
  summary: AnalysisSummary;
}

export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    [key: string]: unknown;
  };
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
