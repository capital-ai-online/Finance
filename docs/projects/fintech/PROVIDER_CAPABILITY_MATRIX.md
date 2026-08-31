# CAPITAL-AI-FINTECH — Provider Capability Matrix

**Baseline:** `main@e434fce28630fc694b9dfe471418a2ac98eda9dd`  
**Source correlation:** `fintech/capital-ai-fintech-consolidation-20260831@e32112791458902959dfc53e0fd1f6df477cc356`  
**Canonical provider source:** `src/platform/MarketData/ProviderMatrix.ts` (`provider-matrix/1.9.1`)  
**Role:** FINTECH capability-requirement projection only; not a second provider registry or DATA authority.

Current main still exposes `provider-matrix/1.9.1`. Static `enabled=true` or registry presence is not proof of credentials, entitlement, subscription, freshness or runtime health.

## Provider inventory carried forward

| Provider | Role | Asset classes | Declared capabilities | Integration state |
|---|---|---|---|---|
| TwelveData | primary | stock, forex, crypto, commodity | snapshot, quote, history | behind_gateway |
| FMP Index | primary | index | snapshot, quote | behind_gateway |
| CoinGecko | primary | crypto | snapshot, quote | behind_gateway |
| Alpaca | shadow | stock | snapshot, trade | shadow_only |
| FMP Index History | primary | index | history | history_gateway_only |
| CoinAPI | secondary | crypto | snapshot, quote | behind_gateway / consensus use exists |
| EODHD | secondary | crypto | snapshot, history | behind_gateway |
| Stooq | secondary | stock, index | snapshot, history | legacy_off_gateway |
| DeFiLlama | secondary | crypto | fundamentals | not_wired |
| EIA | primary | commodity | fundamentals | not_wired |
| USDA FAS PSD | primary | commodity | fundamentals | not_wired |
| CFTC COT | secondary | commodity | derivatives | not_wired |
| USGS MCS | primary | commodity | fundamentals | not_wired |
| EU CRMA | secondary | commodity | fundamentals | not_wired |
| Binance Public | primary | crypto | snapshot, quote, bars, derivatives | not_wired |
| Kraken Futures Public | primary | crypto | quote, bars, derivatives | not_wired |
| GoPlus | secondary | crypto | security, on-chain | not_wired |
| DEX Screener | secondary | crypto | snapshot, quote, on-chain | not_wired |
| Sourcify | secondary | crypto | security, on-chain | not_wired |
| Free Crypto News | primary | crypto | news | not_wired |
| GDELT | secondary | crypto, stock, forex, commodity, index, bond, macro | news | not_wired |
| Dune | secondary | crypto | on-chain, governance | not_wired |

Provider count carried forward: **22**.

## Asset-class capability projection

| Asset class | Required capability context | Current repository provider evidence | FINTECH status |
|---|---|---|---|
| crypto | verified snapshot / quote | CoinGecko, TwelveData; CoinAPI/EODHD as bounded additional sources | PARTIAL / HARDEN |
| crypto | bars / derivatives | Binance Public, Kraken Futures Public | RESEARCH / NOT WIRED |
| crypto | fundamentals | DeFiLlama | EVIDENCE ONLY |
| crypto | security / on-chain | GoPlus, Sourcify, DEX Screener, Dune | EVIDENCE / RESEARCH |
| crypto | news | Free Crypto News, GDELT | RESEARCH / PROVENANCE REQUIRED |
| stock | snapshot / quote | TwelveData; Alpaca shadow; Stooq legacy | SUPPORTED / LEGACY DEBT |
| forex | snapshot / quote | TwelveData | SUPPORTED |
| index | snapshot / quote | FMP Index; Stooq legacy | SUPPORTED / LEGACY DEBT |
| index | history | FMP Index History; Stooq legacy | PARTIAL |
| commodity | quote / history | TwelveData | PARTIAL / CAPABILITY PRESENT |
| commodity | fundamentals | EIA, USDA FAS PSD, USGS MCS, EU CRMA | PARTIAL / EVIDENCE LANE |
| commodity | derivatives | CFTC COT | CONTEXT / CHALLENGER EVIDENCE |
| bond | news / context | GDELT | PARTIAL |
| bond | scoring input | bounded sovereign-benchmark-yield scoring exists; ProviderMatrix does not by itself prove a quote source | PARTIAL / CONTRACT-BOUND |

ETF, Fund and REIT remain unsupported as separate scoreable classes unless explicit repository contracts are introduced.

## Fallback rules retained from the older FinTech branch

A similarly named provider capability is **not** sufficient to prove semantic fallback equivalence.

- crypto independent spot consensus: EODHD historical/EOD data must not masquerade as a live equivalent;
- crypto snapshot: CoinGecko/CoinAPI/EODHD/TwelveData capabilities do not establish an automatic canonical fallback without freshness/DQ/equivalence evidence;
- stock: Stooq legacy and Alpaca shadow are not automatically promoted behind TwelveData;
- index: Stooq legacy is not automatically promoted behind FMP Index;
- crypto news: Free Crypto News → GDELT may be used only as documented discovery/metadata fallback while preserving provider provenance;
- commodity fundamentals: official sources often describe different semantic fields and are not generic substitutes;
- required evidence that cannot be satisfied remains unavailable/non-computable; no neutral or synthetic fallback is permitted.

## Ownership boundary

FINTECH owns the mapping:

`asset class -> financial feature/model requirement -> required provider capability`.

`CAPITAL-AI-DATA / PVC-09..11` retains provider ingestion, canonical evidence identity, freshness and DQ. `CAPITAL-AI-SEC` retains credential/API Security requirements and independent Security verification. Provider availability never grants scoring authority.

## Correlated open work

1. FIN-19 must bind model/feature requirements to canonical DATA capability contracts rather than direct provider calls.
2. Any direct provider-consensus or adapter path discovered in productive FINTECH execution must be assessed for DATA/gateway bypass and routed to the owning project before remediation.
3. Runtime health/entitlement remains unverified until exact provider/runtime evidence is captured.