# ⚙️ Backend Architecture & Service Guidelines
**Project: CAPITAL-AI**  
**Stack:** Node.js / Express / TypeScript / Supabase / PostgreSQL  
**Market-Data Alignment:** SC-MD-SPT-0001 v1.1.0 · ADR-0032 Revalidation 2026-08-20 · ADR-0041 / ESS-0016 · ADR-0083

---

## 🗺️ Architectural Concept: High-Performance API Gateway
The backend serves as a secure, high-performance API Gateway designed to proxy client requests to external providers (including CoinGecko, Stooq, FMP, Alpha Vantage and Stripe), enforce row-level security on PostgreSQL tables, verify subscription tiers, and serve static assets.

For financial data, the backend separates three concerns:

1. **Asset catalog** — identity and metadata only under ADR-0032;
2. **Verified observations / display evidence** — provider-backed values, provenance and freshness under ADR-0032 + ADR-0041 / ESS-0016;
3. **Canonical scoring** — independent Dispatcher-owned model execution under ADR-0087 / SC-2.

The presence of a catalog or compatibility fallback row does not make its numerical fields verified financial evidence.

---

## ⚡ Core Operational Directives

### 1. Robust Server-Side Caching and Provider Guarding
To neutralize client-induced and background rate limiting (for example `429 Too Many Requests` on public APIs), external market feeds use server-side cache, request coalescing, provider budgets and circuit breakers.

- **Cache TTL:** the compatibility market-data cache remains **60 seconds** (`MARKET_DATA_CACHE_TTL = 60000`). Cache freshness is not the same contract as provider polling cadence.
- **Background provider refresh:** SC-MD-SPT-0001 / ADR-0032 revalidation constrains actual background provider I/O to **at least 90 seconds** within the ADR-0083 / ADR-0075 runtime boundary. Early calls are deferred/coalesced by `marketDataRuntimeFacade` rather than triggering additional provider requests.
- **Request coalescing:** concurrent refreshes share the same in-flight transaction.
- **Fail-closed public evidence:** if no verified provider value exists, public verified contracts return an explicit unavailable/partial state. They do **not** manufacture simulated prices or bootstrap values.
- **Last-known-good/cache:** a previously verified cache value may be reused only according to its contract, age/freshness state and provider guard semantics. It must not be relabeled as a fresh observation.
- **Compatibility fallback rows:** may remain in `/api/market-data` for legacy compatibility, but appended fallback rows are not candidates for background enrichment, score persistence or alert side effects.

### 2. Progressive Verified Asset Display
The ADR-0032 revalidation implements the read-only contract `verified-asset-display/1.0.0` as the Display/Research lane of SC-MD-SPT-0001.

```text
GET /api/registry/assets
        -> metadata-only catalog
        -> user selects symbol
GET /api/registry/assets/:symbol/verified-display
        -> domain provider/evidence adapter
        -> value + provenance + timestamps + status
```

Rules:

- no full-catalog eager hydration;
- provider calls are per selected/visible symbol;
- `READY`, `PARTIAL`, `SOURCE_UNAVAILABLE`, `NOT_APPLICABLE` remain explicit;
- `executionPriceEligible=false` for the display contract;
- stock fundamentals are resolved server-side through `stockFundamentals.ts` (Alpha Vantage primary, existing FMP enrichment where available);
- this display boundary does not choose or execute scoring models;
- domain consumers must execute their entitlement/usage gate before quota- or provider-relevant hydration where an existing authority requires it; Buffett follows ADR-0034.

### 3. Lazy Initialization for Client SDKs
To avoid crashes on startup when keys are missing or invalid, SDK wrappers such as Stripe and Supabase clients must be loaded lazily/on demand where the surrounding domain contract permits it.

```typescript
let serverSupabaseClient: any = null;

function getServerSupabase() {
  if (!serverSupabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase credentials missing.");
    }
    serverSupabaseClient = createClient(url, key);
  }
  return serverSupabaseClient;
}
```

### 4. Raw Body Webhook Ingestion
The Stripe signature check (`stripe.webhooks.constructEvent`) requires the exact, unaltered raw buffer body. Consequently, webhook routing must be defined **before** applying global body-parser middlewares like `express.json()`.

---

## 💳 Stripe Production Integration

The Stripe billing engine supports secure payment checkout and subscription cycle management.

### Key Implementation Guidelines
- **Keys Protection:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` remain server-side environment values.
- **Checkout Sessions:** dynamic pricing is tied to configured Stripe Price IDs; success/cancel flows preserve the session identifier where required.
- **Idempotent Webhooks:** signature-verified events map to local user/subscription state with idempotent handling.
- **Self-Service Customer Portal:** subscription changes use Stripe's native Billing Portal where configured.

---

## 📦 API Routes Matrix — Relevant Financial/Platform Boundaries

| Endpoint | HTTP | Description | Contract / Security |
| :--- | :---: | :--- | :--- |
| `/api/registry/assets` | GET | Asset catalog: symbol/name/classification/contract metadata; financial values remain fail-closed when not verified. | ADR-0032 metadata-only / rate limited |
| `/api/registry/assets/:symbol/verified-display` | GET | Progressive per-symbol display evidence: value, fundamentals where applicable, provider lineage and timestamps. | `verified-asset-display/1.0.0`, ADR-0032 revalidation, read-only, non-execution |
| `/api/registry/assets/:symbol/verified-quote` | GET | Verified Traditional quote where the asset class supports it. | evidence/freshness guarded |
| `/api/registry/assets/:symbol/verified-score` | GET | Canonical per-symbol score. | ADR-0087 / Dispatcher authority |
| `/api/registry/assets/:symbol/verified-context` | GET | Canonical score context plus related verified context. | ADR-0087 / fail-closed |
| `/api/registry/assets/verified-scores` | GET | Bounded batch canonical score evaluation. | batch-bounded / Dispatcher authority |
| `/api/entitlements/warren-buffett/authorize` | POST | Serverseitige Buffett Feature-/Quota-Autorisierung vor Asset-Auswertung. | ADR-0034; stock-only DENY gate vor Provider-I/O erforderlich |
| `/api/market-data` | GET | Legacy compatibility aggregate. Provider-observed live rows may be enriched; fallback rows remain explicitly non-verified compatibility data. | cached; 60s TTL; provider refresh ≥90s |
| `/api/backtest-history` | GET | Retrieves daily historical closing price tables. | parameter validation |
| `/api/stripe/user-subscription` | GET | Syncs subscription tiers from local tables. | JWT authorized |
| `/api/stripe/checkout` | POST | Spawns checkout sessions on Stripe Gateway. | user authenticated |
| `/billing/webhook` | POST | Direct ingest for Stripe webhook events. | signature verified |

---

## Related Architecture

- `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- `docs/adr/resolved/ADR-0032-asset-catalog-market-evidence-separation.md`
- `docs/adr/evidence/ADR-0032-REVALIDATION-2026-08-20-VERIFIED-DISPLAY.md`
- `docs/adr/ADR-0034-central-subscription-entitlements-and-buffett-access.md`
- `docs/adr/ADR-0041-enterprise-market-data-provider-and-mcp-architecture.md`
- `docs/adr/ADR-0083-server-runtime-architecture-consolidation.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/architecture/DATENQUALITAETSSCHICHT.md`
- `docs/architecture/PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md`
- `server/marketData/marketDataRuntimeFacade.ts`
- `src/services/verifiedAssetDisplay.ts`
