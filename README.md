# CompatGraph

[![CI](https://github.com/Dricmoy/compatgraph/actions/workflows/ci.yml/badge.svg)](https://github.com/Dricmoy/compatgraph/actions/workflows/ci.yml)
[![Security](https://github.com/Dricmoy/compatgraph/actions/workflows/security.yml/badge.svg)](https://github.com/Dricmoy/compatgraph/actions/workflows/security.yml)

[Open the live product](https://compatgraph.vercel.app) · [Run a contract analysis](https://compatgraph.vercel.app/analyze) · [Inspect the architecture](docs/architecture.md)

**Change intelligence for APIs.** CompatGraph detects breaking contract changes, maps them to affected consumers, and turns release risk into an auditable migration plan.

CompatGraph is being built in public as a production-grade full-stack and distributed-systems project. The repository intentionally includes the engineering artifacts around the product: focused pull requests, automated quality gates, database migrations, deterministic analysis fixtures, observability, failure tests, and deployment evidence.

## Product direction

A platform team should be able to compare a baseline OpenAPI contract with a candidate, understand every compatibility risk, see which applications and teams are exposed, and coordinate a safe rollout without reconstructing the evidence across repositories and chat threads.

The committed [execution plan](docs/exec-plan.md) is the living specification and milestone record.

## Production release

The public release delivers:

- a polished public product experience and realistic release dashboard;
- strict TypeScript, linting, formatting, unit tests, and browser tests;
- required GitHub Actions quality, browser, dependency, and CodeQL gates;
- managed Neon PostgreSQL with committed migrations and an idempotent seed;
- exact OpenAPI 3.0/3.1 compatibility rules with stable evidence;
- retry-safe saved analyses, consumer ownership mapping, and an interactive impact graph;
- privacy-preserving database rate limits, correlation logs, OpenTelemetry traces, security headers, performance budgets, a threat model, and a rollback runbook;
- automatic Vercel preview and production deployments from `Dricmoy/compatgraph`.

The repository and callsite evidence are synthetic demonstration data. The storage, analysis, rate-limiting, observability, deployment, and interaction paths are real.

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

Operational evidence lives in [docs/benchmarks.md](docs/benchmarks.md), [docs/threat-model.md](docs/threat-model.md), and [docs/runbook.md](docs/runbook.md).

## Status

Public production beta. [CompatGraph](https://compatgraph.vercel.app) runs on Vercel with managed Neon PostgreSQL, automatic Git deployments, and a protected `main` branch. Authentication, live repository ingestion, and durable background jobs remain roadmap work rather than simulated features.

## License

[MIT](LICENSE)
