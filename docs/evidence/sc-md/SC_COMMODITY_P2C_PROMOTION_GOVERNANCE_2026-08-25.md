# SC Commodity P2-C — Canonical Path Audit & Promotion Governance

**Date:** 2026-08-25  
**Scope:** SC-2 Commodity / Rohstoffe Orchestrator  
**Base:** `main@0743e66742519a452a0633734685d4115e71150d`  
**Parent authorities:** ADR-0087, ADR-0101, Development Chain Execution Policy 2.0.0  
**Owner reference:** Google Drive Commodity Orchestrator documentation supplied 2026-08-23  
**Roadmap issues:** read-only; issue state/checkboxes are not implementation authority in this workstream.

## 1. Purpose

This evidence reconciles the canonical Commodity path against the actual repository after merged PRs #513, #518, #519 and #521 and establishes the next P2-C governance boundary. It distinguishes:

- code that is already merged and active on `main`;
- validation/research contracts that exist but still lack empirical evidence;
- future productive integration that remains blocked;
- stale documentation or coordination metadata that must not be interpreted as runtime authority.

## 2. Canonical path audit

| Canonical stage | Repository authority / implementation | Audit result | Remaining gate |
|---|---|---|---|
| Roadmap / authority | SC-2 Commodity Roadmap, ADR-0087, ADR-0101 | Present; roadmap baseline checkbox projection is stale | status projection must follow merged code/evidence, not old checkboxes |
| Work-claim coordination | `.ai/work-claims/*` + Development Chain Execution Policy 2.0.0 | PR #521 claim was persistently stale after terminal merge; fixed in this branch to `released`, `exclusive=false` | current P2-C claim must be released after terminal PR event |
| UAI identity | `UniversalAssetAdapter` + Commodity research classifier | Implemented | `commodity-resource-project` remains intentionally separate future model |
| Provider inventory / transport | `ProviderMatrix`, `ResearchEvidenceProviderHttp`, `MarketDataHistoryGateway` | Implemented for Commodity research/evidence | empirical provider resilience window still required for promotion |
| Commodity feature contracts | `CommodityResearchModelContracts` | Implemented for Energy, Industrial Metals, Precious Metals, Agriculture | empirical calibration remains P2 evidence work |
| DQ / hard gates | Commodity DQ 1.1.0 + shared `evaluateDataQualityGate` | Implemented, fail-closed | production/shadow monitoring still future P3 evidence |
| Registry | `ScoringModelRegistry` | One productive Commodity champion plus four non-executable challengers | no category challenger may become champion through P2-C code |
| Dispatcher | `ScoringDispatcher` | remains sole productive scoring execution authority | unchanged in P2-C |
| Current productive Commodity score | `commodity-evidence-scoring@1.0.0` | remains canonical champion | rollback target for future controlled category promotion |
| Category challenger evaluator | `CommodityCategoryResearchEvaluation` | research-only deterministic evaluation | no runtime composite/executable weights yet |
| Weight/correlation validation | `CommodityModelValidation` | P2-A validation foundation implemented | real correlation/sensitivity evidence must be generated per domain |
| PIT/backtest contracts | `CommodityBacktestingContracts` | implemented | empirical source-backed datasets/runs remain necessary |
| Walk-forward/OOS engine | `CommodityHistoricalBacktestEngine` | implemented, validation-only | must run against real immutable PIT datasets |
| Historical vintage governance | `CommodityHistoricalVintage` + official acquisition service | implemented | archived EIA/USDA/CFTC release captures and real domain datasets still required |
| P2-C descriptor/promotion review | `CommodityModelPromotion` | implemented in this branch as fail-closed review contract | requires real P2 evidence before `readyForOwnerReview` |
| CanonicalScoreResult / ranking for category challengers | existing global contracts only | not integrated for new category challengers | P2-D after model review evidence |
| Legacy RawMaterials routes/UI | `/list`, `/analyze`, `/score`, `RawMaterialsScoringService`, dashboard consumers | still present but explicitly non-canonical | P2-E after replacement consumer path exists |
| Shadow runtime / observability | no productive category shadow runtime | open | P3-A |
| Commodity universe SLA | no verified 24-asset category SLA package | open | P3-B |
| Champion promotion | no category challenger promoted | correctly blocked | P3-C + explicit Human/Owner decision |
| Resource project valuation | UAI identity boundary only | intentionally separate | P3-D follow-up |

