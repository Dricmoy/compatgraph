import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { POST } from "./route";

const baseline = readFixture("payments-v1.yaml");
const candidate = readFixture("payments-v2.yaml");

describe("POST /api/analyze/preview", () => {
  it("returns compatibility findings for bounded contract input", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze/preview", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "preview-success-test",
        },
        body: JSON.stringify({ baseline, candidate }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        engineVersion: "1",
        compatible: false,
        summary: { breaking: 7, dangerous: 2, safe: 5 },
      },
    });
  });

  it("returns structured errors for invalid requests and contracts", async () => {
    const invalidRequest = await POST(
      new Request("http://localhost/api/analyze/preview", {
        method: "POST",
        headers: { "x-forwarded-for": "preview-invalid-request-test" },
        body: "not-json",
      }),
    );
    const invalidContract = await POST(
      new Request("http://localhost/api/analyze/preview", {
        method: "POST",
        headers: { "x-forwarded-for": "preview-invalid-contract-test" },
        body: JSON.stringify({ baseline: "hello: world", candidate }),
      }),
    );

    expect(invalidRequest.status).toBe(400);
    await expect(invalidRequest.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
    expect(invalidContract.status).toBe(422);
    await expect(invalidContract.json()).resolves.toMatchObject({
      error: { code: "invalid_openapi" },
    });
  });

  it("rejects oversized payloads before parsing", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze/preview", {
        method: "POST",
        headers: { "x-forwarded-for": "preview-payload-test" },
        body: JSON.stringify({
          baseline: "x".repeat(512 * 1024 + 1),
          candidate,
        }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "payload_too_large" },
    });
  });
});

function readFixture(name: string) {
  return readFileSync(
    resolve(process.cwd(), "tests", "fixtures", "openapi", name),
    "utf8",
  );
}
