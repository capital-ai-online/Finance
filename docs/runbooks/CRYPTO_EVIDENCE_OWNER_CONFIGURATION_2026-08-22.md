# CAPITAL-AI — Crypto Evidence Owner Configuration Runbook

Status: Owner/manual checklist
Date: 2026-08-22
Related: `SC4_CRYPTO_EVIDENCE_POLICY_SUPERSESSION_2026-08-22.md`

This runbook deliberately separates account/billing/security mutations from repository preparation. Complete the phases in order. Do not add secrets to GitHub files or browser-visible `VITE_*` variables.

## Phase 0 — Cost and licensing decisions

- [ ] **NewsAPI:** choose a production-compatible plan before public Landing Page / AI Newsfeed Viewer traffic. Developer/free tier is development-only. Confirm whether overage auto-billing is disabled or capped.
  - Register / key: `https://newsapi.org/register`
  - Pricing: `https://newsapi.org/pricing`
- [ ] **CoinGlass:** choose a commercial-use API plan for public CAPITAL-AI use. Do not treat Hobby/Startup personal plans as commercial production entitlement.
  - API key/account: `https://www.coinglass.com/user/ApiKey`
  - Pricing: `https://www.coinglass.com/pricing`
- [ ] **LunarCrush:** choose a paid plan that explicitly includes the required social/creator endpoints and commercial use.
  - API keys: `https://lunarcrush.com/developers/api/authentication`
  - Pricing: `https://lunarcrush.com/pricing`
- [ ] **Messari:** verify the exact protocol/on-chain endpoint entitlement for the selected subscription. Keep x402/pay-per-request disabled.
  - API access/key: `https://messari.io/account/api`
  - API docs: `https://docs.messari.io/`
- [ ] **Dune:** decide the monthly credit/spending budget and create an API key. Configure account/team spending limits before public traffic.
  - Sign up: `https://dune.com/auth/register`
  - API settings: `https://dune.com/settings/api`
  - API docs: `https://docs.dune.com/api-reference/overview/introduction`
- [ ] **GoPlus:** default to the documented free Security API within vendor rate limits. Create an authenticated token/package only if higher quota is needed. Do not enable Agent/x402 payment.
  - Security API docs: `https://docs.gopluslabs.io/reference/api-overview`
  - Access-token docs: `https://docs.gopluslabs.io/reference/generatetoken`
  - Solana token security: `https://docs.gopluslabs.io/reference/solanatokensecurityusingget`
- [ ] **DeFiLlama:** keep the accepted keyless public TVL/fees/revenue path unless a separate cost decision approves the paid API.
  - API docs: `https://defillama.com/docs/api`
  - Subscription: `https://defillama.com/subscription`

## Phase 1 — Provider account/API-key creation

Generate keys only after Phase 0 is approved.

- [ ] `NEWS_API_KEY`
- [ ] `COINGLASS_API_KEY`
- [ ] `LUNARCRUSH_API_KEY`
- [ ] `MESSARI_API_KEY`
- [ ] `DUNE_API_KEY`
- [ ] optional `GOPLUS_API_KEY` only for an approved authenticated/higher-quota mode

Never paste keys into chat, issues, pull requests, source files or screenshots.

## Phase 2 — Production secret-manifest approval

Current `finance-secrets.env` authority already includes `NEWS_API_KEY`. The new provider secrets are not yet part of the canonical secret manifest.

Owner/security approval required before repository mutation:

- [ ] Approve addition of `COINGLASS_API_KEY` to `scripts/security/secretFileManifest.ts`.
- [ ] Approve addition of `LUNARCRUSH_API_KEY`.
- [ ] Approve addition of `MESSARI_API_KEY`.
- [ ] Approve addition of `DUNE_API_KEY`.
- [ ] Decide whether optional `GOPLUS_API_KEY` should be included; no key is needed for the free baseline.
- [ ] Keep `DUNE_ALLOWED_QUERY_IDS` outside the secret list as non-secret governance configuration.
- [ ] After the code change is reviewed/merged, add approved secret values through the existing Render `finance-secrets.env` process.

## Phase 3 — Dataset / provider identity governance

No symbol-to-contract guessing is allowed.

For every supported asset, create a reviewed identity record containing:

- canonical asset ID / symbol;
- chain/network;
- EVM chain ID + exact contract address where applicable;
- Solana exact mint address where applicable;
- DeFiLlama exact protocol slug where applicable;
- Messari exact protocol identifier where applicable;
- Dune saved query IDs + expected output schema where applicable;
- source/reference used to verify each identity;
- reviewer, verification timestamp and version.

