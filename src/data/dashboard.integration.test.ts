import { describe, expect, it } from "vitest";

import { getLatestReleaseDashboard, releaseExists } from "./dashboard";

describe("database-backed release dashboard", () => {
  it("loads the seeded release and its normalized impact data", async () => {
    const dashboard = await getLatestReleaseDashboard("payments-api");

    expect(dashboard).toMatchObject({
      organization: "Acme Platform",
      service: "Payments API",
      baseline: "v2.8.0",
      candidate: "v3.0.0",
      status: "blocked",
      score: 78,
      findings: 12,
      consumers: 8,
      consumerKindCounts: { application: 3, worker: 3, sdk: 2 },
      owners: 5,
      severityCounts: { breaking: 3, dangerous: 2, safe: 7 },
    });
    expect(dashboard.priorityChanges[0]?.id).toBe("chg_1042");
    expect(dashboard.priorityChanges[0]?.consumers).toHaveLength(3);
    expect(dashboard.priorityChanges[0]?.consumers).toEqual(
      expect.arrayContaining(["checkout-web", "billing-worker", "partner-sdk"]),
    );
    expect(dashboard.activity.at(-1)?.time).toBe("Now");
  });

  it("reports whether a blocked release exists", async () => {
    await expect(releaseExists("payments-api")).resolves.toBe(true);
    await expect(releaseExists("missing-project")).resolves.toBe(false);
  });
});
