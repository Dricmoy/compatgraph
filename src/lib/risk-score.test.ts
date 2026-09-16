import { describe, expect, it } from "vitest";

import { calculateReleaseRisk, riskLabel } from "./risk-score";

describe("release risk", () => {
  it("weights breaking changes and consumer exposure", () => {
    const score = calculateReleaseRisk([
      { severity: "breaking", impactedConsumers: 4 },
      { severity: "dangerous", impactedConsumers: 1 },
      { severity: "safe", impactedConsumers: 12 },
    ]);

    expect(score).toBe(36);
    expect(riskLabel(score)).toBe("moderate");
  });

  it("caps the score at 100", () => {
    const score = calculateReleaseRisk(
      Array.from({ length: 10 }, () => ({
        severity: "breaking" as const,
        impactedConsumers: 8,
      })),
    );

    expect(score).toBe(100);
    expect(riskLabel(score)).toBe("critical");
  });
});
