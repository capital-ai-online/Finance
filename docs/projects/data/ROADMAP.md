# CAPITAL-AI-DATA — Canonical Roadmap

**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Owner/PVC:** `CAPITAL-AI-DATA / PVC-09, PVC-10, PVC-11`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — DATA-09 PVC-09 ingress re-correlated after terminal PR #998; provider source-timestamp validation materialized from current-main evidence  
**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### DATA-CARRY-01 — Existing non-terminal DATA backlog
Carry forward every non-terminal DATA ingestion, provenance, freshness, quality, lineage, authorization and evidence package.

### DATA-PR900-01 — Fail-closed DQ handoff
Preserve `PVC-11 → PVC-12` as a fail-closed Data Quality handoff. Provider provenance, freshness and DQ state must remain visible to FINTECH consumers.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #974 (`merge SHA a357cc8c56588fc19b84ba19c28ad6b289c4023b`). `src/platform/MarketData/FintechDataHandoff.ts` projects canonical `ValidatedDataInput` fail-closed into downstream numeric observations; blocking states retain evidence but export no numeric observations.

**Exit:** unverifiable/stale/wrong-identity data cannot silently enter feature/scoring stages. `PASS` — PR #974 exact-head CI, Governance, selective CodeQL and Container Security completed successfully before merge.

### DATA-PR900-02 — Evidence freshness semantics
Close S1-R2-11 with reproducible current/stale/wrong-identity semantics under PVC-10.

**Exit:** evidence freshness can be tested and produces deterministic non-synthetic outcomes.

### DATA-PR900-03 — Authorization/data-owner coverage
For DATA-owned routes/objects/fields, provide cross-role/cross-user negative evidence required by SEC V8 coverage; foreign route owners retain their own slices.

### DATA-PR900-04 — Product-chain lineage return
Provide exact lineage/provenance inputs required for canonical FINTECH feature/scoring/ranking; do not fill missing scores/data with frontend or synthetic fallback.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #974 (`merge SHA a357cc8c56588fc19b84ba19c28ad6b289c4023b`). The DATA-owned handoff preserves UAI, provider/feed, evidence reference, observed/retrieved timestamps, freshness bounds and correlation identity for admissible numeric observations without implementing FINTECH scoring or ranking.

## DATA-AUTO-01 — Ordered DATA Roadmap automation enrollment

The earlier branch `agent/data-roadmap-automation-intake-20260916` is a stale coordination source only and MUST NOT be used as an execution baseline. It diverged materially from current main and incorrectly still treated `DATA-PR900-01` / `DATA-PR900-04` as non-terminal. This current-main projection supersedes that stale planning state without creating a second queue, registry, roadmap or authority plane.

The ordered DATA lane reuses `/AGENTS.md` sequencing and remains owned by `CAPITAL-AI-DATA / PVC-09..11`. `PVC-11 -> PVC-12` remains the fail-closed handoff to `CAPITAL-AI-FINTECH`; FINTECH feature engineering/scoring/ranking, SEC independent verification, OPS provider/runtime control and protected external mutations remain outside DATA ownership.

### Automated DATA execution chain

1. **`DATA-PR900-01` + `DATA-PR900-04` — fail-closed DATA -> FINTECH handoff.**
   - **State:** `DONE_MAIN / TERMINAL` via PR #974.
   - **Evidence:** current main contains `FintechDataHandoff.ts` and `dataFintechHandoff.test.ts`; PASS path preserves UAI/provider/evidence/freshness/correlation lineage, while `STALE`, `MISSING`, `UNKNOWN`, wrong-identity, incomplete-provenance and aggregate-status mismatch export zero numeric FINTECH observations.
   - **Continuation:** do not reopen or reimplement this slice unless later current-main evidence proves regression.

2. **`DATA-09` + `DATA-14` + `DATA-09-GOV-07` — PVC-09 ingress completion.** Continue canonical provider-ingress convergence without bypassing `MarketDataGateway`; close only DATA-owned authority-unavailable distinctions and vendor-dialect normalization/validation that fit behind the existing canonical provider envelope. `DATA-09-GOV-07` is the unique DATA work-item identity for the DATA-owned GOV-07 newsfeed-entitlement return and is distinct from the general `DATA-09` UAI/ingress item.
   - **Current-main correlation:** `cryptoSpotConsensus.ts` already consumes CoinAPI/TwelveData/EODHD through `MarketDataGateway`; the historical SC-5 text that described raw direct consensus fetchers is stale context and is not execution authority. `realtimeAiNewsfeedEntitlement.ts` already represents authoritative lookup failure as `503 / entitlement-authority-unavailable`; DATA records that repository evidence without claiming GOV/SEC verification authority.
   - **Trigger:** current-main repository evidence identifies an unresolved DATA-owned ingress gap and no protected provider/credential/entitlement mutation is required.
   - **Exit:** provider-specific dialects terminate at validated DATA ingress; unsupported/unauthorized/unavailable conditions remain explicit and cannot become synthetic observations or DQ PASS.

