import "server-only";

import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { rateLimitBuckets } from "@/db/schema";

export interface RateLimitPolicy {
  namespace: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export async function enforceRateLimit(
  request: Request,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const now = new Date();
  const key = `${policy.namespace}:${hashIdentifier(clientIdentifier(request))}`;
  const db = getDatabase();
  const [bucket] = await db
    .insert(rateLimitBuckets)
    .values({
      key,
      windowStartedAt: now,
      requestCount: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: rateLimitBuckets.key,
      set: {
        requestCount: sql<number>`case
          when ${rateLimitBuckets.windowStartedAt} <= now() - (${policy.windowSeconds} * interval '1 second')
          then 1
          else ${rateLimitBuckets.requestCount} + 1
        end`,
        windowStartedAt: sql<Date>`case
          when ${rateLimitBuckets.windowStartedAt} <= now() - (${policy.windowSeconds} * interval '1 second')
          then now()
          else ${rateLimitBuckets.windowStartedAt}
        end`,
        updatedAt: sql`now()`,
      },
    })
    .returning({
      requestCount: rateLimitBuckets.requestCount,
      windowStartedAt: rateLimitBuckets.windowStartedAt,
    });

  if (!bucket) throw new Error("Rate limit bucket was not returned.");

  const elapsedSeconds = Math.floor(
    (now.getTime() - bucket.windowStartedAt.getTime()) / 1_000,
  );
  return {
    allowed: bucket.requestCount <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - bucket.requestCount),
    retryAfterSeconds: Math.max(1, policy.windowSeconds - elapsedSeconds),
  };
}

export function rateLimitHeaders(
  result: RateLimitResult,
  includeRetryAfter = false,
) {
  return {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    ...(includeRetryAfter
      ? { "retry-after": String(result.retryAfterSeconds) }
      : {}),
  };
}

function clientIdentifier(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local-development"
  );
}

function hashIdentifier(identifier: string) {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt && process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_SALT must be configured in production.");
  }
  return createHash("sha256")
    .update(`${salt ?? "compatgraph-development-only"}:${identifier}`)
    .digest("hex");
}
