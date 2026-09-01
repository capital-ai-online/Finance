# CAPITAL-AI-FINTECH — Provider Capability Matrix

**Baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`  
**Canonical provider source:** `src/platform/MarketData/ProviderMatrix.ts` (`provider-matrix/1.10.0`)  
**Role:** FINTECH capability-requirement projection only; not a second provider registry or DATA authority.

Static `enabled=true`, provider registration or a declared capability is not proof of credentials, entitlement, subscription, freshness, semantic fallback equivalence or runtime health. FINTECH consumes provider capability evidence only through the ownership boundaries below.

## Current provider inventory

| Provider | Role | Asset classes | Declared capabilities | Current integration state |
|---|---|---|---|---|
| TwelveData | primary | stock, forex, crypto, commodity | snapshot, quote, history | `behind_gateway` |
| FMP Index | primary | index | snapshot, quote | `behind_gateway` |
| CoinGecko | primary | crypto | snapshot, quote | `behind_gateway` |
| Alpaca | shadow | stock | snapshot, trade | `shadow_only` |
| FMP Index History | primary | index | history | `history_gateway_only` |
| CoinAPI | secondary | crypto | snapshot, quote | `behind_gateway`; direct crypto-consensus use still noted in canonical source |
| EODHD | secondary | crypto | snapshot, history | `behind_gateway`; snapshot is historical/EOD semantics |
| Stooq | secondary | stock, index | snapshot, history | `not_wired`, `enabled=false`; productive direct network access retired |
| DeFiLlama | secondary | crypto | fundamentals | `not_wired` / evidence-only |
| EIA | primary | commodity | fundamentals | `not_wired` / governed research evidence |
| USDA FAS PSD | primary | commodity | fundamentals | `not_wired` / governed research evidence |
| CFTC COT | secondary | commodity | derivatives | `not_wired` / context/challenger evidence |
| USGS MCS | primary | commodity | fundamentals | `not_wired` / governed research evidence |
| EU CRMA | secondary | commodity | fundamentals | `not_wired` / context evidence |
| Binance Public | primary | crypto | snapshot, quote, bars, derivatives | `not_wired` / keyless research evidence |
| Kraken Futures Public | primary | crypto | quote, bars, derivatives | `not_wired` / keyless research evidence |
| GoPlus | secondary | crypto | security, on-chain | `not_wired` / evidence-only |
| DEX Screener | secondary | crypto | snapshot, quote, on-chain | `not_wired` / evidence-only |
| Sourcify | secondary | crypto | security, on-chain | `not_wired` / verification evidence only |
| Free Crypto News | primary | crypto | news | `not_wired` / metadata-provenance lane |
| GDELT | secondary | crypto, stock, forex, commodity, index, bond, macro | news | `not_wired` / discovery-provenance lane |
| Dune | secondary | crypto | on-chain, governance | `not_wired` / governed read-results evidence |

Provider count: **22**.

## Changes from the previous FINTECH projection

1. Canonical provider version is now `provider-matrix/1.10.0`, not `1.9.1`.
2. Stooq is explicitly `enabled=false` and `gatewayStatus='not_wired'`; productive direct Stooq network access is retired. The old FINTECH label `legacy_off_gateway` is stale and must not be used as current-state evidence.
3. TwelveData commodity daily history is documented by the canonical source as routed through `TwelveDataCommodityHistoryProvider -> MarketDataHistoryGateway` and the shared governed research-evidence HTTP transport.
4. CoinAPI remains registered behind the gateway but the canonical source still records direct `cryptoSpotConsensus` consumption. FINTECH treats this as a boundary observation requiring DATA/gateway assessment, not as permission to normalize a direct provider path.
5. EODHD crypto snapshots are historical/EOD semantics and must never masquerade as live execution-price evidence.

## Asset-class capability projection

| Asset class | Required capability context | Current repository evidence | FINTECH projection |
|---|---|---|---|
| crypto | verified snapshot / quote | CoinGecko, TwelveData; CoinAPI/EODHD as bounded additional sources | PARTIAL / HARDEN |
| crypto | bars / derivatives | Binance Public, Kraken Futures Public | RESEARCH / NOT WIRED |
| crypto | fundamentals | DeFiLlama | EVIDENCE ONLY |
| crypto | security / on-chain | GoPlus, Sourcify, DEX Screener, Dune | EVIDENCE / RESEARCH |
| crypto | news | Free Crypto News, GDELT | RESEARCH / PROVENANCE REQUIRED |
| stock | snapshot / quote | TwelveData; Alpaca shadow; Stooq disabled/not wired | SUPPORTED / SHADOW BOUNDARY |
| forex | snapshot / quote | TwelveData | SUPPORTED |
| index | snapshot / quote | FMP Index; Stooq disabled/not wired | SUPPORTED |
| index | history | FMP Index History; Stooq disabled/not wired | PARTIAL |
| commodity | quote / history | TwelveData; commodity history through governed history gateway | PARTIAL / CAPABILITY PRESENT |
| commodity | fundamentals | EIA, USDA FAS PSD, USGS MCS, EU CRMA | PARTIAL / EVIDENCE LANE |
| commodity | derivatives | CFTC COT | CONTEXT / CHALLENGER EVIDENCE |
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

`CAPITAL-AI-DATA / PVC-09..11` retains provider ingestion, canonical evidence identity, freshness and DQ. `CAPITAL-AI-SEC` retains credential/API Security requirements and independent Security verification. Provider availability never grants scoring or entitlement authority.

## Correlated open work

1. `FIN-19` must bind model/feature requirements to canonical DATA capability contracts rather than direct provider calls.
2. Direct provider-consensus or adapter paths discovered in productive FINTECH execution must be assessed for DATA/gateway bypass and routed to the owning project before remediation if ownership is foreign.
3. Runtime health/entitlement remains unverified until exact provider/runtime evidence is captured.
4. This project matrix must be refreshed whenever `PROVIDER_MATRIX_VERSION` or material gateway/enabled semantics change.
