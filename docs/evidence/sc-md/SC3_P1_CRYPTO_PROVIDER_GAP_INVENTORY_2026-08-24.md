# SC-3 / P1 — Crypto Meme/DeFi Provider & Evidence Gap Inventory

**Date:** 2026-08-24  
**Status:** CURRENT-MAIN INVENTORY + P1-A CONTRACT FOUNDATION / NO PROVIDER MUTATION  
**Base:** `main@7afa86e24812e3de96e93882b9658d2b2e0311e7` at P1-A branch start  
**ProviderMatrix:** `provider-matrix/1.9.0`  
**P1 merge:** PR #520 / `6c46aab0ab6341c20db6ad001b98572237fbcda0`  
**P1-A Claim:** `FINTECH-CORE-P1A-HONEYPOT-SIMULATION-EVIDENCE-2026-08-24`  
**Protected authorities:** ADR-0087, ADR-0099, ADR-0100, ProviderMatrix

## 1. Purpose

P1/P1-A do not add another provider registry and do not promote Meme/DeFi scoring. This inventory correlates the evidence requirements from Meme/DeFi Research Scoring `0.3.0` against actual current `main` and the bounded P1-A transaction-simulation contract so later provider-adapter packages remain architecture-conformant.

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

`ProviderMatrix` remains the single provider inventory. Specialist evidence providers reuse shared governed transport, rate-limit, circuit-breaker and Supervisor-health controls without becoming quote, scoring, ranking, risk, order or execution authorities.

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
| GoPlus P1-A | EVM transaction simulation | authenticated read-only pre-run response, revert state, target-token balance delta, flags | research evidence only; no route construction/signing/broadcast |
| DEX Screener | DEX market structure | token/pair activity and liquidity context | evidence-only; not execution-price authority |
| Sourcify | source/bytecode verification | source verification match | verification evidence only; not audit/formal-verification PASS |
| Dune | governed saved-query evidence | allowlisted read-only on-chain/governance query results | evidence-only |
| Free Crypto News | primary crypto-news discovery | metadata, publisher URL and source provenance | evidence-only; no body scrape, sentiment or scoring authority |
| GDELT | secondary/cross-asset news discovery | article discovery metadata/source links | evidence-only; no direct sentiment/scoring authority |

P1-A reuses the existing `goplus` provider identity and `ResearchEvidenceProviderHttp`. It does not add a second registry entry or provider transport.

## 3. Main delta since predecessor P1 inventory

The predecessor P1 inventory was based on `main@14e4f3c8...`. Current `main@7afa86e2...` has materially evolved:

- P1 Portfolio Allocation / bounded FT-5 projection is merged via PR #520;
- the old P1 coordination claim is stale on main and is released in P1-A according to its own release condition;
- `ProviderMatrix` remains `1.9.0`;
- `FreeCryptoNewsEvidenceProvider` is present and registered as primary crypto-news metadata/provenance source;
- GDELT remains secondary/fallback/cross-asset article discovery;
- Commodity P2-B/PIT and AI-Newsfeed merges do not change Meme/DeFi evidence authority;
- PR #523 narrows Owner-approved mutation handoff paths but does not create Financial/Scoring/Execution authority for P1-A;
- Meme/DeFi challengers remain `0.3.0`, non-executable;
- P1-A now supplies a typed **contract foundation** for governed EVM BUY/SELL pre-run evidence via the existing GoPlus provider.

The high-value remaining gaps are still primarily **semantic evidence-contract, coverage and validation gaps**, not a generic lack of HTTP providers.

## 4. P1-A Honeypot Buy/Sell Simulation Foundation

Contracts:

```text
goplus-transaction-simulation-evidence/1.0.0
crypto-meme-honeypot-simulation-evidence/0.1.0
```

Canonical flow:

```text
externally governed route/calldata evidence
  -> existing goplus ProviderMatrix identity
  -> ResearchEvidenceProviderHttp
  -> GoPlus EVM transaction_simulation
  -> BUY + SELL observations
  -> exact chain/token/route-authority correlation
  -> risk.buySimulationSuccess
  -> risk.sellSimulationSuccess
```

Security/data-integrity properties:

- missing `GOPLUS_API_KEY` -> `NOT_CONFIGURED`, no network call;
- invalid route identity/calldata -> `INVALID`, no network call;
- provider call is read-only pre-run; no signing/broadcast/order path exists;
- transaction fingerprint binds kind/chain/token/from/to/data/value/gas/nonce and route authority;
- BUY success requires positive target-token balance delta;
- SELL success requires negative target-token balance delta;
- provider-confirmed revert is an explicit failed direction;
- missing target-token balance delta remains `NOT_COMPUTABLE` rather than FAIL/PASS;
- BUY and SELL must share chain, token and route authority/version exactly;
- token-security flags (`is_honeypot`, `cannot_buy`, `cannot_sell_all`) cannot manufacture a simulation PASS;
- output is `scoreEligible=false`, `executionEligible=false`.

