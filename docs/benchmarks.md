# CompatGraph performance evidence

Performance claims are recorded only with a reproducible command and environment. Local numbers are directional; the deployed smoke and Vercel traces are authoritative for production.

## Budgets

| Signal                                         |                                Budget | Reason                                                         |
| ---------------------------------------------- | ------------------------------------: | -------------------------------------------------------------- |
| Deterministic fixture comparison, warm process |                       p95 below 25 ms | Keeps analysis CPU small relative to request and database time |
| Persisted fixture analysis, idempotent retry   |                  below 250 ms locally | Retry should be a short indexed read, not a repeat write       |
| Public health endpoint                         |   below 500 ms from deployment region | Detects database connectivity degradation early                |
| Landing-page transferred JavaScript            |              below 180 KiB compressed | Preserves fast first interaction on ordinary mobile networks   |
| Analysis editor mobile viewport                | no horizontal page overflow at 390 px | Contract text may scroll internally without breaking layout    |

## Reproduction

Run the framework-independent benchmark with:

```bash
pnpm benchmark:analysis
```

The command parses the committed payment fixtures once, performs 500 warm comparisons, and prints median, p95, and maximum duration plus a deterministic result digest. It performs no network or database I/O.

Production smoke timing is collected with:

```bash
pnpm smoke:production -- https://your-deployment.example
```

Record new results below with the Git revision, Node version, machine or provider region, and whether the run was cold or warm. Do not compare numbers across materially different fixture corpora without saying so.

## Results

### Local deterministic engine — 2026-09-16

- Git revision: production-hardening branch based on `d68222a`
- Environment: Apple Silicon macOS, Node v26.4.0, warm process
- Corpus: committed `payments-v1.yaml` → `payments-v2.yaml`
- Iterations: 500
- Median: 0.045 ms
- p95: 0.084 ms
- Maximum: 0.250 ms
- Result: 14 findings, digest `1489d2b4ff12be1a`

The framework-independent engine is far below the 25 ms p95 budget; request parsing, PostgreSQL, and cold-start time will dominate the deployed path. Production results will be appended after deployment. A budget failure blocks the production acceptance audit until it is explained or fixed.

### Local route smoke — 2026-09-17

- Target: optimized Next.js production server with PostgreSQL 17 in Docker
- Landing: 35 ms
- Database health: 37 ms
- Deterministic preview: 35 ms
- Result: passed CSP, correlation-ID, database, and exact-fixture assertions

This is a warm local-production sanity check, not a hosted performance claim. The same smoke script will provide comparable deployed evidence after provider provisioning.

### Initial public deployment — 2026-09-17

- URL: `https://compatgraph.vercel.app`
- Revision: `0cd2c40`
- Runtime: Vercel Functions `iad1`; managed Neon PostgreSQL `pdx1`
- External smoke: landing 672 ms, database health 1,111 ms, deterministic preview 402 ms
- Repeat smoke: landing 373 ms, database health 1,468 ms, deterministic preview 383 ms
- Lighthouse mobile: performance 99, accessibility 93, best practices 100, SEO 100
- Lighthouse JavaScript transfer: 152,420 bytes, below the 180 KiB budget
- Lighthouse layout shift: 0

The smoke suite passed, but the health latency revealed an avoidable cross-region database hop. The launch candidate pins Vercel Functions to `pdx1`. The same audit also identified low-contrast decorative labels and a skipped heading level; those findings are corrected in the launch candidate rather than waived.

### Launch candidate local production audit — 2026-09-17

- Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100
- First contentful paint: 759 ms
- Largest contentful paint: 2,317 ms
- Total blocking time: 6 ms
- Cumulative layout shift: 0
- JavaScript transfer: 154,434 bytes, below the 180 KiB budget

This audit runs the optimized production build locally and proves the accessibility fixes before hosted deployment. Final co-located production timings are recorded after the protected launch pull request reaches `main`.

### Final public production audit — 2026-09-17

- URL: `https://compatgraph.vercel.app`
- Revision: `d952dbd`
- Runtime: Vercel Functions and managed Neon PostgreSQL co-located in `pdx1`
- External smoke: landing 577 ms, database health 594 ms, deterministic preview 320 ms
- Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100
- First contentful paint: 1,029 ms
- Largest contentful paint: 1,929 ms
- Total blocking time: 0 ms
- Cumulative layout shift: 0
- JavaScript transfer: 152,380 bytes, below the 180 KiB budget

The protected Git deployment passed the exact-fixture smoke assertions, including managed-database connectivity, response correlation, security headers, and the expected 7 breaking, 2 dangerous, and 5 safe findings. The persisted demonstration release also returned 200 after deployment, proving that the release survived the immutable application rollout.
