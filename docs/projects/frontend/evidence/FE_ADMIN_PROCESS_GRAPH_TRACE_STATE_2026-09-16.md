# FE Admin Process Graph — PVC-18 Trace-State Binding Evidence

**Date:** 2026-09-16  
**Repository:** `capital-ai-online/Finance`  
**Current Project:** `CAPITAL-AI-FE`  
**Current Project Folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A — cross-cutting Frontend presentation; no productive PVC ownership`  
**Primary Owner:** `CAPITAL-AI-FE`  
**Execution baseline:** `main@5b93207cfa163ddd883870a11a422f96d0128d6c`  
**Branch:** `agent/frontend-admin-process-graph-trace-state-20260916`  
**Parent operational-state owner:** `CAPITAL-AI-OPS / PVC-18 — EventMesh / Traceability`  
**Work package:** Admin Process Graph read-only operational-state consumer binding

## Objective

Bind the existing canonical Admin Process Graph presentation to the already established PVC-18 `OperationalTraceStateEnvelope` without creating Frontend-local process status, evidence, Traceability, EventMesh, Governance or decision authority.

The structural graph remains defined by repository contracts:

- `docs/projects/PROJECT_VALUE_CHAIN.md` — canonical `PVC-01..PVC-18` structure and Primary Owners;
- `docs/projects/README.md` — canonical project-folder mapping;
- `docs/projects/operations/DEVELOPMENT_CHAIN.md` — structural DC lifecycle;
- `/AGENTS.md` — Human/Owner authority and repository trust root.

Operational state is a separate projection and must not be inferred from those structural documents.

## Current-main finding

Before this slice, `src/features/governance/ui/process-graph/processGraphModel.ts` hardcoded presentation state:

- every PVC node: `state: 'unknown'`;
- every DevelopmentChain node: `state: 'unknown'`;
- evidence gate: `state: 'waiting-for-evidence'`;
- owner gate: `state: 'unknown'`;
- `operationalStateAvailable: false` unconditionally.

That behavior correctly failed closed for absent evidence but could not consume the already merged OPS PVC-18 state contract.

Current main already provides the canonical upstream contract:

- `src/platform/Traceability/Contracts/OperationalTraceStateContract.ts`;
- `src/platform/Traceability/Services/OperationalTraceStateProjection.ts`;
- `src/platform/Traceability/Services/TraceabilityEventOperationalSource.ts`;
- `docs/projects/operations/eventmesh/GOV08_OPERATIONAL_TRACE_STATE_CONTRACT.md`.

The upstream contract is explicitly `EVIDENCE_ONLY`, has no decision/merge/release/deployment authority and requires missing/stale/invalid evidence to fail closed to effective `UNKNOWN`.

## Implemented FE consumer boundary

The canonical `process-graph` feature now accepts only the **effective** `OperationalTraceStateEnvelope` produced by PVC-18.

Frontend does not consume `OperationalTraceStateSourceRecord` and does not map `reportedState` directly. It renders only the already normalized effective `state` and `validation` fields.

Effective mapping is deliberately mechanical:

```text
CURRENT -> current
BLOCKED -> blocked
WAITING -> waiting-for-evidence
UNKNOWN -> unknown
```

No other operational state is invented by FE.

For PVC nodes, records are matched only by the canonical `identity.pvcId`. `PVC-01..18` themselves remain parsed from `PROJECT_VALUE_CHAIN.md`; the state envelope cannot add, remove, renumber or re-own a PVC stage.

For non-PVC process nodes, state can be projected only from an exact source-owned `identity.statusId` match.

When multiple effective records match one graph node, FE renders their state only when all records already agree. Conflicting effective records resolve to `unknown` with an ambiguity explanation; FE does not establish severity, recency, majority, precedence or other aggregation rules.

## Historical-state boundary

The Admin graph presentation type continues to support the requested visual state `historical`, because GOV-08 distinguishes historical/non-authorizing evidence from current operational state.

However, the **current OPS contract does not expose `HISTORICAL`**. Its operational vocabulary is exactly:

```text
CURRENT | BLOCKED | WAITING | UNKNOWN
```

Therefore this FE slice does **not** derive `historical` locally. In particular:

```text
STALE != historical
```

Under the current PVC-18 contract, stale or unknown freshness is normalized upstream to effective `UNKNOWN`; the graph renders `unknown` accordingly. A real `historical` graph state requires an explicit source-owned/upstream semantic extension or a separately authoritative historical-evidence classification from the responsible owner. FE must not guess it.

## Evidence drill-down

When a valid effective envelope is supplied, the UI may display read-only explanatory metadata already carried by that envelope, including:

- projection `generatedAt`;
- source-owned `statusId` values;
- evidence references;
- effective validation state;
- provenance source;
- source timestamp;
- whether multiple effective records conflict.

These fields are explanatory evidence only. They do not create approval, mergeability, releaseability or deployability.

## Runtime transport finding / foreign-owner dependency

`npm run traceability:build` runs `src/platform/Traceability/Services/runTraceability.ts`, which writes the evidence-only projection to:

```text
.ai/knowledge/traceability/operational-state.json
```

At the current baseline this generated file is not committed to main, and repository search found no current authenticated browser/API route that serves an `OperationalTraceStateEnvelope` to the Admin UI.

Therefore the existing mounted `AdminPortal -> AdminProcessGraph` path can become **consumer-ready** in this FE slice, but live Production node states remain `unknown` until an owner-correct OPS/CLIENT composition or authenticated read-only transport supplies the actual current envelope.

Frontend deliberately does not:

- scrape repository/evidence Markdown to invent live state;
- read a build-time historical snapshot and present it as current runtime truth;
- create a second EventMesh/Traceability store;
- add a Frontend-owned server endpoint for OPS state;
- classify stale data as historical;
- change `src/components/AdminPortal.tsx` with new domain logic.

Exact foreign-owner return required for full runtime closure:

1. `CAPITAL-AI-OPS / PVC-18` exposes the current effective `OperationalTraceStateEnvelope` through an already-governed authenticated read-only transport/composition boundary suitable for the Admin consumer; and
2. if `historical` must be operationally selectable, the responsible upstream authority explicitly supplies that semantic rather than FE deriving it.

## Legacy / strangler handling

No new Legacy integration was created. The productive implementation remains under:

`src/features/governance/ui/process-graph/`

`src/components/AdminPortal.tsx` remains the existing compatibility/strangler composition point only. This slice adds no new business/status logic under `src/components/`.

## Validation status

Pre-PR execution evidence at document creation:

- static repository/contract correlation: `PASS`;
- current-main trust-root readback: `PASS`;
- open-writer/file/authority correlation before implementation: `PASS` for this bounded FE slice;
- focused Vitest: `NOT RUN` in this connector execution surface;
- TypeScript / `tsc --noEmit`: `NOT RUN` pre-PR;
- Frontend architecture check: `NOT RUN` pre-PR;
- Production build: `NOT RUN` pre-PR;
- browser/Admin live state readback: `NOT RUN` because no current OPS browser transport exists.

`NOT RUN` is not `PASS`.

## Exit-gate assessment

| Condition | State |
|---|---|
| PVC-01..18 structure comes only from `PROJECT_VALUE_CHAIN.md` | SATISFIED |
| Project folders come only from canonical project mapping | SATISFIED |
| Visible operational status is no longer hardcoded per node | SATISFIED in FE model |
| FE consumes effective OPS state rather than `reportedState` | SATISFIED |
| Missing/invalid/conflicting state fails closed to `unknown` | SATISFIED by implementation; executable test pending hosted validation |
| `historical` is not invented from stale evidence | SATISFIED |
| Runtime browser receives real current PVC-18 envelope | OPEN — OPS/CLIENT transport/composition return required |
| FE-local Governance/Traceability/status authority introduced | NO |
| Human/CODEOWNER merge authority changed | NO |
