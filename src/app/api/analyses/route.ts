import { z } from "zod";

import { ContractParseError } from "@/analysis";
import { AnalysisPersistenceError, createAnalysis } from "@/data/analyses";

const MAX_CONTRACT_BYTES = 512 * 1024;
const MAX_REQUEST_BYTES = MAX_CONTRACT_BYTES * 2 + 16 * 1024;

const createAnalysisSchema = z.object({
  projectSlug: z.string().min(1).max(80),
  baseline: z.string().min(1).max(MAX_CONTRACT_BYTES),
  candidate: z.string().min(1).max(MAX_CONTRACT_BYTES),
});

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (byteLength(rawBody) > MAX_REQUEST_BYTES) {
    return errorResponse(
      413,
      "payload_too_large",
      "Each OpenAPI contract must be 512 KiB or smaller.",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "The request body must be valid JSON.",
    );
  }

  if (
    isContractPayload(body) &&
    (byteLength(body.baseline) > MAX_CONTRACT_BYTES ||
      byteLength(body.candidate) > MAX_CONTRACT_BYTES)
  ) {
    return errorResponse(
      413,
      "payload_too_large",
      "Each OpenAPI contract must be 512 KiB or smaller.",
    );
  }

  const parsed = createAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "invalid_request",
          message: "Provide a project and two non-empty contract strings.",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await createAnalysis({
      projectSlug: parsed.data.projectSlug,
      baselineSource: parsed.data.baseline,
      candidateSource: parsed.data.candidate,
    });
    return Response.json(
      {
        data: {
          ...result,
          url: `/releases/${result.releaseId}`,
        },
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof ContractParseError) {
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message,
            issues: error.issues,
          },
        },
        { status: 422 },
      );
    }

    if (error instanceof AnalysisPersistenceError) {
      return errorResponse(404, error.code, error.message);
    }

    throw error;
  }
}

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function isContractPayload(
  value: unknown,
): value is { baseline: string; candidate: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "baseline" in value &&
    "candidate" in value &&
    typeof value.baseline === "string" &&
    typeof value.candidate === "string"
  );
}
