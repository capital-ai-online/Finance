# CAPITAL-AI-DATA — Repository & Runtime Baseline

**Observed baseline:** `main@7fa5cfddcdb775078e1518bef4908af2e8706415`  
**Observed open PRs:** none at synchronization correlation  
**Active DATA branch:** `agent/data-security-handoff-sync-20260831`  
**Superseded working branch:** `docs/data-project-consolidation-20260831` — non-conforming under current branch policy; no further protected writes

## Coordination baseline

Security PR #631 is merged. Its Security artifacts remain current source inputs, while Security verification remains external to DATA.

Operations PR #632 is merged and supplies `docs/projects/operations/**`. It has no changed-file overlap with `docs/projects/data/**`; its semantic overlap is consistent with the S1-R2-11 boundary because OPS owns any future PR/trace/DevelopmentChain tooling remediation.

FINTECH PR #635 is merged and supplies `docs/projects/fintech/**`. It confirms the downstream project boundary: DATA owns `PVC-09..11`, FINTECH owns `PVC-12..17`, and the project handoff is `PVC-11 -> PVC-12`.

QM PR #636 is merged and supplies `docs/projects/quality-management/**`. QM remains an independent read-only assessment surface and does not become a productive DATA hot-path dependency or acquire DATA PVC ownership.

Social PR #637 is merged after the prior DATA correlation and adds only `docs/social-media/CAPITAL-AI-SOCIAL/**`. It has no changed-file overlap with the 11 DATA candidate paths and no semantic ownership conflict: CAPITAL-AI-SOCIAL remains cross-cutting without productive DATA PVC ownership.

No open PR was found at synchronization correlation, and no current changed-file writer overlaps the 11 DATA branch paths.

`CAPITAL-AI-DOC / PVC-03` remains a recorded documentary dependency, but current main does not yet expose a canonical `docs/projects/<doc>/` project folder. DATA records that target-folder state as `REQUIRES_CORRELATION` and does not guess or create the foreign project surface.

## Namespace resolution

Current main defines:

- `PVC-09` — UAI / Data Ingestion — `CAPITAL-AI-DATA`;
- `PVC-10` — Evidence Management — `CAPITAL-AI-DATA`;
- `PVC-11` — Data Quality — `CAPITAL-AI-DATA`;
- `PVC-12` — Feature Engineering — `CAPITAL-AI-FINTECH`.

`PVC-*` is organizational project routing only. Existing technical financial `VC-*` identifiers under `SC-MD-SPT-0001` remain unchanged. The former “VC-09..11 collision” is therefore no longer an active blocker and must not be carried forward as current state.

## Security correlation

Source:

