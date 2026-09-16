# Build CompatGraph as a production-grade API change intelligence platform

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with the ExecPlan requirements and guidelines in the `execution-plan` skill.

## Purpose / Big Picture

CompatGraph helps platform teams understand whether an API release is safe before it reaches customers. A user supplies a baseline OpenAPI contract and a proposed contract, sees deterministic breaking-change findings, understands which consumer services are exposed, and follows an auditable migration workflow. The finished product must be publicly accessible, backed by a real PostgreSQL database, developed through focused pull requests, and continuously verified by GitHub Actions.

The first public demonstration will use a realistic payments API. It will show a release moving from a detected breaking change, through impact analysis, to a safe migration plan. A visitor must be able to understand the system without an account; authenticated project ownership and GitHub installation are later milestones.

## Progress

- [x] (2026-09-16 23:20Z) Created the public `Dricmoy/compatgraph` repository and configured a repository-local personal Git identity.
- [x] (2026-09-16 23:28Z) Generated the Next.js 16, React 19, TypeScript, and Tailwind foundation on `feat/foundation`.
- [ ] Deliver pull request 1 with the branded public experience, sample dashboard, engineering standards, tests, and CI. (2026-09-16 23:34Z: implementation and local validation complete; remaining: remote issue, pull request, green GitHub checks, review, and merge.)
- [ ] Deliver pull request 2 with PostgreSQL, migrations, seed data, and server-side dashboard queries.
- [ ] Deliver pull request 3 with deterministic OpenAPI parsing and breaking-change analysis.
- [ ] Deliver pull request 4 with persisted analyses, consumer impact mapping, and an interactive graph.
- [ ] Deliver pull request 5 with authentication, GitHub repository connection, and background analysis jobs.
- [ ] Deliver pull request 6 with OpenTelemetry, performance budgets, security hardening, and chaos/failure tests.
- [ ] Provision managed PostgreSQL and a production web deployment, run migrations, seed the demonstration workspace, and verify the public URL.
- [ ] Protect the default branch, publish architecture and incident documentation, and complete the final acceptance audit.

## Surprises & Discoveries

- Observation: The first product name, SpecLoom, is already used by an active developer tool and public website.
  Evidence: Live search on 2026-09-16 found `specloom.tech` and a public `kpruntov/SpecLoom` repository.
- Observation: GitHub CLI was authenticated as `Dricmoy`, but the account's configured SSH transport did not have a usable personal key on this host.
  Evidence: The initial clone returned `git@github.com: Permission denied (publickey)`; HTTPS cloning with the GitHub credential helper succeeded.
- Observation: Enabling the stable React Compiler option in Next.js 16 still requires an explicit `babel-plugin-react-compiler` development dependency.
  Evidence: The first production build failed while resolving the compiler package; after adding version 1.0.0, `pnpm check` completed successfully.
- Observation: Vitest includes all matching test files unless browser tests are explicitly excluded.
  Evidence: The first unit run attempted to execute `tests/e2e/product.spec.ts`; adding that directory to `vitest.config.ts` produced one passing unit suite while Playwright separately reported two passing browser tests.

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

## Outcomes & Retrospective

The repository and implementation branch exist. No milestone is complete yet. The first product shell is locally implemented and visually inspected at desktop width. Formatting, lint, strict type checking, two unit assertions, production build, and two Chromium journeys pass. The immediate remaining outcome is to publish pull request 1, observe its GitHub checks, review its remote diff, and merge it before starting PostgreSQL work.

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

Migration and seed commands will be added to this section when their script names exist. They must work from an empty volume and may be rerun without duplicating demonstration records.

## Validation and Acceptance

The product is complete only when all of the following are directly observed. The public URL loads without authentication and explains CompatGraph. The demonstration dashboard reads PostgreSQL-backed releases and findings. Uploading two supported OpenAPI contracts creates a persisted analysis with deterministic breaking-change findings. An impact view links at least one finding to a consumer and owner. Restarting the application does not lose data. GitHub Actions validates formatting, lint, types, unit tests, integration tests, browser tests, build, dependency review, and code scanning as applicable. Pull requests contain focused descriptions and evidence. The production environment exposes a health endpoint, emits traces, uses non-repository secrets, and has documented migration and rollback procedures.

Quality acceptance includes keyboard navigation, visible focus states, semantic landmarks, responsive layouts at 390, 768, and 1440 pixel widths, no serious automated accessibility findings, and a Lighthouse performance result recorded for the deployed public pages. Systems acceptance includes idempotent jobs, duplicate webhook handling, bounded retries, database constraints, migration reproducibility, and a failure test showing recovery from an interrupted analysis worker.

## Idempotence and Recovery

Package installation, formatting, tests, migrations, and seed commands must be safe to repeat. Database migrations are additive and committed; never edit an applied production migration. Seed rows use stable identifiers and upserts. Webhook deliveries have unique provider identifiers. Analysis jobs have idempotency keys derived from project and contract hashes. Deployment rollback uses the hosting provider's immutable prior build while database changes remain backward compatible for at least one release.

If a pull request fails, amend the same branch and preserve the check history. If deployment fails after a migration, restore the previous application build rather than destructively reverting the database. Secrets must never appear in logs, commits, screenshots, or pull-request text.

## Artifacts and Notes

Authoritative project artifacts will include `README.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/benchmarks.md`, and `docs/incidents/`. Short verification transcripts and production URLs will be added here as they exist.

Current remote evidence:

    repository: https://github.com/Dricmoy/compatgraph
    default branch: main
    visibility: public

Local milestone 1 evidence:

    pnpm check: passed on 2026-09-16
    vitest: 1 file, 2 tests passed
    next build: / and /dashboard statically rendered
    playwright: 2 Chromium tests passed in 5.2 seconds

## Interfaces and Dependencies

Next.js 16 and React 19 provide the web and server-rendering framework. TypeScript runs in strict mode. Tailwind CSS 4 provides design tokens and styling. Vitest covers framework-independent logic and component behavior; Playwright covers real browser journeys. Zod will validate untrusted contract and form input. PostgreSQL and Drizzle ORM will provide typed persistence. OpenTelemetry will expose traces and metrics. GitHub Actions is the authoritative continuous-integration environment.

The analysis boundary will expose a function shaped like `analyzeContracts(baseline, candidate): AnalysisResult`, where each input is a parsed and validated OpenAPI document and the result contains stable findings and summary counts. The persistence boundary will expose server-only queries rather than leaking raw database records into client components. Background execution will accept stable job identifiers and be safe to retry.

Plan revision note, 2026-09-16 23:34Z: Recorded the implemented foundation, successful local checks, visual inspection, and configuration discoveries before opening pull request 1.
