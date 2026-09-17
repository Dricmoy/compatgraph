import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/analyses", () => {
  it("returns structured validation errors", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: { "x-forwarded-for": "route-validation-test" },
        body: JSON.stringify({ projectSlug: "analysis-lab" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
    expect(response.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.headers.get("x-ratelimit-limit")).toBe("10");
  });

  it("rejects an individually oversized contract", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: { "x-forwarded-for": "route-payload-test" },
        body: JSON.stringify({
          projectSlug: "analysis-lab",
          baseline: "x".repeat(512 * 1024 + 1),
          candidate: "openapi: 3.1.0",
        }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "payload_too_large" },
    });
  });

  it("returns 429 with retry guidance after the public write quota", async () => {
    const identifier = `route-limit-${crypto.randomUUID()}`;
    const responses: Response[] = [];

    for (let requestNumber = 0; requestNumber < 11; requestNumber += 1) {
      responses.push(
        await POST(
          new Request("http://localhost/api/analyses", {
            method: "POST",
            headers: { "x-forwarded-for": identifier },
            body: JSON.stringify({ projectSlug: "analysis-lab" }),
          }),
        ),
      );
    }

    expect(
      responses.slice(0, 10).every((response) => response.status === 400),
    ).toBe(true);
    expect(responses[10]?.status).toBe(429);
    expect(responses[10]?.headers.get("retry-after")).toMatch(/^\d+$/);
  });
});
