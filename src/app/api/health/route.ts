import { NextResponse } from "next/server";

import { pingDatabase } from "@/db/client";

export async function GET() {
  try {
    const databaseLatencyMs = await pingDatabase();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      databaseLatencyMs,
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}
