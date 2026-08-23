# SC-3 / P1 — Crypto Meme/DeFi Provider & Evidence Gap Inventory

**Date:** 2026-08-24  
**Status:** CURRENT-MAIN INVENTORY / NO PROVIDER MUTATION  
**Base:** `main@14e4f3c8a309faae63fb336a432aac38ab08ceda`  
**ProviderMatrix:** `provider-matrix/1.9.0`  
**Claim:** `FINTECH-CORE-P1-PORTFOLIO-ALLOCATION-PROVIDER-GAPS-2026-08-24`  
**Protected authorities:** ADR-0087, ADR-0099, ADR-0100, ProviderMatrix

## 1. Purpose

P1 does not add another provider registry and does not promote Meme/DeFi scoring. It correlates the evidence requirements from the current Meme/DeFi Research Scoring `0.3.0` against actual current `main` so later provider-adapter packages are bounded and do not duplicate already-landed evidence paths.

Current registry state remains:

```text
crypto-meme-integrity@0.3.0
  lifecycle=challenger
  scoreEligible=false
  executor=research-only:not-executable

crypto-defi-fundamental@0.3.0
  lifecycle=challenger
  scoreEligible=false
  executor=research-only:not-executable
```

Provider availability therefore remains evidence capacity, never model promotion.

## 2. Current provider architecture

`ProviderMatrix` remains the single provider inventory. Specialist evidence providers may use the shared governed research-evidence transport without becoming quote, scoring, ranking, risk, order or execution authorities.

Current crypto-relevant matrix entries and adapters include:

| Provider | Current role | Implemented / bounded evidence surface | Authority |
|---|---|---|---|
| CoinGecko | primary market data | canonical crypto market snapshot / quote evidence | MarketData evidence; no execution price authority |
| CoinAPI | secondary market data | secondary crypto snapshot/quote evidence | bounded market evidence |
| EODHD | secondary historical market data | historical EOD crypto snapshot/history | never masquerades as live execution evidence |
| DeFiLlama | DeFi fundamentals | TVL / fees / revenue protocol evidence | evidence-only, ADR-0100 |
| Binance Public | crypto market/derivatives | public bars, OI, funding, mark/index/depth analytics | evidence-only; no account/order authority |
| Kraken Futures Public | independent derivatives | governed futures analytics / liquidity / slippage evidence | evidence-only |
| GoPlus | token/contract security | EVM/Solana token-security / permission context | evidence-only; provider state != security PASS |
| DEX Screener | DEX market structure | token/pair activity and liquidity context | evidence-only; not execution-price authority |
| Sourcify | source/bytecode verification | source verification match | verification evidence only; not audit/formal-verification PASS |
| Dune | governed saved-query evidence | allowlisted read-only on-chain/governance query results | evidence-only |
| Free Crypto News | primary crypto-news discovery | metadata, publisher URL and source provenance | evidence-only; no body scrape, sentiment or scoring authority |
| GDELT | secondary/cross-asset news discovery | article discovery metadata/source links | evidence-only; no direct sentiment/scoring authority |

No new vendor is required merely to reproduce these already-landed capabilities.

## 3. Main delta since predecessor P1 inventory

The predecessor P1 inventory was based on `main@800b0526...`. Current main has materially evolved:

- `ProviderMatrix` is now `1.9.0`;
- `FreeCryptoNewsEvidenceProvider` is present and registered as the primary crypto-news metadata/provenance source;
- GDELT remains secondary/fallback/cross-asset article discovery;
- commodity provider expansion does not change Meme/DeFi evidence authority;
- Meme/DeFi challengers are now `0.3.0` on main;
- no new current-main provider closes holder clustering, dedicated honeypot simulation, formal verification, canonical exploit lifecycle or generic oracle-integrity semantics completely.

Therefore the high-value P1 gaps remain primarily **semantic evidence-contract gaps**, not a generic lack of HTTP providers.

## 4. Remaining gap matrix

Legend:

- **COVERED** — current adapter can supply the required raw evidence when identity/availability gates pass;
- **PARTIAL** — current providers cover only part of the feature family or do not prove the required semantic claim;
- **GAP** — no current authoritative adapter/evidence contract fully supplies the requirement;
- **IDENTITY/COVERAGE** — adapter exists, but governed asset/provider mapping or production coverage is incomplete.

