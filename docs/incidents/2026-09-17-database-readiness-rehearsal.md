# Database readiness failure rehearsal

## Summary

On 2026-09-17, the database readiness failure path was exercised before the first public deployment. A fault-injection test forced the PostgreSQL probe to reject, and the health route returned HTTP 503 with a correlation ID and a bounded error body. Restoring the probe returned the service to HTTP 200 without changing application state.

This was a planned rehearsal. No user or production traffic was affected.

## Expected and observed behavior

- The readiness endpoint failed closed with HTTP 503.
- The response did not expose a connection string, exception message, or stack trace.
- The response retained an `x-request-id` for log correlation.
- The healthy path reported database latency and the deployment revision.
- No migration, retry loop, or destructive database action ran during recovery.

## Recovery decision

For a real incident, remove the unhealthy deployment from write traffic, inspect managed PostgreSQL availability and connection configuration, then restore connectivity or roll the application back to the prior immutable deployment. Database migrations remain in place because they are additive and backward compatible.

## Follow-up

The route-level fault injection runs in the unit suite. The deployment smoke test separately verifies the real provider health endpoint, landing page, and analysis preview after every production release.