### DATA-09-TS-01 — Provider source-timestamp provenance hardening

**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`  
**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Evidence:** `docs/projects/data/evidence/DATA_09_PROVIDER_TIMESTAMP_VALIDATION_2026-09-16.md`

Current-main inspection found that the canonical gateway/DQ layer already rejects a priced snapshot without a valid source timestamp, but CoinAPI, TwelveData and CoinGecko adapters could replace a missing provider timestamp with local retrieval time, and EODHD could replace a missing source date while not strictly rejecting invalid calendar dates. This slice removes those substitutions at the provider-dialect boundary. A valid price with absent/malformed provider time now yields `UNAVAILABLE`, `price=null`, `sourceTimestamp=null` and no evidence ID.

This package does not alter provider roles, routing, credentials, entitlements, rate limits, provider activation, deployment, execution eligibility, scoring or ranking. `DATA-09` remains `READY / ACTIVE BACKLOG` because broader ingress convergence is intentionally not declared complete by this bounded remediation.

3. **`DATA-10` + `DATA-12` + `DATA-13` + `DATA-PR900-02` — PVC-10 evidence/provenance/freshness completion.** Reuse the implemented evidence-identity, provenance-lineage and capability-max-age nucleus; close only still-open DATA-owned correction-version/provider-override semantics and provide current evidence for independent Security verification.
   - **Trigger:** an unresolved DATA-owned semantic gap remains after current-main re-read; SEC-only verification remains dependency-held rather than reimplemented by DATA.
   - **Exit:** current/stale/wrong-identity and correction/freshness outcomes are deterministic, provenance-complete and non-synthetic; DATA evidence is sufficient for SEC to verify independently.

4. **`DATA-11` + `DATA-15` + `DATA-PR900-03` — PVC-11 contract and negative-boundary evidence.** Extend contract tests and DATA-owned cross-role/cross-user negative evidence only for DATA-owned routes, objects and fields; foreign-owner slices remain routed to their canonical owners.
   - **Trigger:** exact DATA-owned route/object/field scope is resolved from then-current main.
   - **Exit:** malformed, stale, missing, unauthorized or wrong-owner inputs fail closed at DATA boundaries and cannot cross into downstream numeric processing.

5. **`DATA-16` — continuous DATA evidence.** Refresh DATA-owned evidence after each completed slice and preserve downstream lineage inputs without manufacturing scores, rankings or synthetic fallback values.
   - **Trigger:** completion of any DATA automation slice.
   - **Exit:** current-main implementation, tests and evidence agree on provider identity, UAI, provenance, freshness, DQ and downstream handoff state.

### Dependency-held boundaries

- `CAPITAL-AI-SEC` retains independent verification authority for S1-R2-11 and V8 negative coverage.
- `CAPITAL-AI-OPS` retains provider/runtime, release, deployment and execution-control ownership where applicable.
- `CAPITAL-AI-FINTECH / PVC-12..17` owns downstream feature engineering, scoring, orchestration, analysis and ranking.
- Provider credentials, entitlements, live provider configuration and other protected external mutations remain separate Human/Owner-gated work.
- `NOT RUN`, `WAITING`, `BLOCKED`, `STALE`, `MISSING`, `UNKNOWN` or `NOT_COMPUTABLE` must never be converted into `PASS` or synthetic numeric input.

## Carried-forward baseline (pre-2026-09-13)

| ID | State |
|---|---|
| DATA-09 UAI / Data Ingestion | READY / ACTIVE BACKLOG |
| DATA-09-GOV-07 Newsfeed entitlement | IMPLEMENTED / EVIDENCE_READY — authority-unavailable behavior present; GOV/SEC reassessment external |
| DATA-10 Evidence Management | IMPLEMENTED — DATA evidence ready / SEC verification open |
| DATA-11 Data Quality | IMPLEMENTED — gate slice ready / source vocabularies retained |
| DATA-12 Provenance | IMPLEMENTED — lineage slice ready / correction version open |
| DATA-13 Freshness | IMPLEMENTED — capability max-age ready / provider overrides open |
| DATA-14 Provider Input Validation | IMPLEMENTED / PARTIAL — canonical envelope ready; provider source-time dialect hardening materialized; broader vendor dialects open |
| DATA-15 Data Contract Testing | READY |
| DATA-16 Evidence | READY / CONTINUOUS |

No synthetic provider data or synthetic DQ PASS. Scoring/ranking remain outside DATA.

## Dependencies
OPS provider/runtime evidence, SEC independent verification, FINTECH PVC-12..17 consumers, QM exact-snapshot evidence.

## Project exit gate
One active DATA roadmap; real provider data reaching product features is provenance/freshness/DQ traceable and all non-terminal baseline work remains represented.
