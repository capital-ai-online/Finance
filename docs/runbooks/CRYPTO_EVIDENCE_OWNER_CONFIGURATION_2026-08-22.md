# CAPITAL-AI — Crypto Evidence Owner Configuration Runbook

Status: Owner/manual checklist — free-provider supersession
Date: 2026-08-22
Related: `SC4_CRYPTO_EVIDENCE_POLICY_SUPERSESSION_2026-08-22.md`

This runbook separates account/security/dataset mutations from repository preparation. Never add real secrets to GitHub files, chat, screenshots or browser-visible `VITE_*` variables.

## Phase 0 — Provider decision — COMPLETE

- [x] NewsAPI.org excluded. Developer plan is not valid for staging/production, regardless of small/self-owned user count.
- [x] CoinGlass excluded.
- [x] LunarCrush excluded.
- [x] Messari excluded from active default evidence architecture.
- [x] GoPlus: keyless documented Free Security API baseline selected; no x402/Agent payment.
- [x] GDELT DOC 2.0 selected for keyless news metadata/provenance.
- [x] Kraken Futures Public Charts selected for keyless derivatives/market analytics where a governed market exists.
- [x] DEX Screener Public API selected for keyless DEX pool/liquidity/activity evidence where a governed token identity exists.
- [x] Sourcify API v2 selected for open-source EVM source/bytecode verification evidence.
- [x] DeFiLlama public API remains canonical keyless DeFi TVL/fees/revenue source under ADR-0100.
- [x] Dune may be used only on the Free plan, latest saved-query result reads only, under credit/allowlist limits.

## Phase 1 — API-key/manual account setup

Only Dune requires a new secret for the active SC4 stack.

- [ ] Create/verify a Dune Free account and generate `DUNE_API_KEY`.
  - Sign up: `https://dune.com/auth/register`
  - API settings: `https://dune.com/settings/api`
  - Credit docs: `https://docs.dune.com/resources/credits-billing/how-credits-work`
- [ ] In Dune account/team billing settings, disable or cap extra-credit spending so Free-Tier use cannot silently charge.
- [ ] After confirming the account remains Free, set `DUNE_FREE_TIER_ATTESTED=true` in server-side production configuration.

No new key is required for GoPlus Free, GDELT, Kraken Public, DEX Screener, Sourcify or DeFiLlama public endpoints.

## Phase 2 — Production secret configuration

Repository preparation:

- [x] `NEWS_API_KEY` removed from the canonical secret manifest.
- [x] `DUNE_API_KEY` added to `scripts/security/secretFileManifest.ts`.
- [x] `DUNE_ALLOWED_QUERY_IDS`, `DUNE_FREE_TIER_ONLY`, `DUNE_FREE_TIER_ATTESTED` and `DUNE_MAX_RESULT_ROWS` remain non-secret governance configuration.
- [x] GoPlus key remains optional and is not required for the canonical Free baseline.

Manual after merge/deployment preparation:

- [ ] Add the real `DUNE_API_KEY` through the existing Render `finance-secrets.env` process.
- [ ] Remove any obsolete `NEWS_API_KEY` value from the production secret file after the GDELT supersession is deployed and verified.
- [ ] Do not add CoinGlass/LunarCrush/Messari keys for SC4.

## Phase 3 — Dataset / provider identity governance — OWNER DATA TASK

No symbol-to-contract/market guessing is allowed. For each supported asset create a reviewed `CryptoEvidenceIdentityRegistry` record containing only applicable fields:

- canonical symbol;
- EVM chain ID + exact contract address **or** Solana exact mint;
- DEX Screener chain slug + exact token address;
- Kraken Futures public market symbol where listed;
- Dune saved query IDs + expected columns + feature mappings where needed;
- authoritative source references used to verify every identity;
- reviewer + verification timestamp + status.

Manual review groups:

- [ ] Meme assets — EVM/Solana split, especially DOGE-derived ERC tokens vs native/SPL assets.
- [ ] DeFi protocol/token identity pairs — protocol and token must not be conflated.
- [ ] Stablecoins.
- [ ] Layer 1 / Layer 2.
- [ ] DEX/AMM, lending, bridges and oracles.
- [ ] LST/restaking.
- [ ] RWA, AI/DePIN, GameFi and exchange tokens.

## Phase 4 — Dune Free-Tier saved-query governance

