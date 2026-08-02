# ADR-0033 — Index Provider Mapping and Evidence-Gated Commodity / Sovereign Benchmark Scoring

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** CAPITAL-AI Multi-Asset Screening / Registry / Market Evidence
- **Platform Version:** `0.6.0`
- **Governance ID:** `GOV-MARKET-EVIDENCE-0033`
- **Depends on:** ADR-0022, ADR-0025, ADR-0029, ADR-0030, ADR-0032

## 1. Context

ADR-0032 separated catalog membership from verified market evidence. The registry now contains substantially more index, commodity and bond catalog entries, but catalog presence alone must never create a price, a score or screening eligibility.

Three gaps remained:

1. index screening only accepted the small static `INDEX_FMP_TICKERS` mapping;
2. commodity scoring still had a legacy structural engine that could fill missing structural inputs with neutral fallback values and therefore was not suitable as a canonical market-evidence score;
3. bond catalog expansion consists primarily of sovereign benchmark yields, while ADR-0022/ADR-0029 correctly keep general individual-bond scoring locked until coupon, maturity, duration/cashflow, rating, liquidity and other mandatory evidence is available.

This ADR approves narrow, versioned runtime contracts that close those gaps without weakening the existing fail-closed architecture.

## 2. Decision

### 2.1 Index provider mapping

CAPITAL-AI adopts `index-provider-mapping/1.0.0`.

Provider order:

1. **FMP** remains first priority wherever an existing explicitly approved static `INDEX_FMP_TICKERS` mapping exists.
2. **TwelveData** may provide index history for the remaining catalog indices only after runtime provider-identity verification.

A TwelveData candidate is not sufficient by itself. The returned provider metadata must confirm the expected symbol; if provider type metadata is present it must identify an index. Ambiguous or contradictory provider identity fails closed.

The resulting history is represented by `index-market-evidence/1.0.0`. Technical factors are derived from real closes and carry the actual provider, source path, observed/retrieved times and lineage into the existing traditional scoring pipeline.

### 2.2 Commodity market-evidence scoring

CAPITAL-AI approves `commodity-evidence-scoring/1.0.0` for canonical commodity **market-price technical evidence**.

This contract is deliberately narrower than the legacy raw-material structural model.

Approved factors:

| Factor | Weight | Evidence |
|---|---:|---|
| Trend | 30% | real daily closes |
| Momentum | 25% | real daily closes |
| Breakout quality | 20% | real high/low position derived from daily closes |
| Volatility quality | 25% | realised daily return volatility |

Mandatory gates:

- provider identity present;
- provider evidence IDs present;
- at least 20 real daily observations;
- 100% factor coverage for the approved factor set;
- evidence not older than 7 days;
- no registry/bootstrap values participate in the canonical score.

TwelveData is the initial approved provider for this contract. Commodity identity is resolved against the provider's commodity catalog. Only explicit static mappings or unambiguous provider-catalog matches may be used. Ambiguous mappings remain `SOURCE_UNAVAILABLE` / `SCORE_NOT_COMPUTABLE`.

The contract does **not** claim to score ore grade, reserves, processing complexity, ESG, geopolitical concentration, supply-chain resilience or physical-market fundamentals. Those remain separate structural/research dimensions until equivalent field-level evidence contracts exist.

### 2.3 Sovereign benchmark yield scoring

CAPITAL-AI approves `sovereign-benchmark-yield-scoring/1.0.0` only for catalog instruments representing **government benchmark yields**.

This is not an activation of general individual-bond scoring.

Approved factors:

| Factor | Weight | Meaning |
|---|---:|---|
| Yield-level percentile | 45% | current benchmark yield relative to its own verified history window |
| Yield trend | 30% | standardized current yield position relative to the history distribution |
| Yield stability | 25% | realised volatility of daily yield changes in basis points |

Mandatory gates:

- an explicit approved or provider-catalog-confirmed EODHD `*.GBOND` mapping;
- at least 20 real observations;
- provider and evidence IDs;
- full approved-factor coverage;
- evidence not older than 7 days;
- finite yields, including historically valid negative yields;
- no bootstrap yield, duration, rating or liquidity defaults.

The score semantics are **yield state**, not investment quality or expected return. The response must explicitly keep `individualBondScoringEligible: false`.

### 2.4 General individual-bond scoring remains locked

ADR-0022 and ADR-0029 remain authoritative for individual bonds and corporate bonds.

