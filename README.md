# CompatGraph

[![CI](https://github.com/Dricmoy/compatgraph/actions/workflows/ci.yml/badge.svg)](https://github.com/Dricmoy/compatgraph/actions/workflows/ci.yml)

**Change intelligence for APIs.** CompatGraph detects breaking contract changes, maps them to affected consumers, and turns release risk into an auditable migration plan.

CompatGraph is being built in public as a production-grade full-stack and distributed-systems project. The repository intentionally includes the engineering artifacts around the product: focused pull requests, automated quality gates, database migrations, deterministic analysis fixtures, observability, failure tests, and deployment evidence.

## Product direction

A platform team should be able to compare a baseline OpenAPI contract with a candidate, understand every compatibility risk, see which applications and teams are exposed, and coordinate a safe rollout without reconstructing the evidence across repositories and chat threads.

The committed [execution plan](docs/exec-plan.md) is the living specification and milestone record.

## Current milestone

The merged foundation, PostgreSQL, and deterministic-analysis milestones deliver:

- a polished public product experience and realistic release dashboard;
- strict TypeScript, linting, formatting, unit tests, and browser tests;
- reproducible GitHub Actions checks;
- normalized PostgreSQL storage, committed migrations, an idempotent seed, and a database-backed dashboard.
- exact OpenAPI 3.0/3.1 compatibility rules with stable identifiers and fixture coverage.

The active milestone turns those foundations into a complete user workflow: upload or edit two contracts, persist a retry-safe analysis, filter exact findings, and navigate consumer ownership through an interactive impact graph. The repository and callsite evidence remain synthetic; the storage, analysis, and interaction paths are real.

## Local development

Requirements:

- Node.js 22 or newer;
- pnpm 11.4.0, as declared in `package.json`;
- Chromium for browser tests;
- Docker for the PostgreSQL milestone.

Install and run:

```bash
pnpm install --frozen-lockfile
docker compose up -d postgres
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the product page, [http://localhost:3000/analyze](http://localhost:3000/analyze) for the live contract workflow, and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the seeded release dashboard.

Run the full local quality gate:

```bash
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

## Architecture

CompatGraph is a modular Next.js application. Server Components own data access and rendering; small Client Components are added only for interaction. PostgreSQL is the authoritative store for organizations, teams, projects, contracts, releases, changes, consumers, impact edges, and activity. Deterministic contract analysis remains independent of the web framework so it can later run in retry-safe background workers without changing its results.

The preview API accepts two contract strings and returns ordered compatibility findings:

```bash
curl --request POST http://localhost:3000/api/analyze/preview \
  --header 'content-type: application/json' \
  --data-binary @request.json
```

`request.json` has the shape `{ "baseline": "<OpenAPI JSON or YAML>", "candidate": "<OpenAPI JSON or YAML>" }`. Each contract is capped at 512 KiB, and the analyzer never resolves remote references.

See [docs/architecture.md](docs/architecture.md) for the runtime and persistence design, [CONTRIBUTING.md](CONTRIBUTING.md) for the pull-request workflow, and [docs/exec-plan.md](docs/exec-plan.md) for the complete delivery, validation, and recovery contract.

## Status

Active development. The public repository now has a database-backed dashboard, deterministic engine, persisted analysis workflow, and interactive consumer graph. Authentication, repository ingestion, background jobs, telemetry, and production deployment remain.

## License

[MIT](LICENSE)
