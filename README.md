# CompatGraph

[![CI](https://github.com/Dricmoy/compatgraph/actions/workflows/ci.yml/badge.svg)](https://github.com/Dricmoy/compatgraph/actions/workflows/ci.yml)

**Change intelligence for APIs.** CompatGraph detects breaking contract changes, maps them to affected consumers, and turns release risk into an auditable migration plan.

CompatGraph is being built in public as a production-grade full-stack and distributed-systems project. The repository intentionally includes the engineering artifacts around the product: focused pull requests, automated quality gates, database migrations, deterministic analysis fixtures, observability, failure tests, and deployment evidence.

## Product direction

A platform team should be able to compare a baseline OpenAPI contract with a candidate, understand every compatibility risk, see which applications and teams are exposed, and coordinate a safe rollout without reconstructing the evidence across repositories and chat threads.

The committed [execution plan](docs/exec-plan.md) is the living specification and milestone record.

## Current milestone

The merged foundation delivers:

- a polished public product experience and realistic release dashboard;
- strict TypeScript, linting, formatting, unit tests, and browser tests;
- reproducible GitHub Actions checks;
- an incremental plan for PostgreSQL, deterministic OpenAPI analysis, consumer impact mapping, GitHub integration, telemetry, and production deployment.

The active milestone replaces in-memory dashboard fixtures with normalized PostgreSQL records, committed migrations, and an idempotent demonstration seed. The demonstration remains synthetic; the storage and query path are real.

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

Open [http://localhost:3000](http://localhost:3000) for the product page and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the release dashboard.

Run the full local quality gate:

```bash
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

## Architecture

CompatGraph is a modular Next.js application. Server Components own data access and rendering; small Client Components are added only for interaction. PostgreSQL is the authoritative store for organizations, teams, projects, contracts, releases, changes, consumers, impact edges, and activity. Deterministic contract analysis remains independent of the web framework so it can later run in retry-safe background workers without changing its results.

See [docs/architecture.md](docs/architecture.md) for the runtime and persistence design, [CONTRIBUTING.md](CONTRIBUTING.md) for the pull-request workflow, and [docs/exec-plan.md](docs/exec-plan.md) for the complete delivery, validation, and recovery contract.

## Status

Active development. The public repository and database-backed dashboard exist, but contract upload, deterministic analysis, authentication, and production deployment are not complete yet.

## License

[MIT](LICENSE)
