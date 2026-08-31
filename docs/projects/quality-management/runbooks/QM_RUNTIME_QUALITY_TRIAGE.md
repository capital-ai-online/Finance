# Runbook — QM Runtime Quality Triage

## Purpose
Reproduce runtime, authentication and frontend performance problems with evidence before recommending a domain mutation.

## Flow

```text
Reproduce
 -> exact runtime identity
 -> timing trace
 -> network trace
 -> auth/session trace
 -> rendering trace
 -> dependency attribution
 -> root cause evidence
 -> regression evidence
 -> domain handoff when mutation is required
```

## Required discipline
- Separate network, server, JavaScript, rendering and auth-bootstrap delay.
- Record request duplication and causal ordering, not only total page time.
- Preserve existing Auth/Router/Public Shell architecture.
- Reuse existing performance tests before adding a new one.
- Mark missing source evidence `NOT_AVAILABLE` rather than inferring a cause.
- Redact secrets, tokens and sensitive user data from traces.