# Build CompatGraph as a production-grade API change intelligence platform

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with the ExecPlan requirements and guidelines in the `execution-plan` skill.

## Purpose / Big Picture

CompatGraph helps platform teams understand whether an API release is safe before it reaches customers. A user supplies a baseline OpenAPI contract and a proposed contract, sees deterministic breaking-change findings, understands which consumer services are exposed, and follows an auditable migration workflow. The finished product must be publicly accessible, backed by a real PostgreSQL database, developed through focused pull requests, and continuously verified by GitHub Actions.

The first public demonstration will use a realistic payments API. It will show a release moving from a detected breaking change, through impact analysis, to a safe migration plan. A visitor must be able to understand the system without an account; authenticated project ownership and GitHub installation are later milestones.

## Progress

- [x] (2026-09-16 23:20Z) Created the public `Dricmoy/compatgraph` repository and configured a repository-local personal Git identity.
- [x] (2026-09-16 23:28Z) Generated the Next.js 16, React 19, TypeScript, and Tailwind foundation on `feat/foundation`.
- [x] (2026-09-16 23:38Z) Delivered and merged pull request 2 with the branded public experience, sample dashboard, engineering standards, tests, and two green GitHub Actions checks; issue 1 closed automatically.
- [x] (2026-09-17 00:18Z) Delivered and merged pull request 4 with PostgreSQL 17, Drizzle migrations, idempotent demonstration data, database-backed dashboard queries, integration coverage, and database-enabled CI.
- [x] (2026-09-17 04:50Z) Delivered and merged pull request 6 with deterministic OpenAPI 3.0/3.1 parsing, direction-aware compatibility rules, stable findings, a bounded preview endpoint, and a versioned fixture corpus.
- [x] (2026-09-17 05:14Z) Delivered and merged pull request 8 with persisted idempotent analyses, operation-level consumer mapping, a polished comparison editor, and an interactive reload-safe release workspace.
- [ ] Deliver authentication, GitHub repository connection, and background analysis jobs.
- [x] (2026-09-17 05:30Z) Delivered and merged pull request 10 with OpenTelemetry, privacy-preserving distributed rate limits, structured correlation logs, security headers, CodeQL, dependency review, performance budgets, and a database-readiness failure rehearsal.
- [x] (2026-09-17 05:37Z) Provisioned managed Neon PostgreSQL, applied migrations, proved the seed idempotent, stored provider secrets, deployed Vercel revision `0cd2c40`, and passed the external production smoke at `https://compatgraph.vercel.app`.
- [x] (2026-09-17 05:43Z) Connected automatic Git deployments and protected `main` with strict required checks, linear history, resolved conversations, and force-push and deletion prevention.
- [x] (2026-09-17 05:58Z) Completed the final acceptance audit through pull request 18 and issue 17: the protected Git deployment is co-located in `pdx1`, public smoke passed, the persisted release survived deployment, Lighthouse scored 100 in all four categories, and Dependabot reported zero open alerts.

## Surprises & Discoveries

- Observation: The first product name, SpecLoom, is already used by an active developer tool and public website.
  Evidence: Live search on 2026-09-16 found `specloom.tech` and a public `kpruntov/SpecLoom` repository.
- Observation: GitHub CLI was authenticated as `Dricmoy`, but the account's configured SSH transport did not have a usable personal key on this host.
  Evidence: The initial clone returned `git@github.com: Permission denied (publickey)`; HTTPS cloning with the GitHub credential helper succeeded.
- Observation: Enabling the stable React Compiler option in Next.js 16 still requires an explicit `babel-plugin-react-compiler` development dependency.
  Evidence: The first production build failed while resolving the compiler package; after adding version 1.0.0, `pnpm check` completed successfully.
- Observation: Vitest includes all matching test files unless browser tests are explicitly excluded.
  Evidence: The first unit run attempted to execute `tests/e2e/product.spec.ts`; adding that directory to `vitest.config.ts` produced one passing unit suite while Playwright separately reported two passing browser tests.