This ADR does not approve:

- the draft general bond weight proposal;
- guessed duration;
- guessed coupon/maturity;
- inferred credit ratings;
- inferred liquidity/spreads;
- a corporate-bond score such as `AAA-CORP` without the required evidence.

`bond-scoring/locked-1.0.0` remains in force for that scope.

## 3. Provider governance

### FMP

- role: existing approved static index mappings;
- priority: first when a mapping exists;
- evidence use: real index history/quotes only;
- licensing/redistribution remains environment/plan dependent.

### TwelveData

- role: index fallback/coverage extension and commodity history;
- secret: server-side `TWELVEDATA_API_KEY` only;
- identity rule: runtime metadata/catalog confirmation required;
- ambiguous symbol/name resolution fails closed;
- rate-limit or plan restrictions produce unavailable evidence, never a synthetic fallback score.

### EODHD

- role: sovereign government-bond benchmark history through `GBOND`;
- secret: server-side `EODHD_API_KEY` only;
- mapping rule: approved static exact ticker or exact match in the provider GBOND symbol-list endpoint;
- ticker guessing is prohibited;
- GBOND observations are research/yield evidence, not execution prices.

## 4. Data integrity and lineage

Every READY score under this ADR must carry:

- catalog symbol;
- provider identity;
- provider symbol;
- source path;
- observed/retrieved times;
- evidence IDs;
- contract version;
- used/missing factors;
- canonical integrity status;
- correlation ID at the route boundary.

Catalog metadata remains non-financial metadata and does not become evidence by being listed in the registry.

The existing Screening Eligibility / Operations / SLO evidence pipeline receives these results through the same registry evaluation path. A non-READY score remains ineligible.

## 5. Legacy raw-material structural model

`RawMaterialsScoringService` remains available for explicitly labelled structural/sandbox research use.

Its output must be marked:

- `scoreSemantic: legacy-structural-research`;
- `canonical: false`;
- `marketEvidenceVerified: false`.

The canonical commodity market score is available only through the approved evidence contract.

## 6. Fail-closed states

The following conditions must not produce a numerical canonical score:

- provider key unavailable;
- provider rate limit / network failure;
- unknown or ambiguous provider mapping;
- provider identity mismatch;
- insufficient history;
- stale evidence;
- missing evidence IDs or provider identity;
- missing approved factors;
- unsupported individual/corporate bond.

There is no symbol-hash, neutral-50, bootstrap-price or simulated-history fallback in the approved contracts.

## 7. Runtime surfaces

Approved surfaces include:

- `/api/registry/assets/index-provider-mappings` — read-only mapping governance view;
- `/api/registry/assets/:symbol/verified-score` — canonical catalog score evaluation;
- `/api/registry/assets/:symbol/verified-context` — score plus separated macro context;
- `/api/registry/assets/verified-scores` — governed batch path with Screening SLO evidence;
- `/api/raw-materials/verified-score/:symbol` — commodity canonical evidence score.

Commodity and sovereign benchmark evidence do not create an execution-quote contract. `/verified-quote` remains limited to the asset classes with an approved quote path.

## 8. Acceptance criteria

The implementation is accepted only if tests prove:

1. every index catalog entry has a versioned provider mapping candidate;
2. existing FMP mappings retain priority;
3. TwelveData identity mismatches fail closed;
4. commodity scores require real provider evidence and freshness;
5. stale commodity evidence cannot return READY;
6. sovereign benchmark scores require exact/verified GBOND mapping;
7. stale sovereign evidence cannot return READY;
8. negative sovereign yield observations are preserved as valid evidence;
9. individual/corporate bond scoring remains locked;
10. the expanded asset catalog remains unique and complete;
11. TypeScript, unit tests, production build and deployment-readiness checks pass.

## 9. Version lifecycle

This ADR does not independently change the application version. ADR-0030 remains authoritative.

The platform remains `0.6.0` until the formal Release Version Gate classifies the release scope. This capability is eligible for a future MINOR release classification because it materially expands production screening capability, but implementation merge alone is not a version bump.

## 10. Final decision

The three runtime contracts are approved with strict semantic boundaries:

- `index-provider-mapping/1.0.0`
- `commodity-evidence-scoring/1.0.0`
- `sovereign-benchmark-yield-scoring/1.0.0`

General individual-bond scoring remains locked under ADR-0022/ADR-0029.
