<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CompatGraph repository guidance

Read `docs/exec-plan.md` before changing product scope or architecture, and keep its progress, discoveries, decisions, and outcomes current.

Use the repository-local personal Git identity. This is a public `Dricmoy` project: never introduce Cisco or Splunk code, data, credentials, customer details, internal links, or employer examples.

PostgreSQL is the authoritative application store. Schema definitions live in `src/db/schema.ts`; committed migrations live in `drizzle/`. Generate a new migration after a schema change and never rewrite a migration that may have been applied. Keep seeds idempotent and use stable identifiers. Keep database access behind server-only modules under `src/data` or `src/db`.

Before requesting review, start PostgreSQL, migrate and seed it, then run `pnpm check` and `pnpm test:e2e`. Browser tests must exercise persisted data and `/api/health`, not a fixture-only fallback. Update visible screenshots for material UI changes.