Mandatory manual/review groups:

- [ ] Meme assets — especially EVM vs Solana split (e.g. Solana SPL/SPL-2022 requires the dedicated GoPlus Solana adapter).
- [ ] DeFi protocol/token identity pairs — protocol and token must not be conflated.
- [ ] Stablecoins.
- [ ] Layer 1 / Layer 2.
- [ ] DEX/AMM, lending, bridges, oracles.
- [ ] LST/restaking.
- [ ] RWA, AI/DePIN, GameFi, exchange tokens and other registered crypto categories.

## Phase 4 — Dune saved-query governance

- [ ] Create/identify saved queries only for features not standardized by canonical providers.
- [ ] Record query owner, purpose, dataset tables, expected columns, units and freshness window.
- [ ] Review query for look-ahead leakage and duplicate/correlated data.
- [ ] Add only approved IDs to `DUNE_ALLOWED_QUERY_IDS`.
- [ ] Configure credit/spending cap in Dune account/team settings.
- [ ] Verify schema-drift negative test before LIVE_DATA.

## Phase 5 — Public dataset/page governance

For Landing Page, AI Newsfeed Viewer and each Crypto Evidence tool, record and display as applicable:

- [ ] provider/source attribution;
- [ ] observed/retrieved timestamp and freshness state;
- [ ] evidence status (`VERIFIED`, `STALE`, `NOT_AVAILABLE`, `INVALID`);
- [ ] methodology / whether the value is raw, transformed or heuristic;
- [ ] license/plan entitlement and redistribution/display restrictions;
- [ ] evidence/reference ID without exposing secrets;
- [ ] no-demo/no-synthetic-data handling;
- [ ] explicit note that Evidence Coverage is data coverage, not investment advice or a score;
- [ ] retention/cache policy consistent with provider terms.

## Phase 6 — Audit / formal-verification evidence

Do not infer these states from a general security API.

- [ ] Verified source/deployment evidence.
- [ ] Independent audit presence and exact audit reference/version.
- [ ] Formal-verification evidence where claimed.
- [ ] Exploit/incident history and unresolved-exploit status.
- [ ] Upgrade authority / multisig / timelock evidence.
- [ ] Oracle source diversity, liveness, deviation protection and fallback design.
- [ ] Bridge/security dependency evidence where applicable.
- [ ] Record provenance, freshness, reviewer and policy decision for each hard-gate input.

GoPlus may contribute raw contract/security facts, but it is not by itself an audit/formal-verification PASS authority.

## Phase 7 — LIVE_DATA admission

Per category/provider:

- [ ] key/endpoint configured (or approved keyless path);
- [ ] plan/license permits public production use;
- [ ] rate limit and cost cap configured;
- [ ] identity mapping verified;
- [ ] freshness/DQ policy satisfied;
- [ ] page governance complete;
- [ ] negative/provider-failure tests pass;
- [ ] no secret is exposed in browser/network URL/logs.

Only then enable/display that provider as production `LIVE_DATA`.

## Phase 8 — Model validation before LIVE_SCORING

- [ ] required evidence coverage complete;
- [ ] model weights/version frozen;
- [ ] effective-feature and effective-weight fingerprints present;
- [ ] correlation/double-counting analysis passed;
- [ ] walk-forward/out-of-sample validation passed;
- [ ] liquidity/slippage/cost assumptions validated;
- [ ] blocker precision/recall and false-positive/false-negative review passed;
- [ ] manipulation/rug/exploit stress scenarios reviewed;
- [ ] audit/formal-verification gates complete;
- [ ] independent human review recorded.

## Phase 9 — Owner LIVE_SCORING promotion

Security-relevant mutation. Requires explicit Owner approval after reviewing `SC4_LIVE_PROMOTION_OWNER_GATE_2026-08-22.md`.

Recommended approval scope:

`Option B — LIVE_SCORING without LIVE_EXECUTION, only for categories that pass every documented promotion gate.`

A category failing any gate remains research/challenger / `NOT_COMPUTABLE` or `BLOCKED`; there is no global force-live switch.

## Phase 10 — LIVE_EXECUTION / FT-7+

Not part of SC4. Separate decision and project required for:

- exchange/broker/custody adapters;
- real-money order transport;
- IAM/step-up authorization;
- position/pre-trade controls;
- durable reconciliation/settlement;
- incident and kill-switch runbooks;
- explicit Owner approval.
