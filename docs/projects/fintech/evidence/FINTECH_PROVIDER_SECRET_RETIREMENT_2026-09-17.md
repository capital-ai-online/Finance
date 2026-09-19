# FINTECH provider credential evaluation — 2026-09-17

**Project:** CAPITAL-AI-FINTECH  
**PR:** #1046  
**Baseline:** `main@2358642ff80f128e271e02ae88401008663578b7`  
**Scope:** provider/API-key functionality, usage and value evaluation; no secret values are recorded here.

## Scope correction

Only the already retired startup/readiness provider paths for **Alpaca** and **CoinGecko** are credential-retirement candidates. All other provider credentials remain **evaluation-only** in this work package. They MUST NOT be deleted automatically from Render or `finance-secrets.env` as part of PR #1046. The Human/Owner decides any later deletion or rotation from the evidence result.

No secret value may be copied into repository evidence.

## Current repository-use correlation

The current-main repository does not support treating the remaining provider keys as unused. Static consumer correlation finds active or intentional capability paths for the following credentials:

| Credential | Current consumer / role | Repository evaluation | Live-key status |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `server/anthropicClient.ts`, AI provider routing | current optional AI-provider capability | `NOT_ACCESSIBLE` |
| `OPENAI_API_KEY` | `server/openaiClient.ts`, `server/ai.ts`, `scripts/automation/buildRagIndex.ts` | current AI + RAG consumer | `NOT_ACCESSIBLE` |
| `GEMINI_API_KEY` | server-only `GeminiResearchTransport`; default-off shadow/evidence path | `REACTIVATE_CANDIDATE`, not delete candidate | `NOT_PROVEN` |
| `ALPHA_VANTAGE_API_KEY` | `server/marketData/alphaVantageCredential.ts`, market-data registry and stock fundamentals | active stock fundamentals/history/quote capability | `NOT_ACCESSIBLE` |
| `COIN_API_KEY` | `CoinAPIMarketDataProvider.ts`, external market-data adapters | active crypto normalized multi-exchange evidence capability | `NOT_ACCESSIBLE` |
| `EODHD_API_KEY` | `eodhdBondEvidence.ts`, external market-data adapters | active bond/market evidence capability | `NOT_ACCESSIBLE` |
| `TWELVEDATA_API_KEY` | `TwelveDataMarketDataProvider.ts`, traditional quotes, commodity evidence, external adapters | active stock/forex/commodity/index/crypto capability | `NOT_ACCESSIBLE` |
| `FRED_API_KEY` | `macroRateEvidence.ts` | active macro/rate evidence capability | `NOT_ACCESSIBLE` |
| `FMP_API_KEY` | `server/fmpIndices.ts`, `server/stockFundamentals.ts`, provider registry | active index/fundamentals enrichment capability | `NOT_ACCESSIBLE` |
| `DUNE_API_KEY` | `DuneQueryEvidenceProvider.ts`; governed allowlisted saved-query evidence | bounded on-chain evidence capability | current value `NOT_ACCESSIBLE`; historical owner-provision evidence only |
| `GOPLUS_API_KEY` | Token Security and Transaction Simulation provider paths | bounded security/evidence capability; some token-security use remains keyless-capable | current value `NOT_ACCESSIBLE`; historical owner-provision evidence only |

`COINGECKO_API_KEY` is not present in the canonical `secretFileManifest.ts` on the correlated baseline. CoinGecko adapters remain available for explicit on-demand evidence, but CoinGecko has been removed from application startup/background market-data loading by this PR. Absence from the manifest does not prove that no ad-hoc Render env variable exists.

### Functional-key boundary

The connected Render capability can list services/deploys and read logs, and can set/replace environment variables, but it cannot safely enumerate current env-var names/values, selectively read a secret, selectively delete an env var, or read/edit the mounted `finance-secrets.env`. Therefore an authenticated live probe cannot be bound to a particular current secret without a provider-safe execution surface. Static repository tests prove fail-closed behavior and integration contracts, not that the current secret value is valid.

Consequently every current live-key result above remains `NOT_ACCESSIBLE` or `NOT_PROVEN`; none is falsely promoted to PASS. A future provider test must use a least-privilege endpoint, expose only boolean/status evidence, log no credential material and distinguish `configured`, `authenticated`, `authorized`, `quota-available` and `functionally-useful` states.

## Required evaluation dimensions

For every non-retirement provider key, report separately:

1. **Configured state** — PRESENT / ABSENT / NOT_ACCESSIBLE, without revealing the value.
2. **Current repository consumer** — exact source path(s) or `NO_CURRENT_CONSUMER`.
3. **Runtime role** — startup-critical, optional capability, shadow/evidence, manual/admin only, or dormant.
4. **Functional probe** — PASS / FAIL / NOT_RUN / NOT_ACCESSIBLE using the least-privileged endpoint and no secret logging.
5. **Cost and quota value** — free-tier/paid exposure, quota constraints and whether another configured provider already supplies the same capability.
6. **Security value/risk** — server-only boundary, blast radius and whether keeping the credential increases unnecessary attack surface.
7. **Recommendation** — KEEP_ACTIVE, KEEP_DORMANT, REACTIVATE_CANDIDATE, ROTATE, or OWNER_DELETE_CANDIDATE. This is evidence/recommendation only; deletion remains Human/Owner action unless separately authorized.

## Gemini reactivation evaluation

Gemini is **not** a deletion target. It is a reactivation candidate whose added product value must be measured.

### Repository state

Repository evidence shows a server-only `GeminiResearchTransport`, a default-off `GEMINI_RESEARCH_SHADOW_ENABLED` flag and no public route consumer. The current state is therefore dormant/shadow rather than production-critical. The existing repository policy also constrains Gemini to a free-tier-only/no-billing project unless a later Owner decision changes that contract.

### Current external capability delta — reviewed 2026-09-18

Official Google Gemini API documentation currently exposes capabilities that are directly relevant to a research/evidence layer:

- Gemini 3 models support up to **1 million input tokens** and up to 64k output tokens.
- Google Search grounding can retrieve current web information and return inline URL citations.
- URL Context can retrieve supplied URLs and can be combined with Search grounding for deeper source analysis.
- Gemini 3 can combine structured outputs with Search, URL Context, code execution, file search and function calling; built-in and custom-tool combinations are available for Gemini 3.
- Google documents a Gemini 3 Flash free tier. Google also states that Free-Tier content may be used to improve Google products, while the paid tier is marked as not used for that purpose. That privacy difference must be considered before any FINTECH production-data use.
- Search grounding is not simply “free Gemini”: Google currently documents 5,000 free Search requests/month on the paid tier for Gemini 3.x, then USD 14 per 1,000 search requests. A single model request can generate multiple billable searches.

Official sources reviewed:

- https://ai.google.dev/gemini-api/docs/gemini-3
- https://ai.google.dev/gemini-api/docs/google-search
- https://ai.google.dev/gemini-api/docs/url-context
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/tool-combination
- https://ai.google.dev/gemini-api/docs/pricing

### Added-value hypothesis for CAPITAL-AI

The strongest reactivation hypothesis is **not** “another general chatbot”. It is a bounded, independent research/evidence provider that can combine Google Search grounding, URL retrieval, long context and structured evidence output. Potential value exists in:

1. independent cross-provider evidence for claims produced by OpenAI/Anthropic;
2. current web/source discovery with citation metadata for research tasks;
3. long-context comparison of filings, reports, documentation and multiple source URLs;
4. resilience when another AI provider is unavailable or quota-limited;
5. provider-diversity evidence that can expose correlated model/provider failure modes.

The value is weaker where deterministic market-data/provider APIs already give authoritative structured data. Gemini MUST NOT replace FRED, Twelve Data, EODHD, CoinAPI, FMP, Dune, GoPlus or other domain evidence merely because it can browse/search.

### Reactivation gate

Recommendation: **`REACTIVATE_CANDIDATE / SHADOW_ONLY`**.

A reactivation test must compare Gemini against the existing OpenAI/Anthropic and deterministic evidence paths on the same frozen FINTECH research cases. Measure at least:

- source/evidence recall and citation correctness;
- unsupported-claim/hallucination rate;
- source diversity and incremental evidence found only by Gemini;
- latency and provider reliability;
- token/search usage and projected cost;
- privacy/data-governance compatibility, especially Free-Tier data-use terms;
- whether Gemini materially improves an end-user decision-support output rather than only producing stylistically different text.

A successful API-key authentication probe alone is **not** sufficient to reactivate Gemini. Promotion requires a measured capability advantage or resilience benefit, continued server-only handling, default-off rollout, evidence/shadow entry first, no direct score/ranking authority, and explicit review of the free-tier privacy boundary. Until then `GEMINI_API_KEY` remains `NOT_PROVEN` functionally and must not be deleted solely because the transport is dormant.

## Current external capability boundary and deletion policy

- No non-Alpaca/non-CoinGecko API key is deleted here.
- No secret-file value is read into evidence.
- Alpaca/CoinGecko credential removal is a later Human/Owner decision after provider-side enumeration/readback.
- Other keys may be recommended for KEEP/ROTATE/DELETE after their functionality/use/cost/security evaluation, but deletion is not executed automatically by this PR.

## Merge gate

PR #1046 may independently validate the code changes for Alpaca readiness/health removal, CoinGecko startup removal and fail-closed `promo_redemptions` retirement. API-key deletion is not a merge gate. Provider-key evaluation remains read-only evidence unless a later explicit Human/Owner decision authorizes a specific mutation.
