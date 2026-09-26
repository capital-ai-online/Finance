# CAPITAL-AI-FINTECH — Provider Capability Matrix

**Baseline:** `main@1e8904dfec75a2ebb03bae8654133137708f1e3b`  
**Canonical provider source:** `src/platform/MarketData/ProviderMatrix.ts` (`provider-matrix/1.11.0`)  
**Role:** FINTECH capability-requirement projection only; not a second provider registry or DATA authority.

Static `enabled=true`, provider registration or a declared capability is not proof of credentials, entitlement, subscription, freshness, semantic fallback equivalence or runtime health. FINTECH consumes provider capability evidence only through the ownership boundaries below.

## Current provider inventory

| Provider | Role | Asset classes | Declared capabilities | Current integration state |
|---|---|---|---|---|
| TwelveData | primary | stock, forex, crypto, commodity, index | snapshot, quote, history | canonical quote + commodity-history gateway; traditional/crypto history compatibility lane remains off-gateway |
| FMP Index | primary | index | snapshot, quote | `behind_gateway` |
| CoinGecko | primary | crypto | snapshot, quote, history | `behind_gateway` for canonical snapshot/quote; direct compatibility history remains separately bounded |
| Alpaca | shadow | stock | snapshot, trade | `shadow_only` |
| FMP Index History | primary | index | history | `history_gateway_only` |
| CoinAPI | secondary | crypto | snapshot, quote, history, orderbook | `behind_gateway` for canonical snapshot/quote; compatibility history/consensus remain direct |
| EODHD | secondary | crypto, stock, forex, bond | snapshot, history | crypto snapshot behind gateway; compatibility history and explicit GBOND evidence remain direct/off-gateway |
| Stooq | secondary | stock, forex, index | snapshot, history | `not_wired`, `enabled=false`; productive direct network access retired |
| Alpha Vantage | primary | stock | fundamentals, history, quote | `legacy_off_gateway`; existing keyed stock fundamentals/history/quote compatibility lane |
| FMP Traditional Fundamentals | secondary | stock | fundamentals | `legacy_off_gateway`; ratios-ttm stock-fundamental fallback/enrichment |
| Finnhub | secondary | stock, forex, index, crypto | snapshot, quote, history, fundamentals | `not_wired`, `enabled=false`; candidate only |
| Massive | secondary | stock, forex, index, crypto | snapshot, quote, history | `not_wired`, `enabled=false`; candidate only |
| FRED | primary | macro, bond | macro-series | `legacy_off_gateway`; allow-listed macro/rate evidence, never execution-price eligible |
| ECB Data API | secondary | macro, forex, bond | macro-series | `legacy_off_gateway`; reference evidence only |
| DeFiLlama | secondary | crypto | fundamentals | `not_wired` / evidence-only |
| EIA | primary | commodity | fundamentals | `not_wired` / governed research evidence |
| USDA FAS PSD | primary | commodity | fundamentals | `not_wired` / governed research evidence |
| CFTC COT | secondary | commodity | derivatives | `not_wired` / context/challenger evidence |
| USGS MCS | primary | commodity | fundamentals | `not_wired` / governed research evidence |
| EU CRMA | secondary | commodity | fundamentals | `not_wired` / context evidence |
| Binance Public | primary | crypto | snapshot, quote, history, bars, derivatives, orderbook | `not_wired` analytics/evidence; compatibility history is recorded but not promoted to consolidated-price authority |
| Kraken Futures Public | primary | crypto | quote, history, bars, derivatives, orderbook | `not_wired` analytics/evidence; compatibility history preserves venue provenance |
| GoPlus | secondary | crypto | security, on-chain | `not_wired` / evidence-only |
| DEX Screener | secondary | crypto | snapshot, quote, on-chain | `not_wired` / evidence-only |
| Sourcify | secondary | crypto | security, on-chain | `not_wired` / verification evidence only |
| Free Crypto News | primary | crypto | news | `not_wired` / metadata-provenance lane |
| GDELT | secondary | crypto, stock, forex, commodity, index, bond, macro | news | `not_wired` / discovery-provenance lane |
| Dune | secondary | crypto | on-chain, governance | `not_wired` / governed read-results evidence |

Matrix integration-lane count: **28**. Provider-family count is lower because FMP keeps separate index quote/history and stock-fundamental lanes.

## Changes from the previous FINTECH projection

