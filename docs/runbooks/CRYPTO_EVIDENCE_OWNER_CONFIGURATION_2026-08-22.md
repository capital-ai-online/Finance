# CAPITAL-AI — Crypto Evidence Owner Configuration Runbook

Status: Owner/manual checklist — free-provider supersession
Date: 2026-08-22
Related: `SC4_CRYPTO_EVIDENCE_POLICY_SUPERSESSION_2026-08-22.md`

This runbook separates account/security/dataset mutations from repository preparation. Never add real secrets to GitHub files, chat, screenshots or browser-visible `VITE_*` variables.

## Phase 0 — Provider decision — COMPLETE

- [x] Binance Public and Kraken Public selected as **co-primary crypto market/derivatives suppliers**.
- [x] NewsAPI.org, CoinGlass, LunarCrush and Messari excluded from active SC4 defaults.
- [x] GoPlus Free selected for EVM/Solana security evidence.
- [x] GDELT DOC 2.0 selected for keyless news metadata/provenance.
- [x] DEX Screener selected for keyless DEX pool/liquidity/activity evidence.
- [x] Sourcify API v2 selected for EVM source/bytecode verification evidence.
- [x] DeFiLlama public API remains canonical keyless DeFi TVL/fees/revenue source under ADR-0100.
- [x] Dune uses the server-side TypeScript evidence provider and may operate only through governed saved-query result reads under explicit `FREE_TIER` or bounded `TRIAL_14D` entitlement mode.

## Phase 1 — Dune account/key setup

- [x] Owner provisioned `DUNE_API_KEY` with read permissions in Render Render Environment Variables on 2026-08-22.
- [ ] Confirm Dune extra-credit/overage spending is disabled or capped in the account/team settings.
- [ ] Determine the entitlement mode currently applicable to the account: permanent `FREE_TIER` or Owner-reported temporary `TRIAL_14D` fuller/full-data-source entitlement.

The exact 14-day trial term was not independently visible in the public Dune documentation reviewed on 2026-08-22. CAPITAL-AI therefore treats it as an **Owner-attested account entitlement**, not a vendor-global policy assumption.

## Phase 2 — Dune entitlement configuration

### If using `FREE_TIER`
- [ ] Set `DUNE_ACCESS_MODE=FREE_TIER`.
- [ ] Set `DUNE_FREE_TIER_ATTESTED=true` only after confirming the account/billing boundary.
- [ ] Keep `DUNE_TRIAL_ATTESTED=false` and trial timestamps empty.

### If using the 14-day trial
- [ ] Set `DUNE_ACCESS_MODE=TRIAL_14D`.
- [ ] Set `DUNE_TRIAL_ATTESTED=true` after confirming the account actually shows the temporary entitlement.
- [ ] Set exact UTC/ISO timestamps in `DUNE_TRIAL_STARTED_AT` and `DUNE_TRIAL_ENDS_AT`.
- [ ] Configured duration must be >0 and <=14 days.
- [ ] Runtime blocks reads before start and at/after expiry.
- [ ] Trial expiry must **not** auto-convert to paid access.

## Phase 3 — Production secret/configuration state

Repository preparation:
- [x] `NEWS_API_KEY` removed from the canonical secret manifest.
- [x] `DUNE_API_KEY` added to `scripts/security/secretFileManifest.ts`.
- [x] Dune access mode, trial timestamps/attestations and row cap are non-secret governance configuration.
- [x] Semantic `DUNE_QUERY_*` variables are the single numeric Dune query-ID authority.
- [x] The provider derives its internal allowlist from `DuneSavedQueryRegistry`; `DUNE_ALLOWED_QUERY_IDS` is superseded and removed.
- [x] Dune query IDs are no longer duplicated inside `CryptoEvidenceIdentityRegistry`.
- [x] Owner-reviewed values are configured in repository deployment examples: `DUNE_QUERY_AAVE_ACTIVE_ADDRESSES=5833540`, `DUNE_QUERY_AAVE_TREASURY=27230`.
- [x] Oracle, Retention, Token Emissions and LP Concentration remain blank until reviewed saved queries exist.
- [x] No new secret is required for Binance Public or Kraken Public.

