# Contributing to CompatGraph

CompatGraph uses short-lived branches and focused pull requests. Every change should make one user-visible capability or one engineering invariant easier to verify.

## Workflow

1. Start from current `main` and create a branch named `feat/<scope>`, `fix/<scope>`, `docs/<scope>`, or `chore/<scope>`.
2. Link the branch to a GitHub issue with explicit behavior and acceptance criteria.
3. Keep product logic outside framework components when possible and add tests at the narrowest useful boundary.
4. Run `pnpm check` and `pnpm test:e2e` before requesting review.
5. Open a pull request using the repository template. Include screenshots for visible changes and exact commands for verification.
6. Merge only after required checks are green and the pull-request diff has been reviewed.

## Engineering rules

- Keep TypeScript strict and do not use `any` to bypass a design problem.
- Validate all untrusted input at the server boundary.
- Keep database access in server-only modules.
- Prefer deterministic analysis and stable identifiers over model-generated verdicts.
- Make jobs, webhooks, migrations, and seeds safe to retry.
- Never commit secrets, production data, customer code, or employer material.
- Update `docs/exec-plan.md` whenever progress, decisions, or discoveries change.

## Commit style

Use concise imperative subjects with an optional conventional prefix, for example `feat: add contract comparison shell` or `test: cover enum narrowing`.
