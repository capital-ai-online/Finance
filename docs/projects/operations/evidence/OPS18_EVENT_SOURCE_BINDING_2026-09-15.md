# OPS-18 Real Event Source Binding — REQ-COMP-033 Owner Return

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-18 — EventMesh / Traceability`  
**Work package:** `OPS-18-B` / `REQ-COMP-033` productive source binding  
**Branch:** `agent/operations-ops18-event-source-binding-20260915`  
**Implementation baseline:** `main@8203e17940287cdd4ba0bd630f43c84bb701e96c`  
**Status:** `IMPLEMENTED_BRANCH / PRE_PR_EVIDENCE_READY`  
**Trust root:** `/AGENTS.md@current-main`

## Objective

Close the remaining OPS-owned gap after Human-merged PR #937: the strict operational trace binding existed on main, but no productive source path supplied a real source-owned identity/correlation/timestamp into `STRICT_IDENTITY_CORRELATION`.

This slice wires the already productive Traceability → EventMesh publisher path into the existing strict projection. It does not create a second EventMesh, trace store, evidence registry, DATA identity model or decision authority.

## Source authority and reuse

The existing `src/platform/Traceability/Services/runTraceability.ts` already publishes real Traceability events through the canonical `eventMeshBus`.

The canonical EventMesh publisher returns a validated `EventContract` carrying source-owned metadata:

- `metadata.eventId`;
- `metadata.correlationId`;
- `metadata.timestamp`;
- `metadata.sourceComponent`;
- event name and ESS/ADR references.

The Traceability run already owns a `runId`. This slice passes that existing `runId` as the EventMesh `correlationId` for every event in the same run. The strict adapter does not generate a replacement correlation identity.

## Binding

`TraceabilityEventOperationalSource` converts only EventContracts whose source component is exactly `src/platform/Traceability`.

For each successfully published event it copies:

| EventMesh source | Strict operational trace field |
|---|---|
| `metadata.eventId` | `identity.statusId`, evidence `ref`, evidence `identityRef` |
| `metadata.correlationId` | trace correlation, evidence correlation, strict required correlation |
| `metadata.timestamp` | authoritative `provenance.sourceTimestamp` |
| observation time | `provenance.observedAt` |

Freshness is calculated from the EventMesh source timestamp and observation timestamp. Invalid timestamps or future-source timestamps are `UNKNOWN`; age above the bounded freshness window is `STALE`; only a non-negative age within the window is `FRESH`.

The existing strict projector then decides whether the record may remain effective `CURRENT/PASS`. Missing/wrong/stale inputs continue to fail closed to `UNKNOWN/non-PASS`.

## Productive runtime path

`runTraceability.ts` now:

1. publishes each real Traceability Event using the existing run ID as correlation;
2. captures the validated EventContract returned by EventMesh;
3. converts that exact returned contract to an `OperationalTraceStateSourceRecord`;
4. passes all captured sources through the existing `buildOperationalTraceStateProjection`;
5. writes the timestamped evidence-only projection to `.ai/knowledge/traceability/operational-state.json` on both terminal success and hard-failure paths.

The projection is generated from current run events. No event identity, correlation ID or source timestamp is read from documentation or manufactured by the projection layer.

## Changed scope

- `src/platform/Traceability/Services/TraceabilityEventOperationalSource.ts` — new bounded adapter.
- `src/platform/Traceability/Services/runTraceability.ts` — productive EventMesh return capture and generated operational-state projection.
- `tests/unit/traceabilityEventOperationalSource.test.ts` — positive and fail-closed source-binding coverage.
- this evidence record.

The canonical OPS Roadmap is intentionally not modified in this slice because a parallel OPS work-management writer exists; final Roadmap synchronization remains a post-merge owner action after re-correlation.

No DATA, FINTECH, Security, Compliance, provider, IAM, secret, billing, DNS/TLS, deployment or Production configuration is changed.

## Pre-PR validation

Executed against the candidate implementation payload before repository commit:

| Check | Result |
|---|---|
| Strict TypeScript compile — adapter + operational trace contract/projector + EventContract shapes | `PASS` |
| Focused executable adapter/projection harness | `PASS` |
| Fresh real EventContract identity copied exactly | `PASS` |
| Correlation copied exactly | `PASS` |
| Source timestamp copied exactly | `PASS` |
| Stale event → `UNKNOWN/non-PASS` | `PASS` |
| Future/invalid timestamp → freshness `UNKNOWN` | `PASS` |
| Foreign source component rejected | `PASS` |
| Focused Vitest test shape strict-compiled with local declaration stub | `PASS` |

Not-run evidence remains explicit:

- repository Vitest runner: `NOT RUN`;
- repository-wide TypeScript/lint command: `NOT RUN`;
- `npm run traceability:build`: `NOT RUN` in the connector execution surface;
- Production build: `NOT RUN`;
- hosted GitHub checks: `NOT RUN` before PR creation;
- production/provider verification: `N/A` for this repository-only binding package.

## Exit-gate disposition

This branch provides the previously missing productive source wiring for the OPS/PVC-18 strict binding mechanism:

`real Traceability run → canonical EventMesh publish → returned EventContract → exact identity/correlation/timestamp → strict source record → fail-closed operational projection`.

Branch-level disposition: `IMPLEMENTED_BRANCH / PRE_PR_EVIDENCE_READY`.

This does not independently close Security `S1-R2-11` and does not self-promote Compliance `REQ-COMP-033` to PASS. Independent Security verification and subsequent Compliance reassessment remain separate owner boundaries after normal PR/Human-Merge lifecycle.