Manual production cleanup after supersession is deployed and verified:
- [ ] Remove obsolete `NEWS_API_KEY` from the production server-only Render environment variables if still present.
- [ ] Do not add CoinGlass/LunarCrush/Messari keys for SC4.

## Phase 4 — Provider identity governance

No symbol-to-contract/market guessing is allowed. Review only applicable fields:
- canonical CAPITAL-AI symbol;
- EVM chain ID + exact contract or Solana exact mint;
- DEX Screener chain/token identity;
- exact Binance futures symbol where applicable;
- exact Kraken Futures public market symbol where applicable;
- authoritative identity sources, reviewer and verification timestamp.

Dune saved-query contracts are governed separately in `DuneSavedQueryRegistry`; this prevents asset identity and query configuration from becoming duplicate authorities.

Binance and Kraken remain separately attributable. Similar observations are not automatically summed, averaged or treated as independent confirmations without a separately versioned anti-correlation/consensus transform.

## Phase 5 — Dune query governance

- [x] Create/select saved queries only for evidence not standardized by DeFiLlama/GoPlus/Binance/Kraken/DEX Screener/Sourcify.
- [x] Record purpose, exact columns, units, freshness and feature mapping in `DuneSavedQueryRegistry`.
- [x] Resolve numeric IDs only from semantic `DUNE_QUERY_*` server environment values.
- [x] Keep `DUNE_MAX_RESULT_ROWS=25`; implementation hard cap is 100.
- [x] Never enable arbitrary SQL, execute-query, pipelines or credit-limit bypass.
- [ ] Review look-ahead leakage and correlated/double-counted features for every query before LIVE_DATA.
- [ ] Verify schema-drift, ungoverned-query and entitlement-expiry negative tests against the real Dune result surface.

### Aave / Ethereum — governed query inventory

| State | Env key | Query | Purpose | Expected columns | Mapping / authority |
|---|---|---:|---|---|---|
| `OWNER_ATTESTED_PENDING_RUNTIME_SCHEMA_CHECK` | `DUNE_QUERY_AAVE_ACTIVE_ADDRESSES` | `5833540` | Active Addresses | `observed_at`, `active_addresses` | `active_addresses` → `protocol.activeAddresses24h` |
| `OWNER_ATTESTED_PENDING_RUNTIME_SCHEMA_CHECK` | `DUNE_QUERY_AAVE_TREASURY` | `27230` | Treasury Value Over Time | `observed_at`, `treasury_usd` | raw `treasury_usd` → `protocol.treasuryUsd`; **not** directly `treasuryToMarketCap` |
| `CUSTOM_QUERY_REQUIRED` | `DUNE_QUERY_AAVE_ORACLE_RAW` | — | Oracle Raw Data | see below | raw oracle facts only |
| `CUSTOM_QUERY_REQUIRED` | `DUNE_QUERY_AAVE_ADDRESS_RETENTION` | — | Address Retention | see below | raw cohort/retention facts only |
| `CUSTOM_QUERY_REQUIRED` | `DUNE_QUERY_AAVE_TOKEN_EMISSIONS` | — | Token Emissions | `observed_at`, `emissions` | no mapping until semantics are reviewed |
| `CUSTOM_QUERY_REQUIRED` | `DUNE_QUERY_AAVE_LP_CONCENTRATION` | — | LP Concentration | `observed_at`, `lp_concentration` | no mapping until semantics are reviewed |

`27230` is the only selected Treasury query. `91004` remains excluded to prevent duplicate/correlated Treasury authority. Query `5823857` remains excluded because the supplied execution failed with `FAILED_TYPE_EXECUTION_TIMEOUT` and its requested LP-concentration semantics were not established.

The first real result read must match the expected schema or the provider returns `INVALID`.

### Custom Query A — Aave V3 / Ethereum / Oracle Raw Data

Minimum output:
- `observed_at`
- `asset`
- `oracle_price`
- `oracle_address`
- `oracle_updated_at`
- `oracle_decimals`

Recommended where reliably available: `asset_address`, `source_feed_address`, `round_id`, `block_number`, `quote_currency`, `is_fallback_source`.

Do **not** return `oracleRiskWithinPolicy=true/false` from Dune. CAPITAL-AI derives that gate from raw provenance/liveness/diversity/deviation/fallback evidence inside its versioned policy layer.

Target freshness: **hourly**.

