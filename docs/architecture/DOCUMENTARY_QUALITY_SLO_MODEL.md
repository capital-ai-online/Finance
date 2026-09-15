# Documentary Quality / SLO Model

**Status:** WP-DOC-15 IMPLEMENTATION CANDIDATE — branch-level evidence only  
**Project / Owner:** `CAPITAL-AI-DOC / PVC-03`  
**Primary technical authority:** `ESS-0010 — Documentary Engine`  
**Related authority:** `ADR-0097 — Documentary Maintenance Agent Control Loop`  
**Existing evidence source:** `Observability/DocumentaryMaintenanceObservability.ts`  
**Contract version:** `documentary-quality-slo/1.0.0`  
**Date:** 2026-09-15

## Purpose

WP-DOC-15 adds a bounded, read-only target-evaluation contract on top of the existing D9 Documentary Maintenance health snapshot. It does **not** create another metrics collector, telemetry stack, Quality Center, persistence layer, event authority, release gate or production control.

The implementation consumes only the three existing D9 ratios:

- `freshnessRatio`;
- `registryCoverageRatio`;
- `orphanRate`.

All source metrics remain owned by the existing D9 observability contract. WP-DOC-15 evaluates them; it does not recalculate or persist them.

## Owner-approved starter target contract

The Owner approved the following initial Documentary-local target contract on 2026-09-15:

| Signal | Target | Semantics |
|---|---:|---|
| `freshnessRatio` | `>= 0.95` | Documentary freshness SLO target |
| `registryCoverageRatio` | `== 1.0` | integrity invariant |
| `orphanRate` | `== 0.0` | integrity invariant |

The `0.95` freshness target is an explicit project-local starter target. It is not represented as an ISO requirement, external certification threshold or pre-existing repository authority. Any future target change requires a separately correlated Owner/authority decision.

## Evaluation semantics

`evaluateDocumentaryQualitySlo()` returns exactly one state:

- `MEETS_SLO` — the exact point-in-time D9 snapshot is valid, both integrity invariants hold and `freshnessRatio >= 0.95`;
- `SLO_BREACH` — the snapshot is valid, both integrity invariants hold, but `freshnessRatio < 0.95`;
- `BLOCKED` — source evidence is malformed/out-of-range, the upstream D9 health status is `BLOCKED`, registry coverage is not exactly `1.0`, or orphan rate is not exactly `0.0`.

Reasons are deterministically sorted. Invalid evidence is never normalized into PASS and integrity violations are never reduced to a non-blocking freshness warning.

## Point-in-time versus temporal SLO evidence

The current D9 contract provides a commit-/correlation-bound health snapshot, not a governed historical time series or rolling availability window. WP-DOC-15 therefore evaluates **point-in-time target conformance only**.

Every result carries:

- `evaluationScope = point-in-time-snapshot`;
- `temporalSloVerified = false`.

A `MEETS_SLO` result must not be interpreted as proof that a weekly, monthly or other time-window SLO has been achieved. Temporal SLO verification requires separately authorized history/evidence semantics and is outside this work package.

## Fail-closed evidence checks

The evaluator blocks on:

- wrong D9 observability contract version;
- blank correlation identity;
- non-40-hex source commit;
- invalid observation timestamp;
- unknown health status;
- non-finite or out-of-range `[0,1]` SLI ratios;
- upstream `BLOCKED` health;
- registry coverage below or above the exact `1.0` invariant;
- orphan rate different from exact `0.0`.

The contract deliberately does not invent a composite Documentary quality score. The existing central Quality Center remains a separate read-only quality/evidence authority and is neither replaced nor mutated here.

## Authority and mutation boundary

Every evaluation result explicitly keeps:

- `decisionAuthorized = false`;
- `mutationAuthorized = false`;
- `qualityCenterMutationPerformed = false`;
- `observabilityMutationPerformed = false`;
- `temporalSloVerified = false`.

The evaluator performs no filesystem, registry, lifecycle, database, provider, IAM, billing, release, deployment or production mutation. It publishes no event and grants no merge/release/deployment authority.

## Reuse boundary

WP-DOC-15 reuses:

1. the existing `DocumentaryMaintenanceHealthSnapshot` type and D9 metrics;
2. existing commit/correlation binding from D9;
3. existing Documentary/Quality separation defined by current repository authority.

It introduces no second scanner, no second metrics subsystem and no parallel Quality Center contract.

## Validation scope

Focused unit coverage verifies:

- exact target success at `0.95 / 1.0 / 0.0`;
- freshness breach below `0.95` without converting it into an integrity failure;
- fail-closed registry/orphan invariant violations;
- fail-closed upstream `BLOCKED` health;
- fail-closed malformed/out-of-range evidence;
- deterministic output for identical input;
- all decision/mutation/temporal-proof flags remain false.

Repository-wide Vitest, project-wide TypeScript, Documentation Hygiene, production build and hosted GitHub checks are separate validation evidence and must remain `NOT RUN` until actually executed.

## Explicit non-goals

WP-DOC-15 does not:

- define an enterprise-wide availability SLO;
- create a historical SLO store or trend service;
- create alerting, paging, notification or incident automation;
- modify `src/platform/Quality/**`;
- create a new `AUTH-*`, `CTRL-*`, ADR, ESS or `DOC-*` identity;
- alter component, document-schema or platform version authority;
- authorize any mutation based on an SLO result.
