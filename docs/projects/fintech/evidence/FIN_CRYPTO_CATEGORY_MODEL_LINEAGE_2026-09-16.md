# FINTECH Crypto Category / Model / Scoring Lineage — 2026-09-16

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary Owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC:** `PVC-12..PVC-17`  
**Baseline:** `main@c58f662deee989f270d6968881644d284435d5bd`  
**Branch:** `agent/fintech-crypto-category-lineage-20260916`  
**Roadmap:** `FIN-12`, `FIN-19`, `FIN-20`  
**Authorities:** `/AGENTS.md@current-main`, ADR-0087, ADR-0099, ADR-0041 + ESS-0016

## Objective

Materialize the FINTECH-owned part of the chain

```text
Validated DATA / UAI
-> typed Crypto category feature binding
-> ScoringModelRegistry metadata
-> ScoringDispatcher-compatible dispatch identity
-> CanonicalScoreResult lineage
-> Ranking/Decision-Support input identity
-> OPS trace handoff projection
-> FE projection contract
```

without adding a provider adapter, a second taxonomy, a second model registry, a second dispatcher, a Frontend score authority or synthetic financial evidence.

## Current-main correlation

Current main already contains the required architectural nuclei:

- `ValidatedDataInput/1.0.0` and `FintechDataHandoff` preserve UAI, provider/feed, evidence, observed/retrieved timestamps, freshness, DQ and correlation identity at `PVC-11 -> PVC-12`.
- `CryptoCategoryFeatureContracts` defines typed profile-specific feature requirements and hard gates.
- `ScoringModelRegistry` contains exactly one productive crypto champion: `crypto-technical-provenance@0.7.0`.
- `crypto-meme-integrity@0.3.0` and `crypto-defi-fundamental@0.3.0` remain `challenger`, `research-only`, `scoreEligible=false` and non-executable.
- `ScoringDispatcher` remains the only productive model-execution boundary.

The FINTECH Roadmap still correctly records a DATA dependency: current generic validated snapshot construction exports `price` only, while category-specific feature contracts need additional governed observations. This branch therefore does not declare FIN-12 globally complete.

## Materialized FINTECH contracts

### 1. DATA -> category feature binding

`CryptoCategoryScoringBinding.ts` consumes only `ValidatedDataInput` through the existing DATA-owned `projectValidatedDataInputForFintech` guard.

Rules:

- only `PASS/PARTIAL` DATA observations with complete provider/evidence/freshness lineage can enter numeric feature mapping;
- exact category feature keys are accepted without semantic reinterpretation;
- only a deliberately small unambiguous universal alias projection is allowed (`price` -> `market.priceUsd` only when currency is USD, plus explicitly named market-cap/volume/supply fields);
- no missing value becomes `0`, neutral or synthetic evidence;
- duplicate provider observations for the same feature are treated as ambiguous and fail closed;
- `CONDITIONAL` category bindings such as AI/Data -> DePIN and NFT/Creator -> NFT are not promoted from classification alone; without separate qualifying evidence the effective profile remains `generic / NOT_COMPUTABLE`;
- existing `CryptoCategoryFeatureContract` hard-gate behavior is preserved.

The wrapper deliberately normalizes incomplete category evidence to `NOT_COMPUTABLE` for score binding even where the lower-level research feature contract reports `PARTIAL` coverage.

### 2. Category -> governed model binding

`resolveCryptoCategoryModelBinding(...)` reads model identity from the existing `ScoringModelRegistry`; it does not register anything.

Every canonical Crypto category/subcategory binds to the existing champion `crypto-technical-provenance@0.7.0`. Existing Meme/DeFi challenger descriptors are projected only for their applicable categories and retain `scoreEligible=false` / `executionEligible=false`.

Potential Layer-1, Layer-2, Stablecoin, Oracle, Liquid-Staking/Restaking, RWA and Payments specialization is represented only as `RESEARCH_TARGET_NOT_MODEL` lenses. No executable formula, weight set, alias, registry row or dispatcher route is invented.

### 3. Dispatch / FE / OPS lineage

The new FINTECH projection binds:

