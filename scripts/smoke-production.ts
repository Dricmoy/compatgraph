import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

const rawBaseUrl = process.argv.slice(2).find((argument) => argument !== "--");
if (!rawBaseUrl) {
  throw new Error("Usage: pnpm smoke:production -- https://deployment.example");
}

const baseUrl = new URL(rawBaseUrl);
if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
  throw new Error("Production smoke targets must use HTTPS.");
}

const fixtureDirectory = resolve(process.cwd(), "tests", "fixtures", "openapi");
const [baseline, candidate] = await Promise.all([
  readFile(resolve(fixtureDirectory, "payments-v1.yaml"), "utf8"),
  readFile(resolve(fixtureDirectory, "payments-v2.yaml"), "utf8"),
]);

const landing = await timedFetch(new URL("/", baseUrl));
assert(
  landing.response.ok,
  `Landing page returned ${landing.response.status}.`,
);
assert(
  landing.response.headers
    .get("content-security-policy")
    ?.includes("frame-ancestors 'none'") === true,
  "Landing page is missing the expected CSP.",
);

const health = await timedFetch(new URL("/api/health", baseUrl));
const healthBody = (await health.response.json()) as {
  status?: string;
  database?: string;
  revision?: string;
};
assert(
  health.response.ok,
  `Health endpoint returned ${health.response.status}.`,
);
assert(
  healthBody.database === "connected",
  "Managed database is not connected.",
);
assert(
  Boolean(health.response.headers.get("x-request-id")),
  "Health response has no correlation identifier.",
);

const preview = await timedFetch(new URL("/api/analyze/preview", baseUrl), {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ baseline, candidate }),
});
const previewBody = (await preview.response.json()) as {
  data?: { summary?: { breaking?: number; dangerous?: number; safe?: number } };
};
assert(
  preview.response.ok,
  `Preview endpoint returned ${preview.response.status}.`,
);
assert(
  previewBody.data?.summary?.breaking === 7 &&
    previewBody.data.summary.dangerous === 2 &&
    previewBody.data.summary.safe === 5,
  "Preview result does not match the committed fixture contract.",
);

console.info(
  JSON.stringify(
    {
      target: baseUrl.origin,
      revision: healthBody.revision ?? "unknown",
      landingMs: landing.durationMs,
      healthMs: health.durationMs,
      previewMs: preview.durationMs,
      status: "passed",
    },
    null,
    2,
  ),
);

async function timedFetch(url: URL, init?: RequestInit) {
  const startedAt = performance.now();
  const response = await fetch(url, init);
  return {
    response,
    durationMs: Math.round(performance.now() - startedAt),
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
