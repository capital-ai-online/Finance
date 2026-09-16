# FE Orchestrator → Graphical Consumer Wiring

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A` — Frontend remains presentation/interaction only  
**Primary Owner:** `CAPITAL-AI-FE`  
**Baseline:** `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/frontend-admin-process-graph-trace-state-20260916`  
**Authorities:** `/AGENTS.md@current-main`, ADR-0087, ADR-0099, ADR-0101, ESS-0005, FIN-SEC-02 verified-screening entitlement boundary  
**State:** `IMPLEMENTED_ON_EXISTING_FE_WRITER / EXACT_HEAD_VALIDATION_PENDING`

## Objective

Correlate the repository's active orchestrators against their graphical consumers and close only real Frontend transport/projection gaps without creating a second scoring, provider, DQ, IAM, Governance, Quality, OPS or execution authority.

## Inventory and disposition

The current-main code search for exported/top-level orchestrator classes resolves the productive orchestration surfaces below. Helper types such as `OrchestratorAgentRuntimeProjection` are internal projection/instrumentation components rather than an independent business orchestrator; `MarkdownOrchestrator` is itself a React presentation component rather than a backend orchestration authority.

| Orchestrator / authority | Graphical consumer | Current disposition |
|---|---|---|
| `RequestOrchestrator` | `OrchestratorPanel` | already canonical: telemetry/config through the existing orchestrator API + `useOrchestratorTelemetry` |
| `CryptoOrchestrator` | `DeFiOrchestration` research trail | research/enrichment remains `/api/crypto/analyze`, `scoreEligible=false`; canonical score remains separate through `/api/crypto/score` |
| `RawMaterialsOrchestrator` | `RawMaterialsDashboard` research workspace | research `/analyze` and sandbox `/score` remain non-canonical; canonical commodity score remains separate through `/verified-score/:symbol` |
| `QualityCenterOrchestrator` | `QualityCenterPanel` via immutable `QualityCenterReport` snapshot | already canonical: build-time orchestration materializes quality evidence; runtime `GET /api/admin/quality-center` is read-only/admin-gated and deliberately does **not** instantiate the orchestrator in the request path |
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

### 4. Quality Center orchestration classification

The final repository-wide inventory identified `QualityCenterOrchestrator` as an additional active orchestrator class. It is already wired according to its existing authority model: repository/build automation produces the immutable `QualityCenterReport`; the graphical `QualityCenterPanel` reads only `GET /api/admin/quality-center`. The server route enforces `checkAdminAccess(..., 'quality-center:read', DIAGNOSTIC_ZONE_ROLES)`, exposes only `GET`, requires release/snapshot identity, and explicitly contains no `QualityCenterOrchestrator` execution. No new live orchestration endpoint or second Quality authority is introduced.

## Boundary preservation

This package does **not**:

- add a second Registry or Dispatcher;
- move score computation into React components;
- promote Crypto/Raw-Materials research output into canonical scoring;
- execute QualityCenterOrchestrator from an HTTP request;
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
3. QualityCenterOrchestrator build evidence → read-only/admin-gated `QualityCenterPanel`, with no live orchestrator execution in the request route;
4. CryptoOrchestrator research → DeFi research trail while canonical DeFi scoring remains authenticated and Dispatcher-owned;
5. RawMaterialsOrchestrator research → Commodity research workspace while canonical commodity scoring remains authenticated and Dispatcher-owned;
6. Newsticker → correct canonical crypto POST contract, integrity provenance and protected Newsfeed transport.

The existing `cryptoAnalyzeResearchBoundary.test.ts` is updated so changing the DeFi canonical score back to plain unauthenticated `fetch` becomes a regression.

## Validation truth

- repository/source correlation: `PASS` against stated baseline before writes;
- pre-write open-writer correlation: `PASS` for this bounded FE slice; #1021 reused as the existing FE writer rather than creating a parallel orchestrator-UI branch;
- prior exact head `bba558b28bd9ccc72dced1cbb826c879aaf9611a`: hosted CI, Governance and Container Security `PASS` before the final Quality-inventory-only test/evidence extension;
- focused Vitest: `NOT RUN` locally — no dependency-complete local runner is exposed through the connected GitHub surface;
- TypeScript: `NOT RUN` locally;
- browser/mobile readback: `NOT RUN` locally;
- final exact-head hosted checks: must be evaluated after this final test/evidence extension before merge readiness.

`NOT RUN` is not `PASS`.

## Exit gate

The bounded Frontend wiring exit is reached when the final exact PR head proves:

- all active top-level orchestrator classes are accounted for with an authority-correct graphical consumer, an explicitly snapshot-mediated projection, or an explicit backend-only/dead classification;
- every gated canonical scoring leg in the touched orchestrator UIs uses the existing verified bearer transport;
- Research/Enrichment and Sandbox output remain visibly non-canonical;
- canonical score provenance is projected from its real result contract rather than guessed by the UI;
- Quality evidence remains snapshot-mediated/read-only rather than live request orchestration;
- the Admin Process Graph remains a read-only PVC-18 trace-state projection;
- no parallel Frontend scoring, DATA, IAM, Governance, Quality or execution authority is introduced.