| Feature family required by Meme/DeFi 0.3.0 | Current candidates | Status | Remaining work |
|---|---|---|---|
| Spot/market price context | CoinGecko + CoinAPI + historical EODHD | COVERED / POLICY-BOUNDED | preserve canonical/freshness roles; historical EODHD cannot substitute current evidence |
| Futures OI / funding / depth | Binance Public + Kraken Futures | COVERED / IDENTITY-COVERAGE | expand governed market identity mapping and availability evidence; preserve independent provenance/correlation controls |
| DEX liquidity / pool activity | DEX Screener | PARTIAL / IDENTITY-COVERAGE | complete governed chain/token identity coverage and field-admissibility/freshness evidence |
| Token permissions / obvious contract risks | GoPlus | PARTIAL | bind exact feature semantics and chain coverage; never map provider availability to security PASS |
| Source/bytecode verification | Sourcify | COVERED for source verification only | preserve explicit boundary: match != audit, exploit-free, formal verification or safe contract |
| Protocol TVL / fees / revenue | DeFiLlama | COVERED for canonical raw protocol fields | complete protocol/token identity resolution and category-level evidence admission |
| Governed on-chain custom metrics | Dune saved queries | PARTIAL | reviewed query IDs/columns, schema/row/freshness and entitlement gates per semantic contract |
| Crypto news provenance | Free Crypto News + GDELT | COVERED for discovery metadata | publisher/source attribution remains mandatory; article metadata is not social sentiment |
| Holder clustering: sniper/team/exchange wallets | Dune + chain-specific raw data candidates | GAP / PARTIAL | governed entity-label/clustering methodology required; raw wallet lists cannot become cluster truth |
| Honeypot buy/sell transaction simulation | GoPlus related security fields | GAP / PARTIAL | dedicated transaction-simulation semantics/evidence required where the hard gate demands actual buy/sell simulation |
| External audit history | GoPlus/Sourcify context | GAP | add governed audit-source evidence only after provenance/licensing review |
| Formal verification | Sourcify does not prove this claim | GAP | dedicated verifiable source/contract required; never infer from verified source code |
| Exploit incident status / unresolved exploit | news + Dune/security facts may contribute | PARTIAL | canonical incident identity, lifecycle/status, duplicate resolution and freshness required |
| Oracle integrity / liveness / deviation protection | protocol-specific Dune/raw evidence possible | GAP / PARTIAL | dedicated oracle evidence semantics/provider mapping required |
| Governance participation / proposal quality | Dune | PARTIAL | saved-query semantic contracts and identity coverage; quality must remain distinct from activity count |
| Developer activity | public source candidates / Dune | PARTIAL | source rights, project identity, anti-gaming and freshness; no star/count shortcut as quality authority |
| Active users / retention / organic activity | Dune | PARTIAL | reviewed active-address/retention methodology plus bot/sybil controls |
| Token unlock pressure | Dune / protocol candidates | PARTIAL / GAP | canonical vesting/unlock source and temporal schedule semantics |
| Treasury / runway | Dune / protocol candidates | PARTIAL / GAP | treasury identity, holdings valuation, liabilities and timestamp policy |
| Staking sustainability | Dune / protocol candidates | PARTIAL / GAP | distinguish nominal emissions/rewards from sustainable real yield |
| Governed social sentiment | no authoritative social provider on current main | GAP | explicit privacy/licensing/bot-resistance review required; news is not social evidence |
| NLP sentiment model | optional governed model layer | GAP for production-governed NLP | registry/version/license/calibration/OOS evidence required; model output is not factual provenance |

## 5. Highest-value next adapter packages

### P1-A — hard-gate evidence completion

Prioritize evidence families that block safe research validation/promotion:

1. honeypot buy/sell simulation;
2. exploit incident lifecycle/status;
3. oracle integrity/liveness/deviation evidence;
4. external audit / formal-verification evidence semantics;
5. holder/entity clustering methodology.

Each should be a separate evidence contract/adapter package behind existing ProviderMatrix/transport controls where applicable. None may write scores directly.

### P1-B — coverage expansion of existing adapters

1. governed Binance/Kraken futures identities;
2. governed GoPlus EVM/Solana identity/feature mappings;
3. DEX Screener chain/token identities;
4. DeFiLlama protocol/token resolution;
5. reviewed Dune saved-query IDs/schemas;
6. Free Crypto News/GDELT provenance/freshness normalization where consumed by Research contracts.

This has lower architectural risk than adding new vendors because adapters and transport/governance mechanisms already exist.

### P1-C — activity/tokenomics/social evidence

After hard-gate completion:

- retention / organic activity;
- governance participation;
- treasury / unlock / staking sustainability;
- governed social sentiment/NLP.

## 6. Correlation / double-counting controls

Existing SC-3 rules remain mandatory:

- Binance and Kraken remain independently attributable; observations are not automatically averaged/summed;
- TVL/fees/revenue remain correlation-bound as `defi-scale-activity`;
- holder/rug/social subfeatures are composed only once inside their designated factor families;
- provider count is not confidence by itself;
- the same fact observed through Dune and another provider is not two independent positive weights without governed correlation treatment;
- Free Crypto News and GDELT can independently corroborate discovery/provenance but duplicate publisher/article records must not become duplicate sentiment or confidence evidence.

## 7. Promotion boundary

Provider coverage is necessary evidence capacity, not model promotion.

Meme/DeFi remain non-executable challengers until the same reviewed model version has:

- complete REQUIRED/HARD_GATE provider coverage;
- Provenance/DQ/Freshness admissibility;
- effective-feature/effective-weight fingerprints;
- out-of-sample / walk-forward validation;
- stress/manipulation/exploit/liquidity-shock evidence;
- correlation/double-counting analysis;
- explicit Owner approval through the existing `ScoringModelRegistry -> ScoringDispatcher` governance path.

`LIVE_EXECUTION` remains FT-7+ and blocked.