### Custom Query B — Aave / Ethereum / Address Retention

Required output:
- `observed_at`
- `cohort_start`
- `cohort_end`
- `return_window_start`
- `return_window_end`
- `cohort_addresses`
- `retained_addresses`
- `retention_rate`

Use completed historical windows only, count distinct eligible wallets consistently, and version the definition before LIVE_SCORING. Target freshness: **daily**.

## Phase 6 — TypeScript API / SDK boundary

- [x] Productive Dune access remains server-side TypeScript; the Owner performs no manual API requests.
- [x] Result evidence uses an explicit bounded `GET /v1/query/{queryId}/results?limit=...&columns=...` path.
- [x] Existing execution IDs may be checked through the diagnostic-only status path; diagnostics never become Evidence.
- [x] Dune's official `@duneanalytics/client-sdk` has been reviewed.
- [x] Do not use convenience methods that can start/refresh executions or auto-page beyond the governed row budget.
- [ ] If the SDK dependency is added later, update both `package.json` and the existing npm `package-lock.json`; do not introduce pnpm into this repository solely for Dune.

## Phase 7 — Gemini Research Shadow decision

- [x] Existing ADR-0090 Gemini Free-Tier Research Shadow remains the single Gemini research path.
- [x] Do not create a second API key in the same Google Cloud project to obtain more quota.
- [ ] If enabling the existing Gemini shadow, verify its project billing/free-tier state and set its existing attestation according to ADR-0090.

Gemini may summarize or reason over supplied evidence. It is not a market-data provider, factual evidence authority, scoring authority or execution authority.

## Phase 8 — Public dataset/page governance

- [ ] provider/source attribution;
- [ ] observed/retrieved timestamp and freshness;
- [ ] status (`VERIFIED`, `STALE`, `NOT_AVAILABLE`, `INVALID`);
- [ ] raw/transformed/heuristic methodology label;
- [ ] provider usage/licensing note;
- [ ] evidence/reference ID without secrets;
- [ ] no-demo/no-synthetic-data handling;
- [ ] Evidence Coverage described as data coverage, not score/advice;
- [ ] compatible cache/retention policy.

## Phase 9 — Audit / formal-verification evidence

- [x] Sourcify v2 source/bytecode verification lookup added.
- [ ] Independent audit reference/version/source.
- [ ] Formal-verification evidence where actually claimed.
- [ ] Exploit/incident state.
- [ ] Upgrade authority/multisig/timelock evidence.
- [ ] Oracle diversity/liveness/deviation/fallback evidence.
- [ ] Bridge/security dependencies.

A Sourcify match or GoPlus response is not an audit/formal-verification/security PASS by itself.

## Phase 10 — LIVE_DATA admission

Per provider/asset:
- [ ] identity mapping verified;
- [ ] source-use boundary permits intended display;
- [ ] rate-limit/cost/entitlement gate configured;
- [ ] freshness/DQ satisfied;
- [ ] provider failure/schema/expiry tests pass;
- [ ] no secret appears in browser URLs/logs.

## Phase 11 — Model validation before LIVE_SCORING

- [ ] required evidence coverage complete;
- [ ] model weights/version frozen;
- [ ] effective-feature/effective-weight fingerprints present;
- [ ] correlation/double-counting analysis passed, including Binance/Kraken overlap;
- [ ] walk-forward/out-of-sample validation passed;
- [ ] liquidity/slippage/cost assumptions validated;
- [ ] blocker precision/recall and manipulation/rug/exploit scenarios reviewed;
- [ ] audit/formal-verification gates complete;
- [ ] independent human review recorded.

## Phase 12 — LIVE_SCORING promotion

- [x] Owner approved **Option B — LIVE_SCORING without LIVE_EXECUTION under the documented gates** on 2026-08-22.
- [ ] Promote a category only after all applicable gates are PASS.
- [ ] Version ScoringModelRegistry/feature contract/executor and record fingerprints.
- [ ] Failed categories remain `NOT_COMPUTABLE`/`BLOCKED`.

## Phase 13 — LIVE_EXECUTION / FT-7+

Not authorized. Separate decision/project required for exchange/broker/custody adapters, real-money orders, IAM/step-up authorization, pre-trade controls, reconciliation and incident/kill-switch runbooks.
