import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { enforceRateLimit, rateLimitHeaders } from "./rate-limit";

describe("PostgreSQL-backed rate limiting", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("atomically admits only the configured number of parallel requests", async () => {
    const identifier = `test-${randomUUID()}`;
    const request = new Request("http://localhost/api/analyses", {
      headers: { "x-forwarded-for": identifier },
    });
    const policy = {
      namespace: "integration-test",
      limit: 2,
      windowSeconds: 60,
    };

    const results = await Promise.all([
      enforceRateLimit(request, policy),
      enforceRateLimit(request, policy),
      enforceRateLimit(request, policy),
    ]);

    expect(results.filter((result) => result.allowed)).toHaveLength(2);
    expect(results.filter((result) => !result.allowed)).toHaveLength(1);
    expect(
      rateLimitHeaders(
        results.find((result) => !result.allowed)!,
        true,
      ),
    ).toMatchObject({
      "x-ratelimit-limit": "2",
      "x-ratelimit-remaining": "0",
      "retry-after": expect.any(String),
    });
  });

  it("fails closed when the privacy salt is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_SALT", "");

    await expect(
      enforceRateLimit(
        new Request("https://compatgraph.example/api/analyses"),
        {
          namespace: "production-test",
          limit: 1,
          windowSeconds: 60,
        },
      ),
    ).rejects.toThrow("RATE_LIMIT_SALT must be configured in production");
  });
});
