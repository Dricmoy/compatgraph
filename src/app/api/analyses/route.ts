import { z } from "zod";

import { ContractParseError } from "@/analysis";
import { AnalysisPersistenceError, createAnalysis } from "@/data/analyses";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createRequestContext } from "@/lib/request-context";

const MAX_CONTRACT_BYTES = 512 * 1024;
const MAX_REQUEST_BYTES = MAX_CONTRACT_BYTES * 2 + 16 * 1024;

const createAnalysisSchema = z.object({
  projectSlug: z.string().min(1).max(80),
  baseline: z.string().min(1).max(MAX_CONTRACT_BYTES),
  candidate: z.string().min(1).max(MAX_CONTRACT_BYTES),
});

export async function POST(request: Request) {
  const context = createRequestContext("analysis.create");
  const rateLimit = await enforceRateLimit(request, {
    namespace: "analysis-create",
    limit: 10,
    windowSeconds: 60 * 60,
  });
  const complete = (
    response: Response,
    event: string,
    fields: Record<string, string | number | boolean | null | undefined> = {},
  ) => {
    for (const [key, value] of Object.entries(rateLimitHeaders(rateLimit))) {
      response.headers.set(key, value);
    }
    return context.complete(response, event, fields);
  };

  if (!rateLimit.allowed) {
    const response = errorResponse(
      429,
      "rate_limited",
      "Too many analyses were submitted. Try again after the current window.",
    );
    for (const [key, value] of Object.entries(
      rateLimitHeaders(rateLimit, true),
    )) {
      response.headers.set(key, value);
    }
    return context.complete(response, "analysis.rate_limited");
  }

  const rawBody = await request.text();
  if (byteLength(rawBody) > MAX_REQUEST_BYTES) {
    return complete(
      errorResponse(
        413,
        "payload_too_large",
        "Each OpenAPI contract must be 512 KiB or smaller.",
      ),
      "analysis.rejected",
      { reason: "payload_too_large" },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return complete(
      errorResponse(
        400,
        "invalid_request",
        "The request body must be valid JSON.",
      ),
      "analysis.rejected",
      { reason: "invalid_json" },
    );
  }

  if (
    isContractPayload(body) &&
    (byteLength(body.baseline) > MAX_CONTRACT_BYTES ||
      byteLength(body.candidate) > MAX_CONTRACT_BYTES)
  ) {
    return complete(
      errorResponse(
        413,
        "payload_too_large",
        "Each OpenAPI contract must be 512 KiB or smaller.",
      ),
      "analysis.rejected",
      { reason: "contract_too_large" },
    );
  }

  const parsed = createAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return complete(
      Response.json(
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
      ),
      "analysis.rejected",
      { reason: "invalid_shape" },
    );
  }

  try {
    const result = await createAnalysis({
      projectSlug: parsed.data.projectSlug,
      baselineSource: parsed.data.baseline,
      candidateSource: parsed.data.candidate,
    });
    return complete(
      Response.json(
        {
          data: {
            ...result,
            url: `/releases/${result.releaseId}`,
          },
        },
        { status: result.created ? 201 : 200 },
      ),
      "analysis.completed",
      { created: result.created },
    );
  } catch (error) {
    if (error instanceof ContractParseError) {
      return complete(
        Response.json(
          {
            error: {
              code: error.code,
              message: error.message,
              issues: error.issues,
            },
          },
          { status: 422 },
        ),
        "analysis.rejected",
        { reason: error.code },
      );
    }

    if (error instanceof AnalysisPersistenceError) {
      return complete(
        errorResponse(404, error.code, error.message),
        "analysis.rejected",
        { reason: error.code },
      );
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
