# CAPITAL-AI-FINTECH — Execution Inventory

Baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## Asset classes

Canonical scoreable classes from `src/platform/Scoring/contracts.ts`:

| Asset class | Productive support | Notes |
|---|---|---|
| crypto | YES | verified crypto champion |
| stock | YES | traditional model |
| forex | YES | traditional model |
| index | YES | traditional model |
| commodity | YES | commodity evidence model |
| bond | PARTIAL | only approved government benchmark yield instruments |

Not separate scoreable classes on this baseline: ETF, Fund, Real Estate/REIT.

## Scoring models

| Model | Version | Lifecycle | Asset scope | Executor | Score eligible |
|---|---|---|---|---|---|
| crypto-technical-provenance | 0.7.0 | canonical/champion | crypto | verified crypto technical executor | YES |
| crypto-meme-integrity | 0.3.0 | challenger | crypto | research-only:not-executable | NO |
| crypto-defi-fundamental | 0.3.0 | challenger | crypto | research-only:not-executable | NO |
| traditional-scoring | 2.1.0 | canonical/champion | stock, forex, index | traditional executor | YES |
| commodity-evidence-scoring | 1.0.0 | canonical/champion | commodity | commodity evidence executor | YES |
| commodity-energy-hybrid | 0.1.0 | challenger | commodity/energy benchmark | research-only:not-executable | NO |
| commodity-industrial-metals-hybrid | 0.1.0 | challenger | commodity/industrial metal benchmark | research-only:not-executable | NO |
| commodity-precious-metals-hybrid | 0.1.0 | challenger | commodity/precious metal benchmark | research-only:not-executable | NO |
| commodity-agriculture-hybrid | 0.1.0 | challenger | commodity/agriculture benchmark | research-only:not-executable | NO |
| sovereign-benchmark-yield-scoring | 1.0.0 | canonical/champion | bond/government-benchmark-yield | sovereign benchmark executor | YES |

Count: 10 descriptors, 4 canonical champion descriptors, 6 challenger descriptors.

## Registry / Dispatcher

- Registry contract: `scoring-model-registry/1.1.0`.
- One default `ScoringModelRegistry` implementation.
- Registry rejects duplicate model IDs/versions and ambiguous canonical scopes.
- Challenger entries must remain `scoreEligible=false`.
- One productive `ScoringDispatcher` is the canonical model execution gateway.
- Missing/ambiguous model resolution fails closed as non-computable.

No second registry or productive dispatcher is introduced by CAPITAL-AI-FINTECH V2.

## Domain executors

Productive executor responsibilities:

| Scope | Executor responsibility | Status |
|---|---|---|
| crypto | verified crypto technical scoring | ACTIVE |
| stock/forex/index | traditional scoring adapter | ACTIVE |
| commodity | commodity market-evidence scoring | ACTIVE |
| bond/government-benchmark-yield | sovereign benchmark yield scoring | ACTIVE / bounded |

Research-only challenger executor key remains non-productive.

## Feature contracts

Every registry descriptor references an explicit feature-contract version. Current examples include:

- `crypto-technical-features/0.7.0`;
- `crypto-meme-research-features/0.3.0`;
- `crypto-defi-research-features/0.3.0`;
- `traditional-features/2.1.0`;
- `commodity-market-evidence/1.0.0`;
- category-specific commodity research feature contracts;
- `sovereign-benchmark-yield-features/1.0.0`.

V2 FIN-12 must make the DATA-input/feature-engineering ownership boundary explicit without moving provenance or DQ authority into FINTECH.

## Canonical score contract

Current contracts:

- `scoring-integrity/1.1.0` canonical current contract;
- `scoring-integrity/1.0.0` legacy migration boundary for selected current champions.

Unavailable results carry null numeric scores and explicit non-ready status. Numeric zero is not used as a missing-evidence fallback.

## Ranking inventory

### Existing FINTECH-reusable ranking components

1. `src/services/ranking.service.ts`
   - current crypto ranking formula and Top-10 eligibility;
   - resolves DQ points;
   - derives classification from canonical classification service rather than trusting caller classification.

2. `src/platform/Ranking/contracts.ts`
   - `cross-asset-ranking/1.0.0`;
   - explicit canonical candidate, comparability, governance, exclusion and cohort contracts;
   - cross-asset impact currently disabled.

3. `src/platform/Ranking/CrossAssetRanking.ts`
   - ranks only READY CanonicalScoreResult candidates;
   - requires model/dispatcher/executor/result/feature/scoring lineage;
   - requires governance evidence;
   - refuses unverified comparability/growth evidence;
   - deterministic cohort ordering and tie-breaker.

### Confirmed boundary gap

`src/features/screening/ui/RankingBoard.tsx` locally sorts READY rows by score and derives Top/Worst lists. This is a current frontend-side ranking behavior and conflicts with the V2 target boundary.

Action: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]` after FINTECH exposes/settles the single productive ranking result contract.

## Provider capability inventory boundary

The repository already has one canonical `ProviderMatrix` (`provider-matrix/1.9.1`). FINTECH reuses it for capability requirements only.

Representative existing mappings:

- TwelveData: stock/forex/crypto/commodity snapshot/quote/history;
- FMP: index quote/snapshot plus bounded index history path;
- CoinGecko: crypto snapshot/quote;
- CoinAPI: crypto snapshot/quote;
- EODHD: crypto historical/reference evidence;
- Stooq: stock/index legacy fallback path;
- Binance/Kraken public analytics: crypto market/derivatives research evidence;
- DeFiLlama, GoPlus, DEX Screener, Sourcify, Dune and news/economic providers: bounded evidence/research capabilities.

Provider configuration/enabled flags are not treated as proof of credentials, entitlement or live health.

## Duplicate-path classification

| Path class | Finding | Resolution |
|---|---|---|
| Scoring registry | one current canonical registry | REUSE |
| Productive dispatcher | one current canonical dispatcher | REUSE |
| Canonical score | one current contract family with explicit legacy adapter boundary | REUSE / MIGRATE deliberately |
| Historical scoring engines | retained in old services/docs but superseded as productive authority by ADR-0087/SPT | REFERENCE / SUPERSEDED |
| Ranking | central backend contracts/services plus FE-local ordering | FIN-17 consolidation + FE handoff |
| Provider registry | one ProviderMatrix | REUSE |

## V2 ownership conclusion

The scoring core is already architecturally close to V2. The material open migration is ranking ownership/runtime consolidation and coordinated stage-number/handoff alignment, not replacement of the current registry/dispatcher/score contracts.