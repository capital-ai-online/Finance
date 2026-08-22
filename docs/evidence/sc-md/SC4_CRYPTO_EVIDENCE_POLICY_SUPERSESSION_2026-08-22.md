# SC4 — Crypto Evidence / News Policy Supersession

Status: active on implementation branch; Option B approved, runtime promotion remains gate-driven
Date: 2026-08-22
Claim: `CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22`

## Purpose

This record supersedes inconsistent, paid-by-default or unsafe evidence behavior without creating a second scoring, evidence, risk, compliance or execution authority. Existing canonical authorities remain in force.

## Owner decisions — 2026-08-22

1. **Option B — LIVE_SCORING without LIVE_EXECUTION under the documented gates** is approved.
2. **Binance Public and Kraken Public are co-primary crypto market/derivatives evidence suppliers.** They remain independently attributable to avoid correlated double counting.
3. `DUNE_API_KEY` is provisioned by the Owner in `finance-secrets.env` with read rights. Key presence alone does not enable Dune reads.
4. The Owner reports a **14-day Dune entitlement to the fuller dataset surface**. This exact trial term was not independently found in the public Dune documentation during the 2026-08-22 review, so it is treated as Owner-attested account entitlement and must be bounded by explicit timestamps.
5. Dune is consumed server-side through the existing TypeScript evidence provider. The Owner does not need to perform manual API calls.

Option B does not waive failed/missing gates and does not authorize real orders, custody or exchange execution.

## Superseded behavior → canonical replacement

| Superseded behavior | Replacement |
|---|---|
| NewsAPI.org as Landing Page / AI Newsfeed production source | GDELT DOC 2.0 keyless article discovery/provenance; NewsAPI provider/key/policy removed |
| Static/synthetic financial headlines | `/api/news` → `GdeltNewsEvidenceProvider` → `VerifiedNewsFeed`; no synthetic fallback |
| News sentiment changing a score | Headline sentiment stays labelled deterministic `heuristic` presentation metadata; no score/ranking authority |
| CoinGlass derivatives evidence | Binance Public + Kraken Public co-primary market/derivatives evidence; DEX Screener supplements DEX activity |
| LunarCrush social evidence | No paid social provider. Missing social evidence remains explicit and may block Meme promotion |
| Messari default protocol evidence | DeFiLlama free canonical fields + governed Dune evidence; no paid/x402 default |
| One HTTP/rate-limit implementation per vendor | Shared `ResearchEvidenceProviderHttp` + ProviderMatrix/RateLimitBudget/CircuitBreaker/Supervisor health |
| Provider response interpreted as PASS | Raw evidence only; policy/gates remain separate and fail closed |
| Missing/stale/invalid mapped to 0/50/PASS | Explicit `NOT_AVAILABLE` / `STALE` / `INVALID` with null/provenance rules |
| Arbitrary Dune SQL/query execution | Governed saved-query latest-result GET only, bounded schema/rows |
| Duplicate hard-coded Dune query allowlists | `DuneSavedQueryRegistry` semantic contracts + `DUNE_QUERY_*` environment values as the single numeric query-ID authority |
| A temporary provider entitlement becoming permanent architecture | Explicit `FREE_TIER` or timestamp-bounded `TRIAL_14D`; automatic policy block at trial expiry |
| Paid auto-upgrade/overage/x402 | Prohibited unless separately Owner-approved |
| Browser-supplied provider identities/query IDs | Server-side governed identity/query registries only |
| `LIVE` used ambiguously | `LIVE_DATA`, `LIVE_SCORING`, `LIVE_EXECUTION` remain separate states |

## Primary crypto market suppliers

### Binance Public
- Keyless public Spot/Futures market evidence.
- Primary generic raw projection for currently mapped open-interest USD, funding and 1%-orderbook-depth features.
- Exact futures symbols are governed by `CryptoEvidenceIdentityRegistry`; runtime must not guess contracts from a CAPITAL-AI symbol.
- No account/private/order endpoint and no execution authority.

### Kraken Public / Futures
- Keyless primary independent observation set for governed Kraken markets.
- Open interest, funding, liquidation, liquidity and slippage remain provider-attributable Kraken observations.
- Kraken and Binance evidence MUST NOT be summed/averaged automatically simply because they describe similar market structure. Any future consensus transform requires a separately versioned correlation policy.
- No private Kraken endpoint, API trading key, order or execution method is permitted.

## Specialist provider policy

### GoPlus Free
- EVM and Solana Token Security are security evidence only.
- Canonical use remains the free/public baseline; authenticated paid/x402 paths are outside this architecture.
- Contract/mint identity MUST come from the governed registry.