What this foundation **does not prove**:

- production credential/entitlement availability;
- complete chain/asset coverage;
- governed route/calldata construction for the real asset universe;
- observation freshness/SLA sufficient for model promotion;
- false-positive/false-negative rates against known honeypots and normal tokens;
- model promotion or live execution readiness.

No live provider request or external provider mutation was performed in this work package.

## 5. Remaining gap matrix

Legend:

- **COVERED** — current adapter can supply the required raw evidence when identity/availability gates pass;
- **PARTIAL** — current providers cover only part of the feature family or do not prove the required semantic claim;
- **FOUNDATION** — typed bounded contract/adapter exists, but real coverage/freshness/validation evidence is still required;
- **GAP** — no current authoritative adapter/evidence contract fully supplies the requirement;
- **IDENTITY/COVERAGE** — adapter exists, but governed asset/provider mapping or production coverage is incomplete.

| Feature family required by Meme/DeFi 0.3.0 | Current candidates | Status | Remaining work |
|---|---|---|---|
| Spot/market price context | CoinGecko + CoinAPI + historical EODHD | COVERED / POLICY-BOUNDED | preserve canonical/freshness roles; historical EODHD cannot substitute current evidence |
| Futures OI / funding / depth | Binance Public + Kraken Futures | COVERED / IDENTITY-COVERAGE | expand governed market identity mapping and availability evidence; preserve independent provenance/correlation controls |
| DEX liquidity / pool activity | DEX Screener | PARTIAL / IDENTITY-COVERAGE | complete governed chain/token identity coverage and field-admissibility/freshness evidence |
| Token permissions / obvious contract risks | GoPlus token security | PARTIAL | bind exact feature semantics and chain coverage; never map provider availability to security PASS |
| Buy/Sell honeypot transaction simulation | GoPlus P1-A transaction simulation | FOUNDATION | real credential/entitlement proof, governed route/calldata evidence, asset/chain coverage, freshness policy and known-positive/negative validation |
| Source/bytecode verification | Sourcify | COVERED for source verification only | preserve explicit boundary: match != audit, exploit-free, formal verification or safe contract |
| Protocol TVL / fees / revenue | DeFiLlama | COVERED for canonical raw protocol fields | complete protocol/token identity resolution and category-level evidence admission |
| Governed on-chain custom metrics | Dune saved queries | PARTIAL | reviewed query IDs/columns, schema/row/freshness and entitlement gates per semantic contract |
| Crypto news provenance | Free Crypto News + GDELT | COVERED for discovery metadata | publisher/source attribution remains mandatory; article metadata is not social sentiment |
| Holder clustering: sniper/team/exchange wallets | Dune + chain-specific raw data candidates | GAP / PARTIAL | governed entity-label/clustering methodology required; raw wallet lists cannot become cluster truth |
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

## 6. Highest-value next adapter packages

### P1-A — hard-gate evidence completion

Current ordering:

1. **Honeypot buy/sell simulation:** typed foundation implemented in this branch; remaining coverage/freshness/route-evidence/validation proof is still open;
2. exploit incident lifecycle/status;
3. oracle integrity/liveness/deviation evidence;
4. external audit / formal-verification evidence semantics;
5. holder/entity clustering methodology.

Each remains a separate evidence contract/adapter package behind existing ProviderMatrix/transport controls where applicable. None may write scores directly.

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

## 7. Correlation / double-counting controls

Existing SC-3 rules remain mandatory:

- Binance and Kraken remain independently attributable; observations are not automatically averaged/summed;
- TVL/fees/revenue remain correlation-bound as `defi-scale-activity`;
- holder/rug/social subfeatures are composed only once inside their designated factor families;
- provider count is not confidence by itself;
- the same fact observed through Dune and another provider is not two independent positive weights without governed correlation treatment;
- Free Crypto News and GDELT can independently corroborate discovery/provenance but duplicate publisher/article records must not become duplicate sentiment or confidence evidence;
- GoPlus token-security flags and GoPlus transaction simulation are two semantically different observations and must not be double-counted as independent positive security weights; only the transaction-simulation contract may populate the two simulation hard-gate keys.

## 8. Promotion boundary

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
