# OPS-PR900-05 — Production Observability / Readiness

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-08 — Production Operations`, with `PVC-07 — Release Management` and `PVC-18 — EventMesh / Traceability` evidence inputs  
**Status:** `IMPLEMENTED / EVIDENCE_CONTRACT_READY / LIVE_MEASUREMENT_OPEN`  
**Baseline:** `main@4c5c49ea1fa40c4f0a1ece397ea4732388c96e1e`  
**Trust root:** `/AGENTS.md@4c5c49ea1fa40c4f0a1ece397ea4732388c96e1e`

## Objective

Turn the already verified exact-SHA deployment identity into a deterministic production-readiness evidence contract. Readiness is derived only from observed repository/provider evidence. Missing evidence remains `NOT_PROVEN`; no percentage, SLO attainment, incident state, telemetry completeness or provider health is inferred.

This package introduces no provider activation, paid capability, connector/permission change, deployment, release acceptance, secret/IAM mutation or production mutation.

## Existing repository-native evidence surfaces

The package reuses existing surfaces rather than introducing a second observability architecture:

- `server/routes/health.ts` — liveness `/healthz` and immutable deployment identity projection.
- `server/deploymentIdentity.ts` — exact deployed commit/branch/repository identity.
- `server/runtime/businessReadiness.ts` and `server/routes/businessReadinessRoutes.ts` — strict `/readyz` plus diagnostic `/healthz/readiness`; external market-data providers are deliberately not promoted to liveness dependencies.
- `server/logger.ts` — structured request completion telemetry with status and duration; `/healthz` is intentionally excluded from normal request telemetry.
- `src/platform/Telemetry/README.md` — canonical telemetry/redaction boundary; telemetry remains observational and non-authorizing.
- `scripts/pr/productionPreflight.mjs` — exact production/main identity preflight.
- existing exact-SHA deployment-identity evidence from the merged OPS-PR900-02 path.

## Readiness evidence model

Every observation is bound to `observedAt`, `mainSha`, `productionCommit` where applicable, evidence source and explicit status. Allowed statuses are `PASS`, `FAIL`, `NOT_PROVEN` and `NOT_APPLICABLE`. `NOT RUN` remains `NOT RUN` in validation output and is never converted to `PASS`.

| Dimension | SLI / evidence | Readiness rule |
|---|---|---|
| Deployment identity | `/healthz` deployment commit equals then-current intended production commit | mismatch = `FAIL`; missing identity = `NOT_PROVEN` |
| Liveness | `/healthz` responds successfully for the observed snapshot | observed failure = `FAIL`; no observation = `NOT_PROVEN` |
| Strict readiness | `/readyz` result plus diagnostic `/healthz/readiness` booleans | blocking readiness false = `FAIL`; unavailable observation = `NOT_PROVEN` |
| Release evidence | exact-SHA CI / provenance / deployment identity chain | only exact matching SHA evidence may be reused |
| Request reliability | structured request completion status/duration records | no synthetic error-rate or latency percentile; aggregates require measured samples |
| Incident readiness | applicable incident/recovery/runbook evidence | existence alone does not prove drill success or RPO/RTO attainment |
| Telemetry | repository-native logger/Telemetry contract and authorized provider readback when available | provider/vendor state remains `NOT_PROVEN` until real readback exists |
| Security returns | OPS-owned exact identity/time/snapshot evidence for SEC handoff | OPS may report `EVIDENCE_READY`; only CAPITAL-AI-SEC may verify/close Security findings |

## SLI/SLO policy

This slice deliberately separates **SLI availability** from **SLO target approval**.

1. Repository-native SLIs may be defined from existing health/readiness/request telemetry.
2. A numerical SLO target is not fabricated from a single deployment or undocumented expectation.
3. Until a target has an explicit measurement window, owner-approved threshold and reproducible data source, its state is `SLO_TARGET_NOT_PROVEN`.
4. Error budgets require the same approved target and measured window; no synthetic budget is emitted.
5. Vendor dashboards may be supporting evidence only after authorized readback and may not become a second authority plane.

## Incident and recovery evidence

Incident readiness is evidence-derived. Current repository runbooks/contracts may establish procedure existence, but measured recovery/RPO/RTO remains open until a real bounded drill or production incident provides exact-identity/time evidence. This package therefore does not close `S1-R2-07` or any Security finding.

Minimum incident evidence tuple:

`incident/drill id + observedAt + affected productionCommit + detection source + operator action + recovery evidence + measured duration + data-loss observation + follow-up owner`

Missing tuple fields remain explicit findings rather than being backfilled with estimates.

## Telemetry / privacy boundary

PostHog or another provider is not required for repository completion of this package. Any later provider readback must preserve least privilege, data minimization, redaction and Security/Compliance authority. No provider token, raw secret, personal-data payload or unrestricted event body is added to repository evidence.

## Deterministic readiness disposition

A snapshot is `READINESS_EVIDENCE_COMPLETE` only when all dimensions declared required for that snapshot have exact evidence and none is `FAIL` or `NOT_PROVEN`. Otherwise the result is `READINESS_EVIDENCE_INCOMPLETE`, with the missing/failed dimensions listed verbatim.

`READINESS_EVIDENCE_COMPLETE` is evidence completeness, not deployment authorization, Release Acceptance, Security verification or a business availability guarantee.

## Current disposition at materialization

- exact-SHA deployment identity capability: `AVAILABLE_ON_MAIN`;
- repository liveness/readiness surfaces: `AVAILABLE_ON_MAIN`;
- structured request telemetry capability: `AVAILABLE_ON_MAIN`;
- numerical SLO target/measurement window: `NOT_PROVEN`;
- measured incident/RPO/RTO drill: `NOT_PROVEN`;
- live vendor telemetry/readback: `NOT_PROVEN / CONDITION_GATED`;
- Security finding closure: `NOT_APPLICABLE_TO_OPS_AUTHORITY`.

Therefore this package is `EVIDENCE_CONTRACT_READY`, while production-readiness measurement remains open and must be populated only from real observations.

## Exit gate

`OPS-PR900-05` repository materialization exits when the canonical OPS surface defines one deterministic evidence model over existing liveness/readiness, exact-SHA release/deployment identity, request telemetry and incident evidence; missing live/provider measurements remain explicitly open and no synthetic readiness percentage or PASS is introduced.
