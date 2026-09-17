import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/analyses", () => {
  it("returns structured validation errors", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        body: JSON.stringify({ projectSlug: "analysis-lab" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
  });

  it("rejects an individually oversized contract", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
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
});
