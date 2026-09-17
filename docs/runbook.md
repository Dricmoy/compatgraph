# CompatGraph operations runbook

## Service signals

`GET /api/health` is the readiness probe. A 200 response proves that the web process can execute a PostgreSQL query and reports `databaseLatencyMs`, a short deployment revision, and an `x-request-id`. A 503 response means the application must not receive write traffic.

Every API response includes `x-request-id` and `server-timing`. Structured server logs use JSON with `service`, `event`, `operation`, `status`, `durationMs`, request ID, and active OpenTelemetry trace ID. Contract bodies and raw client addresses must never be added to these records.

## Deploy

Required provider variables:

- `DATABASE_URL`: pooled, TLS-enabled managed PostgreSQL connection string;
- `RATE_LIMIT_SALT`: at least 32 random bytes, stored only in the hosting provider;
- `OTEL_EXPORTER_OTLP_ENDPOINT` and exporter credentials only when traces are sent outside Vercel's native collector.

Deployment sequence:

1. Create a managed PostgreSQL database in the same general region as the web runtime.
2. Add `DATABASE_URL` and `RATE_LIMIT_SALT` to preview and production provider environments without writing them to a file or command transcript.
3. Run `pnpm install --frozen-lockfile`, `pnpm db:migrate`, and `pnpm db:seed` against the managed database from an authorized environment.
4. Deploy the immutable Git commit through Vercel.
5. Run `pnpm smoke:production -- https://deployment.example` and record the URL, revision, and result in `docs/exec-plan.md`.

Migrations run before the new application receives traffic. Every schema change must remain compatible with the prior application revision for the rollback window.

## Rollback

Roll the web service back to the provider's prior immutable deployment. Do not delete tables, edit migration history, or reverse an applied migration during the incident. If the prior application is not forward-compatible with the new schema, deploy a small compatibility fix or forward corrective migration.

After rollback, verify `/api/health`, the landing page, a stored release page, and a read-only preview. Preserve the failed deployment logs and trace ID for the incident record.

## Incident: database unavailable

1. Confirm `/api/health` returns 503 from outside the provider network.
2. Check managed PostgreSQL availability, connection limits, TLS configuration, and credential expiry.
3. Stop repeated write probes; the application intentionally fails closed.
4. Restore connectivity or roll back the web deployment if a connection configuration changed.
5. Verify one `SELECT 1` health call, then a saved-release read, before reopening analysis writes.

## Incident: analysis abuse or cost spike

1. Query structured logs for `analysis.rate_limited` and group counts by deployment, never by raw address.
2. Confirm rate-limit rows are advancing atomically and PostgreSQL latency remains healthy.
3. Reduce public limits or add a provider WAF rule if traffic is distributed.
4. Rotate `RATE_LIMIT_SALT` only if the hashed identifiers may have been exposed; rotation resets all active buckets.
5. Record the trigger, mitigation, and any false-positive impact under `docs/incidents/`.

## Recovery exercise

The minimum rehearsal creates an empty temporary database, applies all committed migrations, runs the seed twice, runs integration tests, restarts the Next.js process, and reloads a previously created release. The temporary database is removed after the result is recorded.

The first fault-injection result is recorded in `docs/incidents/2026-09-17-database-readiness-rehearsal.md`. Its automated test proves that a lost database dependency removes the service from readiness with a bounded 503 response and that the healthy path recovers without a state mutation.
