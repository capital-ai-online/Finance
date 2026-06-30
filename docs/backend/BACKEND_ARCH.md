# ⚙️ Backend Architecture & Service Guidelines
**Project: Jenova Nexus (AIF-CORE)**
**Stack: Node.js / Express / TypeScript / Supabase PostgreSQL**

---

## 🗺️ Backend Architecture Overview

The backend is realized as a high-performance, single-instance **Express API Server** designed to proxy client requests to external providers (CoinGecko, Stooq, Stripe), manage persistent user subscription status via PostgreSQL, and serve static frontend bundles in production.

---

## ⚡ Core Operational Directives

### 1. Robust Server-Side Caching (API Guarding)
To neutralize client-induced rate limiting (such as `429 Too Many Requests` on public APIs like CoinGecko), all external market feeds must use server-side cache layers.
- **Cache TTL**: Market prices cached for **60 seconds** (`MARKET_DATA_CACHE_TTL = 60000`).
- **Request Coalescing**: Combine identical incoming concurrent requests using a shared, active Promise (`activeMarketDataPromise`) to avoid multi-fetching.
- **Dynamic Fallbacks**: In case of complete remote API failure, serve expired cache contents, or fall back to high-fidelity, simulated price fluctuations.

### 2. Lazy Initialization for Client SDKs
To avoid crashes on startup when keys are missing or invalid, all SDK wrappers (like Stripe and Supabase clients) must be loaded lazily on-demand.

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

### 3. Raw Body Webhook Ingestion
The Stripe signature check (`stripe.webhooks.constructEvent`) requires the exact, unaltered raw buffer body. Consequently, webhook routing must be defined **before** applying global body-parser middlewares like `express.json()`.

---

## 📦 API Routes Matrix

| Endpoint | HTTP | Description | Security |
| :--- | :---: | :--- | :--- |
| `/api/market-data` | GET | Real-time aggregate pricing, volumes, and scores. | Rate Limited / Cached |
| `/api/backtest-history` | GET | Retrieves daily historical closing price tables. | Parameter Validation |
| `/api/stripe/user-subscription`| GET | Syncs subscription tiers from local tables. | JWT Token Authorized |
| `/api/stripe/checkout` | POST | Spawns checkout sessions on Stripe Gateway. | User Authenticated |
| `/billing/webhook` | POST | Direct ingest for Stripe webhook events. | Signature Verified |