## 3. Merged implementation evidence

### P0/P1 — merged PR #513

Implemented:

- RawMaterials research-only authority boundary;
- UAI Commodity category classification;
- category-specific feature/DQ contracts;
- four `scoreEligible=false` challengers in the existing Registry;
- TwelveData commodity history behind shared provider governance;
- EIA, USDA FAS PSD, CFTC COT, USGS MCS and EU-CRMA evidence adapters;
- source-specific freshness, missing/stale/invalid fail-closed semantics;
- no second Dispatcher, Registry or generic DQ service.

### P2-A / P2-B Foundation — merged PR #518

Implemented:

- factor-level research candidate weights;
- within-latent-factor-only renormalization;
- normalized feature correlation diagnostics;
- sensitivity/weight-stability contracts;
- point-in-time feature values with `observedAt` / `availableAt` / `retrievedAt`;
- cost assumptions and validation-only backtest result contract.

### Historical Walk-forward/OOS — merged PR #519

Implemented:

- immutable historical dataset contract;
- content-addressed dataset fingerprint;
- universe-membership evidence;
- normalization evidence;
- walk-forward / expanding-window temporal split planning;
- outcome-leakage prevention;
- benchmark coverage;
- validation-only OOS metrics and evidence fingerprint.

### Historical Vintage Acquisition — merged PR #521

Implemented:

- `PIT_VERIFIED`, `CURRENT_HISTORY_ONLY`, `REFERENCE_STATIC`, `INVALID` evidence grades;
- source-specific release/revision/availability requirements;
- current EIA/USDA/CFTC history cannot masquerade as historical PIT evidence;
- USGS annual release-time semantics;
- CRMA versioned numerical assessment semantics;
- PIT-only dataset assembly into the #519 validation engine.

## 4. P2-C design implemented in this branch

### Immutable descriptor

`commodity-model-descriptor/1.0.0` binds:

- model and feature contract versions;
- weight, DQ, correlation, stability, backtest and historical-vintage contract versions;
- candidate weight profile and canonical existing effective-weight fingerprint;
- supported provider/evidence sources;
- `validFrom` and optional `validUntil`;
- dataset, normalization, calibration, backtest, OOS, correlation and sensitivity lineage;
- challenger-only lifecycle with `runtimeExecutable=false`, `canonical=false`, `scoreEligible=false`.

The descriptor is content-addressed. Existing raw SHA-256 formats for weight/dataset fingerprints are reused; the new descriptor fingerprint does not redefine them.

### Provider resilience evidence

`commodity-provider-resilience/1.0.0` evaluates explicit versioned policy thresholds over provider observations:

- sample count;
- availability rate;
- freshness pass rate;
- error rate;
- circuit-open events;
- optional P95 latency;
- source evidence ID.

No caller `pass=true` field exists. Required supported sources must be present in the promotion review package.

### Stress/regime evidence

`commodity-model-stress-evidence/1.0.0` requires explicit scenario IDs and evaluates:

- OOS evidence binding;
- leakage-free status;
- optional minimum Rank IC;
- optional maximum absolute drawdown;
- optional maximum turnover.

A missing required scenario or policy violation blocks review readiness.

### Promotion review package

`commodity-model-promotion-package/1.0.0` composes:

- immutable descriptor validation;
- weight/correlation/sensitivity completeness;
- actual PIT/OOS backtest result;
- provider resilience;
- stress/regime evidence;
- current Champion versus category Challenger diff;
- rollback target.

The package remains `registryMutationPerformed=false`, `canonical=false`, `scoreEligible=false` even when all evidence is complete.

### Owner decision binding

`commodity-owner-promotion-decision/1.0.0` can validate an explicit `HUMAN_OWNER` decision only against the exact package fingerprint. It is an evidence contract, not a Registry mutation function. A future controlled promotion remains a separate fresh-branch repository change after all P2/P3 gates.

