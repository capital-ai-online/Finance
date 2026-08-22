# SC4 — API Provider Cost, Runtime Findings and Owner Configuration

Status: verified planning/runtime evidence
Date: 2026-08-22
Claim: `CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22`

## Decision summary

CAPITAL-AI SC4 now defaults to free/keyless evidence providers plus a strictly Free-Tier-governed Dune path. NewsAPI.org, CoinGlass, LunarCrush and Messari are excluded from the active provider matrix and runtime composition.

NewsAPI Developer status was rechecked against the vendor's current terms. A publicly deployed Render application is not a NewsAPI development environment merely because it is unfinished or has only a few self-owned test accounts. NewsAPI explicitly limits Developer use to development/testing and excludes staging/production. The NewsAPI integration and secret declaration were therefore superseded rather than relied on under a licensing ambiguity.

## Active provider cost / setup snapshot

| Provider | CAPITAL-AI purpose | Key | Cost boundary / policy |
|---|---|---|---|
| GoPlus Security | EVM + Solana token security | none for canonical baseline | Vendor documents Security API as free with 30 calls/min. CAPITAL-AI local ceiling is 30/min. Paid/Agent/x402 modes prohibited. |
| GDELT DOC 2.0 | Landing Page + AI Newsfeed article metadata/provenance | none | Keyless public discovery API. CAPITAL-AI projects headline/source/time/link metadata only, not publisher article bodies. |
| Kraken Futures Public Charts | OI, funding, liquidations, liquidity, slippage | none | Public read-only analytics endpoints. Exact Kraken market symbols must be governed; no private/trading API key is used. |
| DEX Screener | DEX pool liquidity, volume, buy/sell activity, pair age | none | Public API. CAPITAL-AI local request ceiling is intentionally below documented token/pair endpoint rate limits. |
| Sourcify API v2 | EVM source/bytecode verification evidence | none | Open-source/keyless lookup. Match evidence is not an external audit or formal-verification PASS. |
| DeFiLlama | TVL / fees / revenue | none for accepted public path | Existing ADR-0100 public endpoints remain canonical. Paid subscription path disabled. |
| Dune | allowlisted gap-filling on-chain saved-query results | `DUNE_API_KEY` | Free plan currently provides a monthly credit allocation. Latest-result GETs still consume result-size credits. CAPITAL-AI requires Free-Tier attestation, allowlist, exact columns and bounded rows; no query execution. |

## Excluded providers

| Provider | State | Reason |
|---|---|---|
| NewsAPI.org | EXCLUDED | Developer plan not valid for public staging/production; no paid plan approved. |
| CoinGlass | EXCLUDED | Paid/commercial API not approved; public Kraken + DEX evidence selected instead. |
| LunarCrush | EXCLUDED | Paid social provider not approved. Missing social evidence remains an explicit gap. |
| Messari | EXCLUDED DEFAULT | Additional entitlement/cost path not justified while DeFiLlama + Dune cover approved baseline/gaps. |

## Current production provider/key observations from Render logs

Runtime logs were inspected without exposing secret values.

| Existing provider | Runtime finding | Gap-closing assessment |
|---|---|---|
| Alpha Vantage | `GLOBAL_QUOTE` requests observed with key redacted; associated verified-score request returned HTTP 200 | Functionally active for existing stock flow. Commercial/public-use licensing remains separate; not promoted to crypto evidence. |
| CoinGecko | Active and regularly loading crypto assets; individual snapshot requests also show HTTP 429 | Useful keyless crypto source, but quota pressure means it should not carry additional SC4 load alone. |
| Twelve Data | Provider responds, but repeated crypto-history HTTP 429 observed | Configured/functional transport, insufficient quota for broad crypto-history coverage at current usage. |
| EODHD | Provider responds, but repeated crypto HTTP 402 plus some 404/zero-history results observed | Current entitlement does not close broad crypto-history gaps. |
| FMP | No conclusive runtime request evidence in the inspected log window | Configuration/code presence is not sufficient to mark active runtime success. |
| CoinAPI | No conclusive runtime request evidence in the inspected log window | Remains configured/unverified from this runtime audit. |
| FRED | No conclusive runtime request evidence in the inspected log window | Remains configured/unverified from this runtime audit. |
| Kraken Public | Existing repository path is unauthenticated/public | Appropriate free supplement; SC4 additionally uses public Futures Charts analytics where a governed market exists. |

## Cost and anti-overage controls

1. No active SC4 provider may auto-upgrade a plan.
2. No x402/machine-initiated payment path is permitted.
3. GoPlus canonical baseline is keyless Free Security API only.
4. Dune is blocked until `DUNE_FREE_TIER_ONLY=true` **and** `DUNE_FREE_TIER_ATTESTED=true`.
5. Dune query IDs must be allowlisted and identity-registry reviewed.
6. Dune query execution, pipeline execution, raw SQL and `ignore_max_credits_per_request` are absent/forbidden.
7. Dune result reads request only approved columns and bounded rows (default 25; implementation hard cap 100).
8. Owner must keep Dune extra-credit spending disabled or capped before attestation.
9. DeFiLlama paid API remains disabled.
10. Reintroduction of NewsAPI/CoinGlass/LunarCrush/Messari requires a new explicit cost/licensing supersession.

## Source-of-truth links

- GoPlus support/rate limit: `https://docs.gopluslabs.io/reference/support`
- GoPlus Solana Security: `https://docs.gopluslabs.io/reference/solanatokensecurityusingget`
- GDELT DOC 2.0: `https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/`
- Kraken Futures Charts API: `https://docs.kraken.com/api/docs/futures-api/charts/analytics/`
- DEX Screener API: `https://docs.dexscreener.com/api/reference`
- Sourcify API: `https://docs.sourcify.dev/docs/api/`
- DeFiLlama API: `https://defillama.com/docs/api`
- Dune credits: `https://docs.dune.com/resources/credits-billing/how-credits-work`
- Dune API settings: `https://dune.com/settings/api`
- NewsAPI terms/pricing retained only as supersession evidence: `https://newsapi.org/terms`, `https://newsapi.org/pricing`

## Owner/manual TODO ledger

- [ ] Create/verify Dune Free account and `DUNE_API_KEY`.
- [ ] Disable/cap Dune extra-credit spending; only then set `DUNE_FREE_TIER_ATTESTED=true` in production.
- [ ] Select/create only low-cost saved queries needed for evidence gaps; review query tables, columns, units and freshness.
- [ ] Add approved saved query IDs to `DUNE_ALLOWED_QUERY_IDS` and the governed identity registry.
- [ ] Curate asset → exact EVM contract or Solana mint identities; no guessed addresses.
- [ ] Curate DEX Screener chain/token identities and Kraken Futures market symbols where applicable.
- [ ] Complete public page/dataset governance: attribution, timestamp/freshness, evidence status, methodology, source-use/licensing note and retention/cache rule.
- [ ] Complete independent audit/formal-verification/oracle/exploit evidence mapping. GoPlus/Sourcify alone do not create an audit PASS.
- [ ] Resolve the Meme social/authenticity evidence gap with an approved free/open source or dataset strategy, or keep social-dependent LIVE_SCORING gates blocked.
- [ ] Complete category backtest/OOS/correlation/fingerprint gates before the already-approved Option-B model promotion is executed.

## LIVE boundary

`LIVE_DATA`, `LIVE_SCORING` and `LIVE_EXECUTION` remain distinct. Option B (`LIVE_SCORING` without `LIVE_EXECUTION`) is Owner-approved, but promotion remains conditional on all category-specific gates. LIVE_EXECUTION remains FT-7+ and blocked.