- exact `assetId`;
- exact `category_main` and `category_sub`;
- exact registry `modelId` / `modelVersion`;
- exact model feature-contract version;
- DATA evidence refs and provider set;
- DATA Quality state;
- shared `correlationId`.

The FE-facing projection exposes actual model lifecycle and canonical/research state plus category, tier/confidence, providers, evidence IDs, freshness, DQ, `scoreEligible`, `executionEligible` and an explicit not-computable reason.

The OPS-facing projection carries the same asset/model/feature/evidence/DQ/correlation identity. It is a FINTECH handoff contract only; `CAPITAL-AI-OPS / PVC-18` retains trace transport/retention ownership.

Canonical result metadata mismatches (asset, model ID/version or feature version) fail the FINTECH lineage projection rather than relabeling an existing score.

## Open-owner boundaries

- `CAPITAL-AI-DATA / PVC-09..11`: additional category-specific provider observations, provenance/freshness/DQ semantics and any provider normalization remain DATA work.
- `CAPITAL-AI-OPS / PVC-18`: durable/runtime trace transport and production lineage evidence remain OPS work.
- `CAPITAL-AI-FE`: presentation consumption remains FE work. Open PR #1011 changes the Crypto category workspace; this FINTECH branch deliberately does not modify FE files.
- Dedicated model promotion remains a separate governed FINTECH decision after adequate evidence, validation and review.
- CEX live trading, DEX/bridge execution, wallet mutation and order submission are not authorized or changed.

## Plugin / provider precheck disposition

GitHub was used for current-main contracts, tests, history, branch and writer correlation. Supabase, Binance, Alpaca, QuickNode and Render were not invoked merely because they are available: no direct provider truth is required to materialize this bounded contract, and doing so would not satisfy the missing DATA-owned contract. QuickNode/Binance/Alpaca cannot bypass DATA; Render runtime evidence is a post-integration concern; no persistence mutation is needed.

## Validation classification

Materialized deterministic tests cover:

- complete DATA-backed Layer-1 typed feature binding;
- missing/stale fail-closed behavior;
- provider conflict ambiguity;
- conditional profile evidence boundary;
- every canonical Crypto category -> one registry champion;
- Meme/DeFi challenger vs champion separation;
- research-target-only specialized lenses;
- exact DATA -> dispatch -> FE -> OPS correlation/evidence/model lineage;
- canonical model/feature metadata mismatch rejection.

Execution status before PR creation: `NOT RUN` through the GitHub connector. `NOT RUN` is not `PASS`. Cost-bearing hosted checks remain post-PR according to current repository policy.

## Exit-gate disposition

| Exit requirement | Branch state |
|---|---|
| Each scoreable category uses a typed feature contract | `MATERIALIZED` — all canonical classifications resolve through the existing typed category contract; missing evidence is not scoreable |
| Missing category evidence remains `NOT_COMPUTABLE` | `MATERIALIZED` |
| DATA provenance survives into feature lineage | `MATERIALIZED` |
| No provider adapter exists inside FINTECH | `PRESERVED` |
| Every category has an explicit governed model binding | `MATERIALIZED` — canonical champion is the default; Meme/DeFi challenger metadata remains research-only |
| Dedicated formulas only where evidence justifies them | `PRESERVED` — no new formula/weights created |
| Research/challenger never appears as canonical without promotion | `PRESERVED` |
| DATA -> Feature -> Model -> Score -> Rank -> FE lineage reproducible | `FINTECH CONTRACT MATERIALIZED / END-TO-END PRODUCTION EVIDENCE OPEN` |
| FE model badge matches registry metadata | `CONTRACT PROVIDED / FE OWNER INTEGRATION OPEN` |
| OPS trace carries same correlation identity | `FINTECH HANDOFF PROVIDED / OPS OWNER INTEGRATION OPEN` |

FIN-12 therefore remains `PARTIAL` until DATA supplies the required real category/champion feature coverage. FIN-20 remains `PARTIAL` until the FINTECH projection is consumed by the owner-correct FE/OPS surfaces and exact production evidence exists.