## 5. Current implementation status projection

| Phase | Status | Evidence-backed interpretation |
|---|---|---|
| P0-A | IMPLEMENTED | research authority boundary merged |
| P0-B | IMPLEMENTED IN CANONICAL CHAIN | neutral/legacy values isolated; physical legacy deletion belongs to P2-E |
| P0-C | IMPLEMENTED | UAI/category/feature contracts merged |
| P0-D | IMPLEMENTED | Commodity provider path governed |
| P0-E | IMPLEMENTED | category challengers registered non-executable |
| P1-A | IMPLEMENTED RESEARCH FOUNDATION | Energy evidence/contract/challenger |
| P1-B | IMPLEMENTED RESEARCH FOUNDATION | Industrial/Critical Metals evidence/contract/challenger |
| P1-C | IMPLEMENTED RESEARCH FOUNDATION | Precious Metals evidence/contract/challenger |
| P1-D | IMPLEMENTED RESEARCH FOUNDATION | Agriculture evidence/contract/challenger |
| P1-E | IMPLEMENTED | hard gates / DQ fail-closed |
| P2-A | FOUNDATION IMPLEMENTED; EMPIRICAL EVIDENCE OPEN | correlation/sensitivity/weight contracts exist; real reports per model still required |
| P2-B | ENGINE + VINTAGE GOVERNANCE IMPLEMENTED; EMPIRICAL DATASETS OPEN | contracts, executor and source-vintage policy exist; archived release datasets/OOS runs remain incomplete |
| P2-C | GOVERNANCE FOUNDATION IN THIS BRANCH | descriptor/review/stress/resilience/owner-decision binding; no promotion |
| P2-D | OPEN | category challenger CanonicalScoreResult/ranking consumer integration |
| P2-E | OPEN | legacy route/UI/scorer strangler completion |
| P3-A | OPEN | shadow runtime/observability |
| P3-B | OPEN | universe coverage/SLA |
| P3-C | BLOCKED | controlled champion promotion requires full evidence and Human/Owner decision |
| P3-D | OPEN / SEPARATE | resource-project valuation |

## 6. Why P2-D/P2-E are not pulled into this branch

The current category challengers remain deliberately non-executable and real empirical OOS/stress/provider-resilience evidence is not yet complete. Removing legacy consumers or routing category challengers into CanonicalScoreResult before those gates would either:

1. create an unvalidated production scoring path, or
2. remove the existing compatibility consumer before a validated replacement exists.

Therefore P2-C is a fail-closed governance package only. P2-D and P2-E must remain separate work after real evidence is available and reviewed.

## 7. Security / data-integrity assessment

- No Registry/Dispatcher mutation.
- No new production model or score authority.
- No external platform mutation.
- No new credential/IAM path.
- No new dependency or MLOps runtime.
- Existing provider, PIT, DQ and fingerprint authorities are reused.
- Stale #521 coordination metadata is persistently released according to Development Chain Execution Policy 2.0.0.
- Owner decision evidence cannot self-promote a model.
- Review packages are deterministic evidence artifacts and not authorization artifacts.

## 8. Remaining work after this branch

The next technically meaningful work is **not** automatic promotion. It is evidence production and then consumer integration:

1. Build/ingest real archived release manifests for EIA, USDA and CFTC and versioned annual/regulatory evidence for USGS/CRMA.
2. Assemble real Energy/Agriculture/Metals PIT datasets.
3. Run domain-specific walk-forward/OOS, correlation and sensitivity analyses on those same immutable datasets.
4. Produce provider-resilience windows and stress/regime reports.
5. Build P2-C review packages from actual evidence.
6. Only if Owner review is positive, design P2-D CanonicalScoreResult/ranking integration on a fresh branch.
7. After consumers are migrated, execute P2-E Legacy Retirement.
8. P3 shadow/SLA/controlled promotion remains separately gated.

## 9. Validation state for this branch

Pre-PR hosted CI has not been triggered. Current evidence is code/diff/static contract review only. Exact TypeScript/unit/build/governance results must come from the final PR head after mandatory current-main synchronization.
