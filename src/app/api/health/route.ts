import { NextResponse } from "next/server";

import { pingDatabase } from "@/db/client";
import { createRequestContext } from "@/lib/request-context";

export async function GET() {
  const context = createRequestContext("health.readiness");
  try {
    const databaseLatencyMs = await pingDatabase();
    return context.complete(
      NextResponse.json({
        status: "ok",
        database: "connected",
        databaseLatencyMs,
        revision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      }),
      "health.ready",
      { databaseLatencyMs },
    );
  } catch {
    return context.complete(
      NextResponse.json(
        { status: "error", database: "unavailable" },
        { status: 503 },
      ),
      "health.unavailable",
    );
  }
}