- PR #631 — `[CAPITAL-AI-SEC] - PR 631 - Security-Konsolidierung und PVC-Handoffs`;
- Security merge identity `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`;
- current repository main `7fa5cfddcdb775078e1518bef4908af2e8706415`;
- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`.

Current Security finding routed to DATA:

- `S1-R2-11 — Evidence identity and stale-state automation`;
- target `CAPITAL-AI-DATA`;
- `target_project_folder: docs/projects/data/`;
- `primary_owner: CAPITAL-AI-DATA`;
- `project_namespace: PVC`;
- `project_stage: PVC-10`;
- source state `WAITING_FOR_EVIDENCE`;
- Security verification remains independent;
- OPS owns any future PR/trace/DevelopmentChain tooling-code remediation.

## Runtime inventory

| Concern | Current implementation | Baseline assessment |
|---|---|---|
| UAI contract | `src/platform/Scoring/contracts.ts` (`uai/1.0.0`) | Identity semantics are DATA-owned even though the file also contains downstream scoring contracts; provider symbols remain identity mappings, not evidence |
| UAI construction | `src/platform/Scoring/UniversalAssetAdapter.ts` | Semantically DATA-owned identity boundary; physical relocation is not required for ownership clarification |
| Snapshot ingress | `src/platform/MarketData/MarketDataGateway.ts` | Strong canonical candidate; provider exceptions/invalid/stale outcomes fail closed |
| History ingress | `src/platform/MarketData/MarketDataHistoryGateway.ts` | Separate capability path; should converge on shared policy/identity/provenance semantics |
| Provider registry/routing | `ProviderRegistry.ts`, `ProviderRouter.ts`, `ProviderMatrix.ts` | Reusable DATA control plane |
| Resilience | `CircuitBreaker.ts`, `RateLimitBudget.ts`, `MarketDataCache.ts`, `RequestCoalescer.ts` | Reusable ingress controls |
| Snapshot DQ | `DataQualityService.ts` | Validates provider/symbol/correlation/timestamps/positive finite price and freshness |
| Evidence DQ | `evidenceQualityContracts.ts` | Asset-class-neutral evidence/freshness/provenance admissibility contract |
| Composite DQ | `CompositeDataQuality.ts` | Mixed ownership: DQ plus Confidence/Ranking helpers |
| Evidence identity | `CryptoEvidenceIdentityRegistry.ts` | Useful but crypto-specific; canonical DATA evidence identity should be asset-class-neutral |
| Quote evidence | `cryptoQuoteEvidence.ts`, `traditionalQuoteEvidence.ts` | Gateway-backed compatibility facades; crypto is still provider-pinned in one path |
| Provider adapters | `src/platform/MarketData/providers/**` | Preserve domain/provider specifics behind canonical contracts |
| Legacy market-data compatibility | `server/marketData/marketDataCompatibilityFacade.ts` | Compatibility path appends fallback catalog rows but explicitly treats them as non-evidence; must be retired/constrained rather than promoted into canonical DATA |
| Provider observability | `providerRuntimeObservability.ts` + Supervisor health | OPS handoff/observability; provider payload semantics remain DATA-owned |
| Active DQ architecture doc | `docs/architecture/DATENQUALITAETSSCHICHT.md` | Current section aligns to ADR-0032/SPT; historical fallback/simulated descriptions are not verified current evidence |

## Data-integrity findings

### 1. DQ vocabularies are not yet one contract

Current snapshot state uses `LIVE | DELAYED | HISTORICAL | STALE | DEGRADED | UNAVAILABLE | INVALID`. Evidence DQ uses `VERIFIED | STALE | UNAVAILABLE | INVALID | CONFLICTING | NOT_APPLICABLE`. The DATA exit requires `PASS | PARTIAL | FAIL | NOT_COMPUTABLE | STALE | MISSING | UNKNOWN`.

These must be mapped through an explicit transition table; string substitution or optimistic defaults would violate fail-closed semantics.

### 2. UAI identity and downstream scoring contracts are physically colocated

`src/platform/Scoring/contracts.ts` contains the identity-only UAI contract and downstream scoring registry/result contracts. DATA ownership should be semantic first; a source move is justified only if it reduces dependency ambiguity without creating compatibility churn.

### 3. DQ and downstream decision helpers are colocated

`CompositeDataQuality.ts` contains pure DQ, `computeUnifiedConfidence`, and `compositeLevelToRankingDqPoints`. DATA may own the DQ portion, but confidence/ranking semantics belong downstream.

### 4. Provider paths are only partially homogeneous

SC-4/SC-5 evidence shows the gateway/matrix architecture is established but not every crypto quorum/history/provider path is consumed through one homogeneous runtime composition.

### 5. Compatibility fallback data remains in a legacy ingress surface

`marketDataCompatibilityFacade.ts` can append registry fallback rows for legacy `/api/market-data` consumers, but its own contract excludes those rows from evidence enrichment, periodic snapshots and alerts. Compatibility metadata is not admissible evidence.

### 6. Evidence identity is narrower than the target boundary

Evidence references exist in canonical market data and evidence-quality records, but explicit evidence identity registry logic is currently crypto-specific. DATA needs one generalized identity/provenance contract before calling the Evidence boundary complete.

### 7. Correction-version lineage is still an open architecture gap

`DATENQUALITAETSSCHICHT.md` explicitly excludes correction-history/versioning from its current scope.

### 8. Security stale/current identity evidence is an explicit open verification dependency

S1-R2-11 requires evidence that current/stale/refresh/retry states bind to immutable identities and cannot self-authorize. This is a DATA/PVC-10 requirement. It is not yet implementation evidence.

### 9. Quality Management must remain outside the hot path

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` is read-only/non-authorizing. Productive DATA runtime must not depend on Quality Center assessment.

## Migration posture

- prefer ownership mapping over source moves;
- consolidate contracts first, consumers second;
- maintain compatibility facades only while inbound consumers exist;
- no synthetic fallback during migration;
- preserve exact evidence/provenance fields during adapter conversion;
- hand off scoring/confidence/ranking work instead of modifying it in DATA;
- return Security evidence without self-setting `VERIFIED/CLOSED`;
- route PR/trace tooling remediation to OPS rather than absorbing it into DATA.
