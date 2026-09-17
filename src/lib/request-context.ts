import { randomUUID } from "node:crypto";

import { trace } from "@opentelemetry/api";

type LogValue = string | number | boolean | null | undefined;

export function createRequestContext(operation: string) {
  const requestId = randomUUID();
  const startedAt = performance.now();

  return {
    requestId,
    complete(
      response: Response,
      event: string,
      fields: Record<string, LogValue> = {},
    ) {
      const durationMs = Math.round(performance.now() - startedAt);
      response.headers.set("x-request-id", requestId);
      response.headers.set("server-timing", `app;dur=${durationMs}`);
      structuredLog(event, {
        operation,
        requestId,
        status: response.status,
        durationMs,
        traceId: trace.getActiveSpan()?.spanContext().traceId,
        ...fields,
      });
      return response;
    },
  };
}

export function structuredLog(
  event: string,
  fields: Record<string, LogValue> = {},
) {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "compatgraph",
      event,
      ...fields,
    }),
  );
}
