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
- [x] Dune may operate only through governed saved-query result reads under explicit `FREE_TIER` or bounded `TRIAL_14D` entitlement mode.

## Phase 1 — Dune account/key setup

- [x] Owner provisioned `DUNE_API_KEY` with read permissions in Render `finance-secrets.env` on 2026-08-22.
- [ ] Confirm Dune extra-credit/overage spending is disabled or capped in the account/team settings.
- [ ] Determine the entitlement mode currently applicable to the account:
  - permanent `FREE_TIER`, or
  - Owner-reported temporary `TRIAL_14D` fuller/full-data-source entitlement.

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
- [ ] The configured window must be >0 and <=14 days.
- [ ] Runtime will block reads before the start and automatically at/after the end timestamp.
- [ ] Trial expiry must **not** auto-convert to paid access. Return to `FREE_TIER` requires explicit Free-Tier attestation.

Dataset entitlement may be broader during the trial; runtime authority is not. Query allowlists, schema/row limits and no-execute remain identical in both modes.

## Phase 3 — Production secret/configuration state

Repository preparation:

- [x] `NEWS_API_KEY` removed from the canonical secret manifest.
- [x] `DUNE_API_KEY` added to `scripts/security/secretFileManifest.ts`.
- [x] Dune access mode, trial timestamps/attestations, query allowlist and row cap are non-secret governance configuration.
- [x] GoPlus key remains optional; canonical Free baseline is keyless.
- [x] No new secret is required for Binance Public or Kraken Public.
- [x] Owner-reviewed Dune query IDs `27230` and `5833540` are present in the repository allowlist configuration; entitlement remains fail-closed until separately attested.

Manual production cleanup after the GDELT supersession is deployed and verified:

- [ ] Remove obsolete `NEWS_API_KEY` value from the production secret file if still present.
- [ ] Do not add CoinGlass/LunarCrush/Messari keys for SC4.

## Phase 4 — Provider identity governance

No symbol-to-contract/market guessing is allowed. For every supported asset, review only applicable fields:

- canonical CAPITAL-AI symbol;
- EVM chain ID + exact contract or Solana exact mint;
- DEX Screener chain/token identity;
- exact **Binance futures symbol** where applicable;
- exact **Kraken Futures public market symbol** where applicable;
- Dune saved query IDs + expected columns + feature mappings;
- authoritative identity sources, reviewer and verification timestamp.

Binance and Kraken are both primary suppliers but MUST remain separately attributable. Similar observations are not automatically summed, averaged or treated as independent confirmations without a separately versioned anti-correlation/consensus transform.

## Phase 5 — Dune query governance

General rules:

- [x] Create/select saved queries only for evidence not standardized by DeFiLlama/GoPlus/Binance/Kraken/DEX Screener/Sourcify.
- [x] Record query owner, purpose, datasets/tables, exact columns, units and freshness.
- [ ] Review look-ahead leakage and correlated/double-counted features for every query before LIVE_DATA.
- [x] Add approved IDs to `DUNE_ALLOWED_QUERY_IDS`.
- [x] Mirror approved IDs/schemas in `CryptoEvidenceIdentityRegistry`.
- [x] Keep `DUNE_MAX_RESULT_ROWS=25`; implementation hard cap is 100.
- [ ] Verify schema-drift, ungoverned-query and entitlement-expiry negative tests against the real Dune result surface.
- [x] Never enable arbitrary SQL, execute-query, pipelines or credit-limit bypass.

### Aave / Ethereum — governed query inventory

| State | Query | Purpose | Expected columns | Mapping / authority |
|---|---:|---|---|---|
| `OWNER_ATTESTED_PENDING_RUNTIME_SCHEMA_CHECK` | `5833540` | Active Addresses | `observed_at`, `active_addresses` | `active_addresses` → `protocol.activeAddresses24h` |
| `OWNER_ATTESTED_PENDING_RUNTIME_SCHEMA_CHECK` | `27230` | Treasury Value Over Time | `observed_at`, `treasury_usd` | raw `treasury_usd` → `protocol.treasuryUsd`; **not** directly `treasuryToMarketCap` |
| `CUSTOM_QUERY_REQUIRED` | — | Oracle Raw Data | see below | raw oracle facts only; never direct policy PASS |
| `CUSTOM_QUERY_REQUIRED` | — | Address Retention | see below | raw cohort/retention evidence only |

`27230` is the single selected Treasury query for this contract. Previously considered `91004` is not allowlisted to avoid duplicate/correlated Treasury evidence unless a future review proves it represents a distinct non-overlapping fact.

The public web surface did not reliably expose the result schema of `27230`/`5833540` during the 2026-08-22 review. Owner-provided metadata therefore authorizes pre-registration only; the first real API read must still match the exact expected columns or the provider returns `INVALID`.

### Custom Query A — Aave V3 / Ethereum / Oracle Raw Data

Minimum output required for useful raw evidence:

- `observed_at` — timestamp of the observation row;
- `asset` — canonical token symbol or, preferably, deterministic asset identity paired with contract address;
- `oracle_price` — raw/current oracle value;
- `oracle_address` — Aave oracle/source address used for the asset;
- `oracle_updated_at` — timestamp of the latest underlying price update / round update;
- `oracle_decimals` — scaling needed to interpret `oracle_price` correctly.

