# CompatGraph architecture

CompatGraph is a modular full-stack application with a deliberately small deployment surface. The product is one Next.js service today, while contract analysis stays framework-independent so it can move into retry-safe workers when asynchronous ingestion lands.

## Runtime boundaries

```mermaid
flowchart LR
    Browser[Browser] -->|HTTPS| Next[Next.js application]
    Next -->|server-only queries| Data[Data access layer]
    Data -->|pooled SQL| Postgres[(PostgreSQL)]
    Next -->|health probe| Health[/api/health]
    Health -->|SELECT 1| Postgres
    CI[GitHub Actions] -->|migrate and seed| Postgres
    CI -->|quality and browser gates| Next
```

Pages and layouts in `src/app` are React Server Components by default. They can read through `src/data`, but they do not issue HTTP requests back into their own route handlers. Interactive browser-only behavior will be isolated in small Client Components. `src/db/client.ts` lazily creates the PostgreSQL client so importing a page during build does not require a connection.

## Persistence model

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ TEAMS : contains
    ORGANIZATIONS ||--o{ PROJECTS : owns
    ORGANIZATIONS ||--o{ CONSUMERS : owns
    TEAMS ||--o{ CONSUMERS : operates
    PROJECTS ||--o{ API_CONTRACTS : versions
    PROJECTS ||--o{ RELEASES : evaluates
    API_CONTRACTS ||--o{ RELEASES : baseline
    API_CONTRACTS ||--o{ RELEASES : candidate
    RELEASES ||--o{ CHANGES : contains
    RELEASES ||--o{ ACTIVITY_EVENTS : records
    CHANGES ||--o{ IMPACT_EDGES : exposes
    CONSUMERS ||--o{ IMPACT_EDGES : affected_by
```

The model keeps evidence normalized rather than storing one dashboard-shaped JSON document. A release points to immutable baseline and candidate contracts. Deterministic findings belong to that release. An impact edge is a many-to-many relationship between a finding and a consumer and records how the relationship was discovered. Team ownership remains independent of releases, allowing ownership changes without rewriting historical findings.

Database constraints protect stable slugs, contract versions and hashes, consumer names, impact-edge uniqueness, foreign-key integrity, and the 0–100 risk-score range. Indexes follow dashboard access patterns: latest release per project, findings per release and severity, consumer ownership, and chronological activity.

## Migration and recovery

`src/db/schema.ts` is the typed model used by application code. SQL under `drizzle/` is the deployment artifact. Migrations are additive and immutable once shared. The application must remain compatible with the prior schema during a deployment rollback window.

The synthetic demonstration seed uses stable identifiers and upserts. Running `pnpm db:seed` repeatedly updates the same rows and never creates duplicates. A failed web deployment can roll back to the previous immutable application build. Database rollback should use a forward corrective migration rather than editing or removing an applied migration.

## Planned evolution

The deterministic OpenAPI analyzer will expose a pure `analyzeContracts` boundary under `src/analysis`. The web application will first call it in-process and persist its result transactionally. When repository ingestion and larger contracts require durable background work, the same boundary can run in a worker with an idempotency key derived from project, baseline hash, and candidate hash. That extraction is evidence-driven; no queue or service boundary is introduced before the workflow needs retries outside an HTTP request.