- Observation: The Next.js `server-only` package intentionally throws in a generic Vitest runtime even when the imported module is conceptually server code.
  Evidence: The first database integration run failed at `server-only/index.js`; a test-only empty alias preserves the production boundary while allowing direct server query tests.
- Observation: The first production deployment defaulted Vercel Functions to `iad1` while the managed Neon database was provisioned in `pdx1`.
  Evidence: Vercel inspection reported `iad1`, while two external health requests took 1.1–1.5 seconds. The launch candidate now pins functions to `pdx1` and keeps the latency mismatch visible in the benchmark record.

## Decision Log

- Decision: Use the product name CompatGraph and repository `Dricmoy/compatgraph`.
  Rationale: It directly communicates compatibility plus dependency relationships, is available in the user's GitHub namespace, and avoids the active SpecLoom name.
  Date/Author: 2026-09-16 / Codex
- Decision: Build a modular Next.js application before extracting background workers or services.
  Rationale: A single deployable keeps the first end-to-end experience coherent. Queue workers will be separated only when durable asynchronous execution exists and can be measured.
  Date/Author: 2026-09-16 / Codex
- Decision: Use PostgreSQL as the authoritative store and keep analysis deterministic before adding model-assisted migrations.
  Rationale: Contract compatibility must be reproducible and explainable. AI can propose code changes later, but it must not decide whether an API change is breaking.
  Date/Author: 2026-09-16 / Codex
- Decision: Develop through milestone pull requests with required automated checks.
  Rationale: The repository itself must demonstrate professional engineering workflow, not only a polished final screenshot.
  Date/Author: 2026-09-16 / Codex
- Decision: Normalize ownership and impact instead of storing dashboard-shaped JSON.
  Rationale: Separate organization, team, project, contract, release, change, consumer, impact-edge, and activity tables make referential integrity and future ingestion behavior observable while keeping the read model assembled in one server-only query boundary.
  Date/Author: 2026-09-16 / Codex
- Decision: Classify enum compatibility by data direction.
  Rationale: Removing an accepted request value breaks existing callers, while adding a possible response value can surprise clients with exhaustive enum handling. Direction-aware rules describe actual consumer risk more accurately than a syntax-only diff.
  Date/Author: 2026-09-17 / Codex
- Decision: Enforce public write quotas in PostgreSQL and hash client identifiers before storage.
  Rationale: A process-local limiter does not survive serverless scaling, while raw network identifiers are unnecessary for quota enforcement. Atomic upserts give every instance one shared decision without turning rate-limit data into user analytics.
  Date/Author: 2026-09-17 / Codex
- Decision: Deploy Vercel Functions and managed Neon PostgreSQL together in `pdx1`.
  Rationale: Portland is the closest supported Neon region to the primary Edmonton test location, and co-location avoids making every database-backed request cross the continent.
  Date/Author: 2026-09-17 / Codex

## Outcomes & Retrospective

The launch scope is complete with six focused, reviewed pull requests and green required checks. The public product is live on Vercel with managed Neon PostgreSQL, provider-owned secrets, traces, abuse controls, automatic Git deployments, and a required deployment gate. A production analysis created a 14-finding release with six exposed consumers and reloaded from PostgreSQL before and after the final deployment. The final public audit scored 100 for performance, accessibility, best practices, and SEO. Authentication, repository ingestion, and durable workers remain explicit roadmap scope rather than simulated launch claims.

## Context and Orientation

The repository is a new Next.js App Router project. `src/app` owns routes and shared layouts. Pages and layouts are server-rendered by default; a component receives the `"use client"` directive only when it requires state, event handlers, or browser APIs. `src/components` holds reusable presentation components. `src/lib` holds framework-independent product logic and, after the database milestone, a server-only data-access layer. `tests/e2e` contains browser journeys. `.github/workflows` contains GitHub Actions.