- [ ] Create/select saved queries only for evidence not standardized by DeFiLlama/GoPlus/Kraken/DEX Screener/Sourcify.
- [ ] Prefer narrow, low-compute public/owned queries compatible with Dune Small/Medium Free engines.
- [ ] Record query owner, purpose, tables, exact expected columns, units and freshness window.
- [ ] Review look-ahead leakage, correlated/double-counted features and protocol identity.
- [ ] Add approved IDs to `DUNE_ALLOWED_QUERY_IDS`.
- [ ] Mirror the same IDs/schemas in `CryptoEvidenceIdentityRegistry`; both gates must agree.
- [ ] Keep `DUNE_MAX_RESULT_ROWS` at 25 unless a reviewed use case justifies another value (hard implementation cap 100).
- [ ] Verify schema-drift and policy-block negative tests before LIVE_DATA.
- [ ] Never enable query execution, pipeline execution, raw SQL or `ignore_max_credits_per_request`.

## Phase 5 — Public dataset/page governance

For Landing Page, AI Newsfeed Viewer and every Crypto Evidence panel, verify:

- [ ] provider/source attribution;
- [ ] observed/retrieved timestamp and freshness;
- [ ] evidence status (`VERIFIED`, `STALE`, `NOT_AVAILABLE`, `INVALID`);
- [ ] methodology: raw vs transformed vs heuristic;
- [ ] provider usage/licensing note;
- [ ] evidence/reference ID without secrets;
- [ ] no-demo/no-synthetic-data handling;
- [ ] Evidence Coverage is explicitly data coverage, not an investment/trading score;
- [ ] retention/cache policy is compatible with provider terms;
- [ ] GDELT projection links to publisher source and does not reproduce article bodies.

## Phase 6 — Audit / formal-verification evidence — OWNER + GOVERNANCE TASK

- [x] Sourcify v2 source/bytecode verification lookup added as open-source evidence.
- [ ] Independent audit presence and exact audit report/version/source.
- [ ] Formal-verification evidence where a project actually claims it.
- [ ] Exploit/incident history and unresolved-exploit state.
- [ ] Upgrade authority, multisig and timelock evidence.
- [ ] Oracle source diversity, liveness, deviation protection and fallback design.
- [ ] Bridge/security dependency evidence where applicable.
- [ ] Provenance/freshness/reviewer for each hard-gate input.

A Sourcify match or GoPlus response is **not** an audit/formal-verification/security PASS by itself.

## Phase 7 — LIVE_DATA admission

Per provider/asset:

- [ ] applicable identity mapping verified;
- [ ] provider usage boundary permits the intended public display;
- [ ] rate-limit/cost gate configured;
- [ ] freshness/DQ satisfied;
- [ ] page governance complete;
- [ ] provider-failure/schema-drift tests pass;
- [ ] no secret appears in browser URLs/logs.

Keyless providers may become `LIVE_DATA` only after these gates; keyless does not mean ungoverned.

## Phase 8 — Model validation before LIVE_SCORING

- [ ] required evidence coverage complete;
- [ ] model weights/version frozen;
- [ ] effective-feature/effective-weight fingerprints present;
- [ ] correlation/double-counting analysis passed;
- [ ] walk-forward/out-of-sample validation passed;
- [ ] liquidity/slippage/cost assumptions validated;
- [ ] blocker precision/recall and false-positive/false-negative review passed;
- [ ] manipulation/rug/exploit stress scenarios reviewed;
- [ ] audit/formal-verification gates complete;
- [ ] independent human review recorded.

## Phase 9 — LIVE_SCORING promotion — OWNER APPROVAL COMPLETE, TECHNICAL GATES OPEN

- [x] Owner approved **Option B — LIVE_SCORING without LIVE_EXECUTION under the documented gates** on 2026-08-22.
- [ ] Promote a category only when every Phase 3-8 gate applicable to that category is PASS.
- [ ] Version ScoringModelRegistry/feature contract/executor and record fingerprint at promotion.
- [ ] Keep any failed category `NOT_COMPUTABLE`/`BLOCKED`; there is no global force-live switch.

Current state: Meme/DeFi challengers remain non-score-eligible because required evidence/social/audit/backtest gates are still incomplete. The Owner approval is recorded and no second approval is required for the same Option-B scope once the documented gates themselves are satisfied.

## Phase 10 — LIVE_EXECUTION / FT-7+

Not authorized. Separate project/decision required for exchange/broker/custody adapters, real-money order transport, IAM/step-up authorization, pre-trade controls, reconciliation, incident/kill-switch runbooks and explicit Owner approval.
