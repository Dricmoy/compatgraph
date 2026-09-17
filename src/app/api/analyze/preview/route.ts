import { z } from "zod";

import {
  analyzeContracts,
  ContractParseError,
  parseContract,
} from "@/analysis";

const MAX_CONTRACT_BYTES = 512 * 1024;
const MAX_REQUEST_BYTES = MAX_CONTRACT_BYTES * 2 + 16 * 1024;

const analysisRequestSchema = z.object({
  baseline: z.string().min(1).max(MAX_CONTRACT_BYTES),
  candidate: z.string().min(1).max(MAX_CONTRACT_BYTES),
});

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (byteLength(rawBody) > MAX_REQUEST_BYTES) {
    return Response.json(
      {
        error: {
          code: "payload_too_large",
          message: "Each OpenAPI contract must be 512 KiB or smaller.",
        },
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json(
      {
        error: {
          code: "invalid_request",
          message: "The request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  if (
    isContractPayload(body) &&
    (byteLength(body.baseline) > MAX_CONTRACT_BYTES ||
      byteLength(body.candidate) > MAX_CONTRACT_BYTES)
  ) {
    return Response.json(
      {
        error: {
          code: "payload_too_large",
          message: "Each OpenAPI contract must be 512 KiB or smaller.",
        },
      },
      { status: 413 },
    );
  }

  const requestResult = analysisRequestSchema.safeParse(body);
  if (!requestResult.success) {
    return Response.json(
      {
        error: {
          code: "invalid_request",
          message: "Provide non-empty baseline and candidate contract strings.",
          issues: requestResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  try {
    const baseline = parseContract(requestResult.data.baseline);
    const candidate = parseContract(requestResult.data.candidate);
    return Response.json({ data: analyzeContracts(baseline, candidate) });
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

    throw error;
  }
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