An API contract is a machine-readable description such as an OpenAPI document. A breaking change is a modification that can cause an existing client to stop working, such as removing a response field or making an optional request property required. A consumer is an application that calls the API. An impact edge connects one breaking change to one consumer usage. PostgreSQL will be the authoritative database, meaning no in-memory fixture may be the source for production dashboard state after milestone 2.

## Plan of Work

Milestone 1 establishes the product promise and engineering baseline. Replace the generated template with the CompatGraph landing page and a realistic dashboard at `src/app/dashboard/page.tsx`. Keep the sample data in `src/lib/demo-data.ts` so milestone 2 can replace one boundary with database queries. Add type checking, Vitest unit tests, Playwright browser tests, formatting, contribution guidance, pull-request templates, and a CI workflow. Acceptance is a green local `pnpm check`, a passing browser smoke test, and a merged pull request.

Milestone 2 adds a local PostgreSQL service through `compose.yaml`, Drizzle schema and migrations under `src/db`, a seed script, and server-only queries under `src/data`. Model organizations, projects, API specifications, releases, changes, consumers, impact edges, and activity events. Replace the dashboard fixtures with database results. Acceptance is a clean migration against an empty database, an idempotent seed, unit tests for queries, and the same browser journey reading persisted data.

Milestone 3 adds deterministic OpenAPI analysis under `src/analysis`. Parse OpenAPI 3.0 and 3.1 JSON or YAML, normalize paths and schemas, and classify additions, removals, required-property changes, type changes, enum narrowing, and response changes. Every finding must include a stable identifier, severity, JSON pointer, before value, after value, and human explanation. Acceptance is a versioned fixture corpus and exact test results with no model or network dependency.

Milestone 4 persists analyses and exposes the consumer impact graph. Add upload and comparison forms, server-side validation, analysis status, filtering, graph navigation, and a release detail page. A change must be traceable to consumers and owners. Acceptance is an end-to-end test that uploads two contracts, produces known findings, links affected consumers, and preserves the result after a restart.

Milestone 5 adds user and GitHub integration. Authenticate with GitHub, authorize every project operation, install a GitHub App or OAuth integration, ingest selected repository metadata, and enqueue analyses without holding an HTTP request open. Acceptance includes authorization tests, webhook signature validation, idempotent delivery handling, retry behavior, and an audit trail.

Milestone 6 adds production evidence. Instrument web requests, database calls, and analysis jobs with OpenTelemetry; add structured logs, rate limits, security headers, dependency scanning, CodeQL, measured performance budgets, and failure injection. Publish architecture decisions, a threat model, benchmark results, and a deliberately exercised incident retrospective.

The deployment milestone provisions managed PostgreSQL and a public Next.js-compatible runtime, stores secrets only in the hosting provider, runs migrations, seeds the public demonstration, and verifies health and product behavior from outside the local machine. The final repository must show green required checks and documented recovery steps.

## Concrete Steps

Work from `/Users/dricmoybhattacharjee/Desktop/compatgraph`. For each milestone, start from current `main`, create a focused branch, implement and validate, push to `Dricmoy/compatgraph`, open a pull request that closes its issue, wait for required checks, review the diff, then merge before starting the next branch.

For milestone 1, run:

    pnpm install --frozen-lockfile
    pnpm check
    pnpm exec playwright install chromium
    pnpm test:e2e

The first command must reproduce dependencies from `pnpm-lock.yaml`. `pnpm check` must report successful formatting, lint, type checking, unit tests, and production build. The Playwright command must report all product journeys passing in Chromium.

For database milestones, start PostgreSQL with:

    docker compose up -d postgres

The commands now exist and are:

    cp .env.example .env
    pnpm db:migrate
    pnpm db:seed

`pnpm db:migrate` applies committed SQL under `drizzle/`. `pnpm db:seed` upserts the synthetic Acme Platform demonstration and is expected to print `Seeded the CompatGraph demonstration workspace.` on every safe rerun.

## Validation and Acceptance

