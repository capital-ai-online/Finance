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

- [ ] Create/select saved queries only for evidence not standardized by DeFiLlama/GoPlus/Binance/Kraken/DEX Screener/Sourcify.
- [ ] Record query owner, purpose, datasets/tables, exact columns, units and freshness.
- [ ] Review look-ahead leakage and correlated/double-counted features.
- [ ] Add approved IDs to `DUNE_ALLOWED_QUERY_IDS`.
- [ ] Mirror the same IDs/schemas in `CryptoEvidenceIdentityRegistry`.
- [ ] Keep `DUNE_MAX_RESULT_ROWS=25` unless reviewed; implementation hard cap is 100.
- [ ] Verify schema-drift, ungoverned-query and entitlement-expiry negative tests.
- [ ] Never enable arbitrary SQL, execute-query, pipelines or credit-limit bypass.

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