### Sourcify API v2
- Open-source EVM source/bytecode verification lookup only.
- Match status is not formal verification, external audit completion or security PASS.

### DEX Screener
- Keyless DEX pool/activity evidence for governed chain/token identities.
- Does not replace contract-security or canonical price-consensus authority.

### Dune — TypeScript evidence provider and two governed access modes

The productive Dune integration is the existing server-side TypeScript `DuneQueryEvidenceProvider`. Query contracts live in `DuneSavedQueryRegistry`; deployment supplies only the reviewed numeric IDs through semantic `DUNE_QUERY_*` environment keys. The provider derives its numeric allowlist from these values. `CryptoEvidenceIdentityRegistry` remains responsible for asset/provider identities and no longer duplicates Dune query IDs.

#### `FREE_TIER`
- Requires `DUNE_FREE_TIER_ATTESTED=true`.
- Uses the Owner-provisioned `DUNE_API_KEY` from `finance-secrets.env`.

#### `TRIAL_14D`
- Represents the Owner-reported temporary full/fuller-dataset entitlement.
- Requires `DUNE_TRIAL_ATTESTED=true`, `DUNE_TRIAL_STARTED_AT` and `DUNE_TRIAL_ENDS_AT`.
- Runtime rejects a window longer than 14 days, blocks before start and blocks automatically at/after the end timestamp.
- Trial expiry MUST NOT auto-convert to paid access. Return to `FREE_TIER` requires explicit Free-Tier attestation.

#### Boundaries valid in both Dune modes
- Only saved query IDs resolved from the semantic `DUNE_QUERY_*` registry configuration.
- Only bounded latest-result reads with explicit `limit` and `columns`; no arbitrary SQL, execute-query, pipelines or model/user-created query IDs.
- Requested columns and rows are bounded and validated before `VERIFIED` evidence.
- Dataset entitlement may broaden during the trial; **runtime mutation/query authority does not**.
- No credit/overage bypass or automatic purchase is permitted.
- Existing execution IDs may be inspected through the diagnostic-only status path. Diagnostic responses cannot become scoring evidence.

#### Official TypeScript SDK boundary

`@duneanalytics/client-sdk` is recognized as Dune's official TypeScript client. Its convenience methods are not automatically safe for the CAPITAL-AI no-execute contract: methods such as query execution/refresh paths can start executions, and result helpers may paginate beyond the local result-row budget. Therefore the current evidence provider keeps its explicit bounded read-only result request. If the SDK is introduced as a dependency, it may only sit behind a restricted adapter that exposes reviewed read-only operations; methods capable of execution, raw SQL, cancellation or unbounded pagination remain unavailable to the evidence layer.

### GDELT DOC 2.0
- Keyless article discovery/provenance.
- Projects metadata/source links only; no article-body republication and no direct scoring authority.

### DeFiLlama
- Existing keyless TVL/fees/revenue authority remains canonical under ADR-0100.
- Premium endpoints remain disabled unless separately superseded.

## Gemini boundary

CAPITAL-AI already has the ADR-0090 governed Gemini Research Shadow. Current Gemini API rate limits are project-scoped rather than API-key-scoped; therefore a second API key in the **same Google Cloud project** does not provide additional Free-Tier capacity. A second key may be useful for credential rotation or workload separation, but not quota multiplication.

SC4 decision:
- do **not** add a second Gemini key merely for capacity;
- reuse the existing Free-Tier-only Gemini Research Shadow when its existing billing/free-tier attestation gates pass;
- Gemini may synthesize/explain supplied research evidence but may not become a market-data source, evidence fact authority, scoring authority or execution authority;
- a separate Google project would require a new privacy/governance/quota decision rather than silent key proliferation.

## Excluded providers

Not active in SC4: NewsAPI.org, CoinGlass, LunarCrush, Messari. A stray environment variable must never reactivate them.

## LIVE promotion

### LIVE_DATA
Requires identity, source-use rights, freshness/DQ and public provenance. Free/keyless does not waive these gates.

### LIVE_SCORING — Owner-approved Option B
Only after complete required evidence coverage, negative tests, backtest/OOS, anti-correlation review, effective-feature/effective-weight fingerprints and audit/formal-verification evidence for that category/model.

### LIVE_EXECUTION
Remains FT-7+ and blocked.

## Non-authority statement

This supersession changes provider/evidence policy and projections only. It does not create an alternative dispatcher, scoring registry, canonical result, risk/compliance, persistence, queue or execution authority.
