# ⚙️ Backend Architecture & Service Guidelines
**Project: CAPITAL-AI (Capital AI)**  
**Stack:** Node.js / Express / TypeScript / Supabase / PostgreSQL  

---

## 🗺️ Architectural Concept: High-Performance API Gateway
The backend serves as a secure, high-performance API Gateway designed to proxy client requests to external providers (CoinGecko, Stooq, Stripe), enforce row-level security on PostgreSQL tables, verify subscription tiers, and serve static assets.

---

## ⚡ Core Operational Directives

### 1. Robust Server-Side Caching (API Guarding)
To neutralize client-induced rate limiting (such as `429 Too Many Requests` on public APIs like CoinGecko), all external market feeds must use server-side cache layers.
* **Cache TTL**: Market prices cached for **60 seconds** (`MARKET_DATA_CACHE_TTL = 60000`).
* **Request Coalescing**: Combine identical incoming concurrent requests using a shared, active Promise (`activeMarketDataPromise`) to avoid multi-fetching.
* **Dynamic Fallbacks**: In case of complete remote API failure, serve expired cache contents, or fall back to high-fidelity, simulated price fluctuations.

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

## 💳 Stripe Production Integration

The Stripe billing engine supports unbegrenzte, secure payment checkout and subscription cycle management.

### Key Implementation Guidelines:
- **Keys Protection**: Enforce that the `STRIPE_SECRET_KEY` and the `STRIPE_WEBHOOK_SECRET` are stored purely in server-side process environments.
- **Checkout Sessions**: Dynamic pricing tied directly to environment variables (`STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`, etc.). Success and cancel URLs must carry the session identifier (`?session_id={CHECKOUT_SESSION_ID}`) to verify the payment on return.
- **Idempotent Webhooks**: Secure webhook routing to verify event signatures, map customer metadata to Supabase user IDs, and perform idempotent database updates to prevent multiple subscription allocations.
- **Self-Service Customer Portal**: Expose endpoints where users can upgrade, downgrade, or cancel subscriptions through Stripe's native Billing Portal safely.

---

## 📦 API Routes Matrix

| Endpoint | HTTP | Description | Security |
| :--- | :---: | :--- | :--- |
| `/api/market-data` | GET | Real-time aggregate pricing, volumes, and scores. | Rate Limited / Cached |
| `/api/backtest-history` | GET | Retrieves daily historical closing price tables. | Parameter Validation |
| `/api/stripe/user-subscription`| GET | Syncs subscription tiers from local tables. | JWT Token Authorized |
| `/api/stripe/checkout` | POST | Spawns checkout sessions on Stripe Gateway. | User Authenticated |
| `/billing/webhook` | POST | Direct ingest for Stripe webhook events. | Signature Verified |