1. Canonical provider version is now `provider-matrix/1.11.0`.
2. Existing runtime provider families that previously existed only in `src/services/marketDataProviderRegistry.ts` are now represented in the canonical matrix: Alpha Vantage, FMP stock fundamentals, FRED and ECB. Finnhub and Massive remain disabled candidates.
3. The older adaptive provider registry is now a **compatibility projection derived from ProviderMatrix**. Asset classes, capabilities and enabled state are no longer independently authored there.
4. Existing direct compatibility history lanes for CoinGecko, Binance, Kraken, CoinAPI, TwelveData and EODHD are inventoried without promoting them to canonical gateway authority.
5. EODHD explicitly covers existing stock/forex history and `*.GBOND` sovereign-yield evidence; those observations remain historical/evidence semantics.
6. Stooq remains `enabled=false` and productive direct access remains retired.
7. Static registration or matrix presence remains non-authorizing: credentials, licensing, runtime health, freshness, DQ and semantic fallback equivalence must still be proven independently.

## Asset-class capability projection

| Asset class | Required capability context | Current repository evidence | FINTECH projection |
|---|---|---|---|
| crypto | verified snapshot / quote | CoinGecko, TwelveData; CoinAPI/EODHD as bounded additional sources | PARTIAL / HARDEN |
| crypto | bars / derivatives | Binance Public, Kraken Futures Public | RESEARCH / NOT WIRED |
| crypto | fundamentals | DeFiLlama | EVIDENCE ONLY |
| crypto | security / on-chain | GoPlus, Sourcify, DEX Screener, Dune | EVIDENCE / RESEARCH |
| crypto | news | Free Crypto News, GDELT | RESEARCH / PROVENANCE REQUIRED |
| stock | snapshot / quote | TwelveData; Alpaca shadow; Alpha Vantage compatibility; Stooq disabled/not wired | SUPPORTED / SHADOW + COMPATIBILITY BOUNDARY |
| stock | fundamentals | Alpha Vantage primary OVERVIEW; FMP ratios-ttm bounded fallback | SUPPORTED / LEGACY_OFF_GATEWAY; provenance and freshness required |
| forex | snapshot / quote | TwelveData; ECB reference evidence is separate/non-execution | SUPPORTED |
| index | snapshot / quote | FMP Index; Stooq disabled/not wired | SUPPORTED |
| index | history | FMP Index History; Stooq disabled/not wired | PARTIAL |
| commodity | quote / history | TwelveData; commodity history through governed history gateway | PARTIAL / CAPABILITY PRESENT |
| commodity | fundamentals | EIA, USDA FAS PSD, USGS MCS, EU CRMA | PARTIAL / EVIDENCE LANE |
| commodity | derivatives | CFTC COT | CONTEXT / CHALLENGER EVIDENCE |
| macro / bond | macro-series / rate evidence | FRED allow-list; ECB reference series | SUPPORTED EVIDENCE / NON-EXECUTION |
| bond | news / context | GDELT | PARTIAL |
| bond | scoring input | bounded sovereign-benchmark-yield scoring exists; ProviderMatrix alone does not prove a quote source | PARTIAL / CONTRACT-BOUND |

ETF, Fund and REIT remain unsupported as separate scoreable classes unless explicit repository contracts are introduced.

## Fallback invariants

A similarly named capability is not sufficient to prove semantic fallback equivalence.

- crypto independent spot consensus: EODHD historical/EOD data must not masquerade as a live equivalent;
- crypto snapshot: CoinGecko, CoinAPI, EODHD and TwelveData do not establish an automatic canonical fallback without freshness/DQ/equivalence evidence;
- stock: Alpaca remains shadow and Stooq is disabled/not wired; neither is automatically promoted behind TwelveData;
- index: Stooq is disabled/not wired and is not an automatic fallback behind FMP Index;
- crypto news: Free Crypto News → GDELT may be used only as documented discovery/metadata fallback while preserving provenance;
- commodity fundamentals: official sources describe different semantic fields and are not generic substitutes;
- required evidence that cannot be satisfied remains unavailable/non-computable; no neutral or synthetic fallback is permitted.

## Ownership boundary

FINTECH owns the mapping:

`asset class -> financial feature/model requirement -> required provider capability`.

`CAPITAL-AI-FINTECH / PVC-09..11` retains provider ingestion, canonical evidence identity, freshness and DQ. `CAPITAL-AI-SEC` retains credential/API Security requirements and independent Security verification. Provider availability never grants scoring or entitlement authority.

## Correlated open work

1. `FIN-19` now converges provider metadata authority on `ProviderMatrix`; the remaining step is to bind each AnalysisConnectionRegistry contract to machine-checkable capability requirements derived from this matrix.
2. Direct provider-consensus or compatibility adapter paths discovered in productive FINTECH execution remain migration targets inside `CAPITAL-AI-FINTECH / PVC-09..11`; they do not authorize a second provider/DQ plane.
3. Runtime health/entitlement remains unverified until exact provider/runtime evidence is captured.
4. This project matrix must be refreshed whenever `PROVIDER_MATRIX_VERSION` or material gateway/enabled semantics change.
