# FE Orchestrator → Graphical Consumer Wiring

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A` — Frontend remains presentation/interaction only  
**Primary Owner:** `CAPITAL-AI-FE`  
**Baseline:** `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/frontend-admin-process-graph-trace-state-20260916`  
**Authorities:** `/AGENTS.md@current-main`, ADR-0087, ADR-0099, ADR-0101, FIN-SEC-02 verified-screening entitlement boundary  
**State:** `IMPLEMENTED_ON_EXISTING_FE_WRITER / HOSTED_VALIDATION_PENDING`

## Objective

Correlate the repository's active orchestrators against their graphical consumers and close only real Frontend transport/projection gaps without creating a second scoring, provider, DQ, IAM, Governance, OPS or execution authority.

## Inventory and disposition

| Orchestrator / authority | Graphical consumer | Current disposition |
|---|---|---|
| `RequestOrchestrator` | `OrchestratorPanel` | already canonical: telemetry/config through the existing orchestrator API + `useOrchestratorTelemetry` |
| `CryptoOrchestrator` | `DeFiOrchestration` research trail | research/enrichment remains `/api/crypto/analyze`, `scoreEligible=false`; canonical score remains separate through `/api/crypto/score` |
| `RawMaterialsOrchestrator` | `RawMaterialsDashboard` research workspace | research `/analyze` and sandbox `/score` remain non-canonical; canonical commodity score remains separate through `/verified-score/:symbol` |
| domain orchestrator structural inventory | `SupervisorDashboard` | already canonical read-only structural status from `/api/admin/orchestrators/status`; no invented latency/activity |
| OPS/PVC-18 trace-state | `AdminProcessGraph` | same existing PR #1021 work package projects upstream effective trace state read-only; no FE decision authority |
| historical `MemeCoinOrchestrator` | none | intentionally not reactivated or graphically wired; no productive authority |

## Closed Frontend gaps

### 1. DeFi canonical score transport

`/api/crypto/score` is part of the global `verified_screening` entitlement gate. `DeFiOrchestration` previously called it with plain `fetch`, while server identity resolves from the verified bearer credential. The canonical score consumer now uses the existing `authFetch` transport. `/api/crypto/analyze` remains a separate research/enrichment call and cannot replace the canonical score.

### 2. Commodity canonical score transport

`/api/raw-materials/verified-score/:symbol` is also a globally gated verified-screening route. `RawMaterialsDashboard` now uses the same existing bearer-aware `authFetch` transport for this canonical leg only. Raw-materials research analysis and manual sandbox scoring remain explicitly non-canonical.

### 3. Intelligence ticker canonical score/provenance

`Newsticker` had two concrete drift defects:

- it called the canonical crypto score route as `GET /api/crypto/score?symbol=...`, while the productive route is `POST /api/crypto/score` with the versioned payload shape;
- it read `providers` / `evidenceIds` from nonexistent top-level crypto result fields even though `CanonicalScoreResult` keeps them under `integrity.providers` and `integrity.evidence`.

The ticker now:

- uses bearer-aware `authFetch` with `POST /api/crypto/score` and `{ symbol, asset_name }`;
- projects canonical provider/evidence identity from `integrity`;
- uses bearer-aware `authFetch` for traditional `/verified-context`;
- reuses the already merged `fetchAuthenticatedNews` helper for the protected `/api/news` surface;
- leaves quote/evidence-only routes on their existing read-only contracts.

## Boundary preservation

This package does **not**:

- add a second Registry or Dispatcher;
- move score computation into React components;
- promote Crypto/Raw-Materials research output into canonical scoring;
- add provider or DATA/DQ logic to Frontend;
- invent orchestrator runtime latency/activity;
- resurrect the dead MemeCoin orchestrator;
- alter IAM/entitlement policy;
- alter the public Enterprise Scorer transport or public-preview contract;
- perform any production, provider, Supabase, Render or billing mutation.

## Regression evidence

`tests/unit/frontendOrchestratorGraphicalWiring.test.ts` locks the following topology:

1. RequestOrchestrator → existing `OrchestratorPanel` telemetry API;
2. structural Crypto/Raw-Materials orchestrator status → `SupervisorDashboard` without fabricated runtime metrics;
3. CryptoOrchestrator research → DeFi research trail while canonical DeFi scoring remains authenticated and Dispatcher-owned;
4. RawMaterialsOrchestrator research → Commodity research workspace while canonical commodity scoring remains authenticated and Dispatcher-owned;
5. Newsticker → correct canonical crypto POST contract, integrity provenance and protected Newsfeed transport.

The existing `cryptoAnalyzeResearchBoundary.test.ts` is updated so changing the DeFi canonical score back to plain unauthenticated `fetch` becomes a regression.

## Validation truth

- repository/source correlation: `PASS` against stated baseline before writes;
- pre-write open-writer correlation: `PASS` for this bounded FE slice; #1021 reused as the existing FE writer rather than creating a parallel orchestrator-UI branch;
- focused Vitest: `NOT RUN` pre-update — no dependency-complete local runner is exposed through the connected GitHub surface;
- TypeScript: `NOT RUN` pre-update;
- browser/mobile readback: `NOT RUN` pre-update;
- hosted checks: triggered by the existing Draft PR after branch updates and must be evaluated on the final exact head before merge readiness.

`NOT RUN` is not `PASS`.

## Exit gate

The bounded Frontend wiring exit is reached when the final exact PR head proves:

- active orchestrators have an authority-correct graphical consumer or are explicitly backend-only/dead by architecture;
- every gated canonical scoring leg in the touched orchestrator UIs uses the existing verified bearer transport;
- Research/Enrichment and Sandbox output remain visibly non-canonical;
- canonical score provenance is projected from its real result contract rather than guessed by the UI;
- the Admin Process Graph remains a read-only PVC-18 trace-state projection;
- no parallel Frontend scoring, DATA, IAM, Governance or execution authority is introduced.
