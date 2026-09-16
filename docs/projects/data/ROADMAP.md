# CAPITAL-AI-DATA — Canonical Roadmap

**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Owner/PVC:** `CAPITAL-AI-DATA / PVC-09, PVC-10, PVC-11`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — DATA automation intake re-correlated after terminal PR #969 and merged DATA PR #974  
**Baseline:** `main@a793c86136c56f82f065c07f854c7c588e1ff7db`  
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

2. **`DATA-09` + `DATA-14` + remaining DATA-owned GOV-07 portion — PVC-09 ingress completion.** Continue canonical provider-ingress convergence without bypassing `MarketDataGateway`; close only the DATA-owned authority-unavailable distinction and vendor-dialect normalization/validation that fits behind the existing canonical provider envelope.
   - **Trigger:** current-main repository evidence identifies an unresolved DATA-owned ingress gap and no protected provider/credential/entitlement mutation is required.
   - **Exit:** provider-specific dialects terminate at validated DATA ingress; unsupported/unauthorized/unavailable conditions remain explicit and cannot become synthetic observations or DQ PASS.

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
| DATA-09 GOV-07 Newsfeed entitlement | PARTIAL — product access closed; authority-unavailable distinction open |
| DATA-10 Evidence Management | IMPLEMENTED — DATA evidence ready / SEC verification open |
| DATA-11 Data Quality | IMPLEMENTED — gate slice ready / source vocabularies retained |
| DATA-12 Provenance | IMPLEMENTED — lineage slice ready / correction version open |
| DATA-13 Freshness | IMPLEMENTED — capability max-age ready / provider overrides open |
| DATA-14 Provider Input Validation | IMPLEMENTED — canonical envelope ready / vendor dialects open |
| DATA-15 Data Contract Testing | READY |
| DATA-16 Evidence | READY / CONTINUOUS |

No synthetic provider data or synthetic DQ PASS. Scoring/ranking remain outside DATA.

## Dependencies
OPS provider/runtime evidence, SEC independent verification, FINTECH PVC-12..17 consumers, QM exact-snapshot evidence.

## Project exit gate
One active DATA roadmap; real provider data reaching product features is provenance/freshness/DQ traceable and all non-terminal baseline work remains represented.
