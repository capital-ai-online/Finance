# Work Package SC-7 — Ranking Composite Opt-In & Cross-Asset Generalization

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A–C LANDED · PHASE D IMPLEMENTED / SHADOW — productive impact remains false  
**Date:** 2026-08-19

## Goal

SC-7 evolves ranking without silently changing financial decisions:

1. reuse SC-3 DQ semantics in the existing Crypto rank formula; and
2. generalize ranking across canonical multi-asset scores without assuming that different model, feature, intended-use or score-scale contracts are directly comparable.

The productive Crypto formula and eligibility thresholds remain unchanged. Cross-asset ranking stays shadow/read-only until calibration evidence, runtime validation and a separate Owner impact decision exist.

## Delivered

### Phase A–C — existing Crypto DQ opt-in
- [x] shared `resolveRankingDqPoints`
- [x] `RANKING_SCORE_IMPACT_ENABLED=false`
- [x] orchestrator/valuation/Crypto route DQ wiring
- [x] formula weights and Top-10 thresholds unchanged

### Phase D — canonical cross-asset ranking foundation

#### Platform
- [x] `src/platform/Ranking/contracts.ts`
- [x] `src/platform/Ranking/CrossAssetRanking.ts`
- [x] `src/platform/Ranking/index.ts`
- [x] `cross-asset-ranking/1.0.0`
- [x] `CROSS_ASSET_RANKING_IMPACT_ENABLED=false`

#### Modes
- [x] `overall | category | tier | growth`

#### Intended-use comparability contract
- [x] Default cohort includes `modelId@modelVersion + assetClass + featureVersion + scoringVersion`
- [x] Admission requires dispatcher, modelRegistry, model, executor, result-contract, feature and scoring lineage
- [x] Same registry model id/version does not automatically create cross-asset comparability
- [x] Static review confirmed `traditional-scoring@2.1.0` uses different Stock vs. Forex/Index weight sets
- [x] C3 compatibility also preserves Crypto 0..10 vs. other financial presentation 0..100
- [x] Cross-model/cross-asset ranking therefore requires separately verified `ScoreComparabilityEvidence`
- [x] Evidence requires `normalizedValue`, `comparisonKey`, `methodVersion`, evidence lineage and `verified=true`
- [x] `crossCohortOrder=false`

#### Growth
- [x] Growth is not inferred from canonical score
- [x] separate verified `GrowthRankingEvidence` required

#### Fail-closed admission
- [x] canonical status/finite value
- [x] UAI identity match
- [x] complete scoring lineage
- [x] explicit governance eligibility
- [x] source-conflict block
- [x] `UNAVAILABLE` / `NO_RUNTIME_EVIDENCE` block
- [x] category/tier/growth/comparability metadata gates
- [x] duplicate identity rejection

#### Determinism / traceability
- [x] ranking value desc, exact tie -> stable `assetId`
- [x] no hidden financial tie-break factor
- [x] ranked entries project dispatcher/registry/model/executor/result/feature/scoring lineage

#### Regression proof prepared
- [x] `tests/unit/crossAssetRanking.test.ts`
- [x] intended-use cohort isolation
- [x] Stock/Forex non-interleaving despite shared Traditional model id/version
- [x] feature-contract drift isolation
- [x] verified normalization requirement
- [x] Growth evidence gate
- [x] governance/identity/lineage fail-closed rules
- [x] deterministic tie-break + duplicate rejection
- [x] both impact flags false

Evidence: `docs/evidence/sc-md/SC7_CROSS_ASSET_RANKING_GENERALIZATION_2026-08-19.md`

## Explicitly NOT done / Owner gates

- [ ] `scoreImpactEnabled` / `rankingImpactEnabled` activation
- [ ] Crypto formula-weight changes
- [ ] Top-10 threshold changes
- [ ] cross-asset normalization/calibration algorithm
- [ ] productive API/UI/alert/eligibility ordering
- [ ] financial-decision persistence of Phase-D ranks
- [ ] unverified Growth promotion

## DoD Phase D

1. ranking input is UAI + CanonicalScoreResult with complete execution lineage;
2. default cohort equals the same intended-use contract, not merely the same model id;
3. cross-cohort ranking requires verified normalized comparison evidence;
4. category/tier/growth modes fail closed when evidence is absent;
5. governance/source/operations/identity defects are explicit exclusions;
6. deterministic output contains full ranking lineage;
7. existing productive ranking behavior remains unchanged;
8. repository TypeScript/unit/build validation occurs only after PR creation; Owner-managed M10 remediation remains a parallel control-plane item.

## Risk

Medium architectural scope, **zero productive ranking impact**. The principal risk is false output comparability. Phase D mitigates it by treating intended-use contract identity and normalization evidence as explicit ranking prerequisites rather than inferring comparability from shared model names or numeric ranges.
