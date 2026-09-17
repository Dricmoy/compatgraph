import { beforeEach, describe, expect, it, vi } from "vitest";

import { pingDatabase } from "@/db/client";

import { GET } from "./route";

vi.mock("@/db/client", () => ({
  pingDatabase: vi.fn(),
}));

const mockedPingDatabase = vi.mocked(pingDatabase);

describe("GET /api/health", () => {
  beforeEach(() => {
    mockedPingDatabase.mockReset();
  });

  it("reports the database latency and deployment revision", async () => {
    mockedPingDatabase.mockResolvedValue(12);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.headers.get("server-timing")).toMatch(/^app;dur=\d+$/);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      database: "connected",
      databaseLatencyMs: 12,
      revision: "local",
    });
  });

  it("fails readiness closed when PostgreSQL is unavailable", async () => {
    mockedPingDatabase.mockRejectedValue(new Error("simulated outage"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      database: "unavailable",
    });
  });
});
