import "server-only";

import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

let sqlClient: Sql | undefined;
let database: Database | undefined;

export function getDatabase(): Database {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Start local PostgreSQL and copy .env.example to .env.",
    );
  }

  sqlClient = postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    prepare: false,
  });
  database = drizzle(sqlClient, { schema });
  return database;
}

export async function pingDatabase(): Promise<number> {
  const startedAt = performance.now();
  const client = getDatabase();
  await client.execute(sql`select 1`);
  return Math.round(performance.now() - startedAt);
}