The v1 launch is complete only when all of the following are directly observed. The public URL loads without authentication and explains CompatGraph. The demonstration dashboard reads PostgreSQL-backed releases and findings. Uploading two supported OpenAPI contracts creates a persisted analysis with deterministic breaking-change findings. An impact view links at least one finding to a consumer and owner. Restarting or redeploying the application does not lose data. GitHub Actions validates formatting, lint, types, unit tests, integration tests, browser tests, build, dependency review, code scanning, and the hosted deployment. Pull requests contain focused descriptions and evidence. The production environment exposes a health endpoint, emits traces, uses non-repository secrets, and has documented migration and rollback procedures.

Quality acceptance includes keyboard navigation, visible focus states, semantic landmarks, responsive layouts at 390, 768, and 1440 pixel widths, no serious automated accessibility findings, and a Lighthouse performance result recorded for the deployed public pages. V1 systems acceptance includes idempotent analysis requests, shared atomic rate limiting, database constraints, migration reproducibility, correlation-aware telemetry, and a failure test showing database-readiness recovery without state mutation. Duplicate webhook handling, durable job retries, and interrupted-worker recovery become required when the roadmap GitHub and worker milestone is implemented.

## Idempotence and Recovery

Package installation, formatting, tests, migrations, and seed commands must be safe to repeat. Database migrations are additive and committed; never edit an applied production migration. Seed rows use stable identifiers and upserts. Webhook deliveries have unique provider identifiers. Analysis jobs have idempotency keys derived from project and contract hashes. Deployment rollback uses the hosting provider's immutable prior build while database changes remain backward compatible for at least one release.

If a pull request fails, amend the same branch and preserve the check history. If deployment fails after a migration, restore the previous application build rather than destructively reverting the database. Secrets must never appear in logs, commits, screenshots, or pull-request text.

## Artifacts and Notes

Authoritative project artifacts will include `README.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/benchmarks.md`, and `docs/incidents/`. Short verification transcripts and production URLs will be added here as they exist.

Current remote evidence:

    repository: https://github.com/Dricmoy/compatgraph
    production: https://compatgraph.vercel.app
    default branch: main
    visibility: public
    automatic deployments: connected to Dricmoy/compatgraph
    branch protection: strict required checks, linear history, resolved conversations, no force pushes or deletion
    required checks: Quality and build, Browser smoke tests, Dependency review, CodeQL, Vercel

Local milestone 1 evidence:

    pnpm check: passed on 2026-09-16
    vitest: 1 file, 2 tests passed
    next build: / and /dashboard statically rendered
    playwright: 2 Chromium tests passed in 5.2 seconds
    pull request 2: merged at commit d6fb59d055691b5b9b64370b247cfe1c9034c283
    hosted quality/build: passed in 1 minute 12 seconds
    hosted browser smoke tests: passed in 44 seconds

Milestone 2 evidence:

    migration: succeeded from an empty PostgreSQL 17 volume
    seed: succeeded twice without duplicate rows
    vitest: 2 files, 4 tests passed
    playwright: 3 Chromium tests passed
    pull request 4: merged at commit 39b32b9a9284eed368877943969ebc77234d4a57
    hosted quality/build: passed in 1 minute
    hosted browser smoke tests: passed in 1 minute 13 seconds

Milestone 3 evidence:

    fixture result: 7 breaking, 2 dangerous, and 5 safe findings
    vitest: 4 files, 11 tests passed
    playwright: 4 Chromium tests passed
    pull request 6: merged at commit 277e95184d08078ffe2673eb5e7e2e024954e1f3
    hosted quality/build: passed in 59 seconds
    hosted browser smoke tests: passed in 1 minute 7 seconds

