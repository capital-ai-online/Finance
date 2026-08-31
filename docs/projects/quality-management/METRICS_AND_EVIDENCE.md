# CAPITAL-AI-QM — Metrics and Evidence Contract

This project consumes existing normative metrics and thresholds. It does not invent them.

## Evidence record

Every QM evidence record MUST contain at least:

| Field | Meaning |
|---|---|
| Evidence ID | stable unique evidence identifier |
| Observed commit | exact 40-character Git SHA where applicable |
| Observed environment | environment/runtime identity |
| Timestamp | observation time with timezone |
| Executor | workflow/tool/human executor identity |
| Contract / Validator | canonical authority or validator reference |
| Result | `PASS`, `FAIL` or `NOT_AVAILABLE` |
| Source artifact | traceable test report/log/manifest/measurement source |
| Status | evidence lifecycle state |
| Known limitations | gaps, skips, sampling or environment constraints |
| Related QM work item | `QM-*` reference |

## Result semantics

### PASS
Only complete, positive and correctly commit-bound evidence. For execution gates this requires proof the relevant process actually ran.

### FAIL
Observed negative evidence from the authoritative test/validator/measurement source.

### NOT_AVAILABLE
Missing, skipped, incomplete, expired, unbound, wrong-commit or otherwise non-reproducible evidence.

A file existing in the repository is never sufficient proof that its test passed.

## Measurement classes

- Contract/validator conformance.
- Test execution and coverage evidence.
- Build and runtime-release-manifest evidence.
- Frontend/runtime latency and blocking attribution.
- Auth/session request and recovery behavior.
- Bundle/chunk/lazy-load regression evidence.
- Technical-debt lifecycle evidence.
- Documentation/baseline drift evidence.
- 18-stage value-chain evidence completeness.

## Performance measurements

For QM-3/QM-4 capture raw observations such as navigation timings, long tasks, request waterfalls, render milestones, JavaScript execution, resource sizes, auth bootstrap spans and route transition traces. Use an environment identity and repeatable test profile.

External web-performance targets are **NON_NORMATIVE_ADVISORY** unless an existing CAPITAL-AI authority explicitly adopts them. An external recommendation may be reported alongside current evidence but MUST NOT silently change a gate.

## Telemetry rules

Prefer existing application/observability instrumentation and open semantic conventions over a parallel telemetry bus. Correlate traces with build/runtime identity where available. Do not log tokens, credentials or protected user data as quality evidence.

## Storage

Repository evidence guidance lives under `docs/projects/quality-management/evidence/`. Large or generated CI artifacts remain in their authoritative CI/artifact store and are referenced rather than copied into Git history.