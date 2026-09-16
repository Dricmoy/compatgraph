export type ChangeSeverity = "breaking" | "dangerous" | "safe";

export type ChangeSummary = {
  severity: ChangeSeverity;
  impactedConsumers: number;
};

const severityWeight: Record<ChangeSeverity, number> = {
  breaking: 18,
  dangerous: 8,
  safe: 0,
};

export function calculateReleaseRisk(changes: ChangeSummary[]): number {
  const score = changes.reduce((total, change) => {
    const exposureMultiplier = 1 + Math.min(change.impactedConsumers, 5) * 0.12;
    return total + severityWeight[change.severity] * exposureMultiplier;
  }, 0);

  return Math.min(100, Math.round(score));
}

export function riskLabel(
  score: number,
): "low" | "moderate" | "high" | "critical" {
  if (score >= 75) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "moderate";
  return "low";
}