Local milestone 4 evidence:

    empty-database migration: all committed migrations applied successfully
    seed: succeeded twice on the empty rehearsal database
    idempotency: first analysis returned 201; identical retry returned 200 and the same release id
    persisted result: 14 findings, 32 impact edges, and 6 unique consumers
    restart: saved release returned 200 after the Next.js process restarted
    vitest: 6 files, 15 tests passed
    playwright: 6 Chromium tests passed, including mobile comparison and persisted reload
    pull request 8: merged at commit d68222a51d454516b1187954451714ca77287620
    hosted quality/build: passed in 1 minute 9 seconds
    hosted browser smoke tests: passed in 1 minute 5 seconds

Local production-evidence milestone:

    clean database: migrations 0000 through 0003 applied, seed repeated safely, integration suite passed
    vitest: 8 files, 20 tests passed, including concurrent rate limiting and database fault injection
    playwright: 7 Chromium journeys passed, including response security headers
    production build: passed with all static and dynamic routes generated
    deterministic benchmark: 500 iterations, 0.045 ms median, 0.084 ms p95, stable 14-finding digest
    optimized local smoke: landing 35 ms, database health 37 ms, deterministic preview 35 ms
    incident rehearsal: readiness returned a bounded 503 during simulated database loss and recovered without state mutation

Initial production launch evidence:

    Vercel deployment: Ready, deployment dpl_5RLRjpvrQYNjpv7LZwB1jdxcyb9k
    source revision: 0cd2c405df06b1ce0b0dc592a887648f0df72265
    managed database: Neon PostgreSQL resource compatgraph-postgres in pdx1
    migrations: 0000 through 0003 applied successfully to managed PostgreSQL
    seed: repeated twice successfully against managed PostgreSQL
    external smoke: landing, readiness, CSP, request correlation, and exact deterministic preview passed
    persisted release: release_228cf6b8059bc52bd7a8c6b4, 14 findings, 6 consumers, reload verified
    Lighthouse: 99 performance, 93 accessibility, 100 best practices, 100 SEO; 152,420 script bytes, CLS 0
    launch candidate Lighthouse: 98 performance, 100 accessibility, 100 best practices, 100 SEO

Final production evidence:

    pull request 18: merged at d952dbda856474ec123a45fbd05a7ac6e8711ae4; issue 17 closed
    Vercel deployment: Ready, deployment dpl_3vkGD2aB3DuZizwdURnLoFQLum6W, functions in pdx1
    production smoke: landing 577 ms, database health 594 ms, deterministic preview 320 ms
    production revision: d952dbd
    persisted release: returned 200 after deployment with 7 breaking findings and 6 consumers
    Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO
    Lighthouse details: FCP 1,029 ms, LCP 1,929 ms, TBT 0 ms, CLS 0, 152,380 script bytes
    security: zero open Dependabot alerts

## Interfaces and Dependencies

Next.js 16 and React 19 provide the web and server-rendering framework. TypeScript runs in strict mode. Tailwind CSS 4 provides design tokens and styling. Vitest covers framework-independent logic and component behavior; Playwright covers real browser journeys. Zod will validate untrusted contract and form input. PostgreSQL and Drizzle ORM will provide typed persistence. OpenTelemetry will expose traces and metrics. GitHub Actions is the authoritative continuous-integration environment.

The analysis boundary exposes a function shaped like `analyzeContracts(baseline, candidate): AnalysisResult`, where each input is a parsed and validated OpenAPI document and the result contains stable findings and summary counts. The persistence boundary exposes server-only queries rather than leaking raw database records into client components. Background execution will accept stable job identifiers and be safe to retry.

Plan revision note, 2026-09-17 05:45Z: Recorded the managed production launch, automatic Git deployment connection, protected branch, external smoke and persistence evidence, initial Lighthouse audit, region mismatch discovery, and the locally verified accessibility and co-location refinements tracked by issue 17.

Plan revision note, 2026-09-17 05:58Z: Recorded pull request 18, the required Vercel deployment gate, final co-located production deployment, anonymous smoke, persisted-release survival, perfect public Lighthouse audit, and the explicit boundary between shipped v1 behavior and the GitHub/worker roadmap.