Recommended additional output if Dune tables expose it reliably:

- `asset_address`;
- `source_feed_address`;
- `round_id`;
- `block_number`;
- `quote_currency` / base-currency convention;
- `is_fallback_source` where determinable from governed Aave configuration.

Do **not** return `oracleRiskWithinPolicy=true/false` from Dune. CAPITAL-AI must derive that hard gate from raw provenance/liveness/diversity/deviation/fallback evidence inside its own versioned policy layer.

Target freshness: **hourly**. Rows with absent price scaling or absent update timestamp are not sufficient for oracle-liveness scoring.

### Custom Query B — Aave / Ethereum / Address Retention

A bare `observed_at, retention_rate` row is insufficient because it does not define the cohort or return window. Required output:

- `observed_at` — time after the return window is complete;
- `cohort_start`;
- `cohort_end`;
- `return_window_start`;
- `return_window_end`;
- `cohort_addresses` — distinct eligible protocol addresses in the cohort;
- `retained_addresses` — cohort addresses seen again in the defined return window;
- `retention_rate` — `retained_addresses / cohort_addresses`, expressed consistently as ratio or percent.

Governance requirements:

- define exactly which Aave V3 Ethereum interactions count as an **active address**;
- exclude protocol/system/contract addresses where appropriate and document the rule;
- use completed historical windows only — no future-looking cohort calculation;
- document whether repeated transactions by one address count once (recommended: distinct wallet once per window);
- choose one stable retention definition and version it before LIVE_SCORING.

Recommended initial convention: a completed, trailing cohort design with explicit cohort and return-window timestamps. This avoids look-ahead leakage and makes historical backtests reproducible.

Target freshness: **daily**.

## Phase 6 — Gemini Research Shadow decision

- [x] Existing ADR-0090 Gemini Free-Tier Research Shadow remains the single Gemini research path.
- [x] Do not create a second API key in the same Google Cloud project to obtain more quota: Gemini rate limits are project-scoped, not API-key-scoped.
- [ ] If the existing Gemini shadow is to be enabled, independently verify its Google project has the required Free-Tier/billing state and set its existing attestation according to ADR-0090.
- [ ] A separate Google project requires a separate governance/privacy/quota decision.

Gemini may summarize or reason over supplied evidence in the governed research lane. It is not a market-data provider, factual evidence authority, scoring authority or execution authority.

## Phase 7 — Public dataset/page governance

For Landing Page, AI Newsfeed Viewer and Crypto Evidence panels:

- [ ] provider/source attribution;
- [ ] observed/retrieved timestamp and freshness;
- [ ] status (`VERIFIED`, `STALE`, `NOT_AVAILABLE`, `INVALID`);
- [ ] raw/transformed/heuristic methodology label;
- [ ] provider usage/licensing note;
- [ ] evidence/reference ID without secrets;
- [ ] no-demo/no-synthetic-data handling;
- [ ] Evidence Coverage described as data coverage, not score/advice;
- [ ] compatible cache/retention policy.

## Phase 8 — Audit / formal-verification evidence

- [x] Sourcify v2 source/bytecode verification lookup added.
- [ ] Independent audit reference/version/source.
- [ ] Formal-verification evidence where actually claimed.
- [ ] Exploit/incident state.
- [ ] Upgrade authority/multisig/timelock evidence.
- [ ] Oracle diversity/liveness/deviation/fallback evidence.
- [ ] Bridge/security dependencies.

A Sourcify match or GoPlus response is not an audit/formal-verification/security PASS by itself.

## Phase 9 — LIVE_DATA admission

Per provider/asset:

- [ ] identity mapping verified;
- [ ] source-use boundary permits intended display;
- [ ] rate-limit/cost/entitlement gate configured;
- [ ] freshness/DQ satisfied;
- [ ] provider failure/schema/expiry tests pass;
- [ ] no secret appears in browser URLs/logs.

## Phase 10 — Model validation before LIVE_SCORING

- [ ] required evidence coverage complete;
- [ ] model weights/version frozen;
- [ ] effective-feature/effective-weight fingerprints present;
- [ ] correlation/double-counting analysis passed, including Binance/Kraken overlap;
- [ ] walk-forward/out-of-sample validation passed;
- [ ] liquidity/slippage/cost assumptions validated;
- [ ] blocker precision/recall and manipulation/rug/exploit scenarios reviewed;
- [ ] audit/formal-verification gates complete;
- [ ] independent human review recorded.

## Phase 11 — LIVE_SCORING promotion

- [x] Owner approved **Option B — LIVE_SCORING without LIVE_EXECUTION under the documented gates** on 2026-08-22.
- [ ] Promote a category only after all applicable gates are PASS.
- [ ] Version ScoringModelRegistry/feature contract/executor and record fingerprints.
- [ ] Failed categories remain `NOT_COMPUTABLE`/`BLOCKED`.

## Phase 12 — LIVE_EXECUTION / FT-7+

Not authorized. Separate decision/project required for exchange/broker/custody adapters, real-money orders, IAM/step-up authorization, pre-trade controls, reconciliation and incident/kill-switch runbooks.
