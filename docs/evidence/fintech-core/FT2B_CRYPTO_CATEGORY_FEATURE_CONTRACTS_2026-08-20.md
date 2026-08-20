# FT-2B Evidence — Crypto Category Feature Contracts

**Evidence-ID:** `FT2B-CRYPTO-CATEGORY-FEATURE-CONTRACTS-2026-08-20`  
**Date:** 2026-08-20  
**Roadmap:** `FT-CORE-CRYPTO-01 / FT-2B`  
**ADR:** `ADR-0098`  
**Branch:** `feat/fintech-core-crypto-module-01`

## Main synchronization

Before FT-2B implementation, PR #458 was confirmed merged and the branch was synchronized to:

`main@0b8e4122ddaef6ad6671a219f262b17240d65500`

Post-sync comparison reported `behind_by=0`.

The merge introduced the verified per-symbol asset-display/market-data path, including `VerifiedCryptoSnapshot` with CoinGecko-backed market/supply fields, ProviderMatrix rate-limit/circuit-breaker controls, provenance timestamps and explicit non-execution semantics.

FT-2B reuses this evidence boundary rather than creating a second Crypto market-data provider.

## Open-PR correlation

At the FT-2B checkpoint:

- PR #459 is a frontend architecture consolidation and has no direct path overlap with `src/platform/FinTechCore/**`.
- PR #460 implements the Documentary Maintenance Control Loop and changes `docs/adr/registry.json` plus `docs/governance/document-registry.json`.
- FT-2B therefore does not make further registry edits while PR #460 remains open. Final registry reconciliation remains a mandatory pre-PR gate for this branch.

## Implemented contracts

### Category feature catalog

Added:

`src/platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts.ts`

Contract:

`fintech-core.crypto/category-features/0.1.0`

The contract defines profile-specific feature requirements for:

- Layer 1,
- Layer 2 / Rollup,
- DeFi,
- RWA,
- NFT,
- Stablecoin,
- Exchange Token,
- GameFi,
- AI/DePIN.

`meme` and `generic` remain non-computable while their source profiles are `PENDING_EVIDENCE`.

## Evidence semantics

Each feature definition declares:

- stable feature key,
- domain,
- value type,
- requirement class (`REQUIRED`, `OPTIONAL`, `HARD_GATE`),
- unit/semantic description.

Each observation carries:

- status (`VERIFIED`, `STALE`, `NOT_AVAILABLE`, `INVALID`, `NOT_APPLICABLE`),
- typed value or explicit null,
- provider,
- evidence references,
- observed/retrieved timestamps,
- degraded/reason metadata where relevant.

### Fail-closed rules

- Missing/stale/invalid required evidence is never coerced to zero.
- A missing hard gate yields `NOT_COMPUTABLE`.
- A verified boolean hard gate with value `false` yields `BLOCKED`.
- Unknown evidence keys are recorded as rejected and never promoted implicitly.
- Duplicate feature keys are treated as a deterministic contract error.
- Evidence coverage measures only availability of required/hard-gate evidence; it is not a financial score.

## Universal market/supply evidence separation

The following verified fields are modeled as universal evidence only:

- price USD,
- 24h change,
- market capitalization,
- 24h volume,
- circulating supply,
- max supply,
- total supply.

They do **not** automatically satisfy category features.

Examples of forbidden implicit promotion:

- trading volume -> liquidity quality,
- market cap -> network adoption,
- supply -> tokenomics quality,
- price change -> technical pattern quality,
- market cap/volume -> protocol revenue or TVL.

Any future promotion requires a separate reviewed deterministic adapter with explicit semantics and evidence lineage.

## PR #458 adapter reuse

Added:

`src/platform/FinTechCore/Modules/Crypto/Adapters/VerifiedCryptoSnapshotFeatureAdapter.ts`

Contract:

`fintech-core.crypto/verified-snapshot-feature-adapter/0.1.0`

The adapter is intentionally pure:

- accepts an existing `VerifiedCryptoSnapshot`,
- performs no provider/network call,
- creates no score,
- maps only provider-provenance-backed fields,
- converts provider nulls to `NOT_AVAILABLE`, never zero,
- converts degraded/last-known-good snapshots to `STALE`, not `VERIFIED`.

The provider fetch, RateLimitBudget and CircuitBreaker remain owned by the established MarketData/provider layer.

## Source-to-feature traceability

The feature vocabulary follows the Owner-provided FinTech Enterprise Orchestration Model:

- L1: active addresses, transaction growth, fees/revenue, developer activity, TVL/stablecoin supply, security, decentralization, tokenomics and liquidity;
- L2: usage, TPS/cost, sequencer economics, DA cost, TVL/bridged TVL, L1/L2 flows, app activity, retention, unlocks, rollup liveness and bridge security;
- DeFi: TVL, fees, protocol/tokenholder revenue, utilization, bad debt/liquidation loss, emissions, treasury, LP concentration, smart-contract/oracle risk;
- RWA: backing, attestation, maturity, yield, default/counterparty risk, redemption, jurisdiction, custody, NAV latency, rights and secondary liquidity;
- NFT: floor/sales, buyers/sellers, holders/concentration, listing/spread, floor volatility, royalties, rarity, wash trading and community;
- Stablecoin: peg deviation, reserves, attestation, redemption and abnormal outflow controls;
- Exchange Token: exchange volume/revenue, burn/staking/utility, reserves/PoR, counterparty/regulatory risk, concentration and liquidity;
- GameFi: DAU, DAU/MAU, revenue, retention, NFT activity and token utility;
- AI/DePIN: active nodes, useful work, revenue, customer growth, utilization and token utility.

External primary-source research performed for FT-2B additionally confirms that CoinGecko exposes multi-category metadata and market endpoints, Coin Metrics publishes explicit network metric definitions such as active-address counts, and DefiLlama distinguishes TVL, fees and protocol revenue. These external sources validate the need to preserve metric semantics rather than infer one feature from another.

## Tests added

- `tests/unit/fintechCoreCryptoCategoryFeatureContracts.test.ts`
- `tests/unit/fintechCoreVerifiedCryptoSnapshotFeatureAdapter.test.ts`
- `tests/architecture/fintechCoreAuthorityBoundary.test.ts` extended

Covered invariants include:

- profile feature-key uniqueness,
- complete/partial/not-computable/blocked states,
- hard-gate DENY behavior,
- stale evidence handling,
- Meme `PENDING_EVIDENCE`,
- universal evidence non-promotion,
- unknown/duplicate evidence behavior,
- deterministic provenance mapping,
- no score/execution output,
- no provider I/O inside the FinTech Core adapter.

## Explicitly not implemented in FT-2B

- no new Provider API,
- no CoinGecko plugin/runtime dependency,
- no Coin Metrics or DefiLlama commercial integration,
- no category score calculation,
- no ScoringDispatcher modification,
- no Pattern detector,
- no Supabase mutation,
- no Render mutation/deploy,
- no live/paper order side effect.

## Validation status

Repository diff and architecture boundaries are statically reviewable. No expensive GitHub CI has been triggered by this workstream.

The connector execution surface does not provide a local repository runtime; therefore TypeScript, Vitest, production build and repository quality checks are not claimed as PASS yet. They remain required before PR merge readiness.
