# SC4 — API Interface Inventory Supersession

Status: active branch addendum
Date: 2026-08-22
Supersedes only conflicting SC4/news/crypto-evidence rows in `API_INTERFACE_INVENTORY.md`; all unrelated inventory entries remain unchanged.

## Why an addendum

`API_INTERFACE_INVENTORY.md` is a broad ESS-0015 repository inventory with historical/provider QA context. Rewriting unrelated rows to implement SC4 would create document drift. This addendum is therefore the authoritative delta until the next full ESS-0015 rebaseline.

## Current SC4 interfaces

| ID | Provider | Capability | Auth | Runtime decision | Evidence authority |
|---|---|---|---|---|---|
| API-NEWS-GDELT-SC4 | GDELT DOC 2.0 | article discovery/provenance | none | ACTIVE SC4 | metadata/source-link only; no score authority |
| API-CRYPTO-GOPLUS-SC4 | GoPlus Security | EVM/Solana token security | none for canonical Free baseline | ACTIVE SC4 | raw security evidence only |
| API-CRYPTO-KRAKEN-FUTURES-SC4 | Kraken Futures Public Charts | OI/funding/liquidation/liquidity/slippage | none | ACTIVE SC4 for governed market IDs | market-structure evidence only |
| API-CRYPTO-DEXSCREENER-SC4 | DEX Screener Public API | DEX liquidity/volume/transactions/pair age | none | ACTIVE SC4 for governed token IDs | DEX market evidence only |
| API-CRYPTO-SOURCIFY-SC4 | Sourcify API v2 | EVM source/bytecode verification | none | ACTIVE SC4 for governed EVM IDs | source verification only; not audit/formal-verification PASS |
| API-CRYPTO-DEFILLAMA-SC4 | DeFiLlama Public API | TVL/fees/revenue | none | KEEP ADR-0100 | canonical DeFi evidence for currently accepted fields |
| API-CRYPTO-DUNE-SC4 | Dune API | allowlisted saved-query latest results | `DUNE_API_KEY` | CONFIGURED-BLOCKED until Free-Tier attestation/query allowlist | bounded gap evidence only |

## Superseded / inactive rows

- `API-NEWS-001` NewsAPI.org: **SUPERSEDED / NOT USED**. `NEWS_API_KEY` is removed from the canonical secret manifest and SC4 runtime.
- CoinGlass extended evidence: **NOT USED**.
- LunarCrush extended evidence: **NOT USED**.
- Messari SC4 default evidence: **NOT USED**.

A legacy variable or old documentation row must not reactivate any of these providers.

## Existing provider runtime audit

Observed from Render production logs on 2026-08-22 without exposing secret values:

- Alpha Vantage — runtime request observed; existing stock verified-score request completed HTTP 200. Status: `ACTIVE_RUNTIME_EVIDENCED`.
- CoinGecko — runtime asset loads/snapshots observed, including HTTP 429. Status: `ACTIVE_RATE_LIMITED`.
- Twelve Data — repeated crypto-history HTTP 429. Status: `ACTIVE_QUOTA_CONSTRAINED`.
- EODHD — repeated crypto HTTP 402 plus 404/zero-point cases. Status: `ACTIVE_ENTITLEMENT_INSUFFICIENT_FOR_BROAD_CRYPTO`.
- FMP — no conclusive request evidence in inspected window. Status: `CONFIGURED_UNVERIFIED_RUNTIME_WINDOW`.
- CoinAPI — no conclusive request evidence in inspected window. Status: `CONFIGURED_UNVERIFIED_RUNTIME_WINDOW`.
- FRED — no conclusive request evidence in inspected window. Status: `CONFIGURED_UNVERIFIED_RUNTIME_WINDOW`.
- Kraken public data — repository path is unauthenticated; SC4 public analytics adapter requires no key. Status: `KEYLESS_AVAILABLE`.

## Governance constraints

1. No provider listed here becomes ScoringDispatcher or CanonicalScoreResult authority.
2. External identities (contract/mint/DEX token/Kraken futures market/Dune query) come only from the reviewed server-side registry.
3. Dune is Free-Tier-only and fail-closed until attested.
4. No NewsAPI/CoinGlass/LunarCrush/Messari secret is required by SC4.
5. Missing social/news/security/on-chain fields remain missing; no 0, PASS or neutral 50 substitution.
6. Option B LIVE_SCORING approval is recorded separately; category promotion remains conditional on all evidence/DQ/backtest/audit gates.
