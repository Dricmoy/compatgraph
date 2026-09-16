import type { ChangeSeverity } from "./risk-score";

export const releaseOverview = {
  service: "Payments API",
  baseline: "v2.8.0",
  candidate: "v3.0.0",
  score: 78,
  findings: 12,
  consumers: 8,
  owners: 5,
};

export const changes: Array<{
  id: string;
  severity: ChangeSeverity;
  method: string;
  path: string;
  title: string;
  detail: string;
  consumers: string[];
}> = [
  {
    id: "CHG-1042",
    severity: "breaking",
    method: "POST",
    path: "/v1/payment_intents",
    title: "currency is now required",
    detail: "Request body changed from optional to required at #/currency.",
    consumers: ["checkout-web", "billing-worker", "partner-sdk"],
  },
  {
    id: "CHG-1045",
    severity: "breaking",
    method: "GET",
    path: "/v1/customers/{id}",
    title: "legacy_status was removed",
    detail: "Response consumers still read this field in two active releases.",
    consumers: ["customer-portal", "support-console"],
  },
  {
    id: "CHG-1051",
    severity: "dangerous",
    method: "POST",
    path: "/v1/refunds",
    title: "reason enum narrowed",
    detail: "Two previously accepted enum values are no longer valid.",
    consumers: ["refund-orchestrator"],
  },
];

export const activity = [
  { label: "Candidate contract uploaded", actor: "Maya Chen", time: "2m" },
  { label: "12 changes classified", actor: "Analyzer", time: "2m" },
  { label: "8 consumers matched", actor: "Impact mapper", time: "1m" },
  { label: "Migration review requested", actor: "Maya Chen", time: "Now" },
];
