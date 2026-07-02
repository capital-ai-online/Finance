# Changelog - AIF-CORE

Refer to the official backlog and release history in `/backlog/CHANGELOG.md`.

---

## [0.5.2] - 2026-07-02

### Summary of Changes
- **Sidebar Fix (Login/Logout unreachable)**: Fixed a flexbox scrolling bug in `Dashboard.tsx` where the drawer's nav content (`flex-1 overflow-y-auto`) was missing `min-h-0`, allowing it to overflow past the panel height on small/mobile screens and push the Login/Logout footer off-screen. Panel height now uses `100dvh` (mobile browser chrome correctness), the footer is pinned with `shrink-0` and gets `env(safe-area-inset-bottom)` padding for notch devices.
- **No-Demo-Data-Policy Enforcement in Market Data Pipeline**: Removed all remaining `Math.random()`-based and `price % X`-formula-based fabricated values from `server.ts`:
  - Coinbase crypto fallback no longer invents `change24h`/`volume` (now `null` when unavailable).
  - Crypto fallback chain no longer fabricates prices via fluctuation of the static reference list; assets without a genuine live price are omitted instead of faked.
  - Stooq success path no longer fabricates `peRatio`, `debtToEquity`, `dividendYield`, `grahamScore`, or volume via price-modulo formulas; these are now `null` when not sourced from a real API.
  - `/api/market-data` no longer serves a `Math.random()`-fluctuated static fallback when all live sources and cache fail; it now returns an honest `503 DATA_UNAVAILABLE`.
  - `/api/news` no longer falls back to Gemini-fabricated news (which impersonated real outlets like "Bloomberg Crypto"/"Reuters Finance") nor a hardcoded mock array. It now serves stale-but-real cached NewsAPI.org results (≤5 min) or an honest `DATA_UNAVAILABLE` status.
- **Real Alpha Vantage Fallback for Stocks**: `fetchAlphaVantageFallbackAssets()` now provides a genuine `GLOBAL_QUOTE`-based fallback for stock prices when Stooq is unreachable, replacing the previous fake-fluctuation fallback. Respects the Alpha Vantage free-tier rate limit (5 req/min).
- **Kraken Private API (read-only)**: Added HMAC-SHA512 request signing (Node built-in `crypto`, no new dependency) and two admin-protected, read-only endpoints: `GET /api/kraken/balance` and `GET /api/kraken/open-orders`. Order placement (`AddOrder`) remains intentionally unimplemented pending the deferred confirmation-UX/position-limits/audit-logging design.
- **Cross-Exchange Arbitrage Scanner (informational, read-only)**: Added `GET /api/arbitrage-scan`, comparing genuine live public prices across Binance, Kraken, and Coinbase for BTC/ETH/SOL/ADA and reporting the spread. Performs no trades; explicitly documents that the figures are gross spreads before fees/slippage.
- **Env Vars**: Added `KRAKEN_API_KEY` / `KRAKEN_API_SECRET` to `.env.example` with a permissions note (Query Funds + Query Open Orders only, no withdrawal/trading scope). Removed the stray `News_API_KEy` typo entry.

## [0.5.1] - 2026-06-30

### Summary of Changes
- **GDPR / DSGVO Portability Export (Art. 20)**: Introduced a robust, structured JSON export tool inside the User Profile panel that allows users to instantly download a comprehensive archive of their profile metadata, preference metrics, and backtest history securely.
- **Section 508 & BFSG Accessibility Verification**: Completed a full accessibility upgrade by introducing explicit HTML input label linkages (`htmlFor`), group aria roles, keyboard focus rings (`focus:ring-2`), and descriptive aria-labels for customized select elements and selectors.
- **Exclusive Owner Admin Page (Sven Kulessa)**: Created a highly polished, interactive Admin Dashboard with Recharts telemetry, user privileges overriding, auto-router parameters tuning, and a planner for the future Investor/Employee subscription tier.
- **Admin Authentication for Orchestrator Controls**: Implemented a header-based `X-Orchestrator-Admin-Token` passcode check on the Node.js Express server (`/api/orchestrator/config` & `/api/orchestrator/reset`) and integrated an elegant admin passcode input within the tuner panel.
- **Data Pipeline Encryption**: Implemented a secure cryptographic utility (`src/lib/cryptoHelper.ts`) utilizing the Web Crypto API to perform robust PBKDF2/AES-GCM encryption and decryption. Sealed the persistent user profile data stored in `localStorage` securely.
- **Model Auto-Routing Latency Monitor**: Added an interactive, real-time telemetry card within the `OrchestratorPanel` frontend and backend (`/api/orchestrator/ping-models`) to check model response latencies, model costs, and dynamically display the optimal model routing selection under 200ms.

## [0.5.0] - 2026-06-30

### Summary of Changes
- **Developer Directives (`AGENTS.md`)**: Configured global system instruction injections to guarantee data integrity across all components.
- **Backlog Folder (`/backlog`)**: Created repository-wide tracking folder for future sprints.
- **Market Screener Bug Fix**: Added robust defenses against non-array payloads and added missing state updates for the Category selector.
- **Request Orchestrator Harming**: Added IPv4/IPv6 masking to protect customer PII (IP addresses).
- **Deactivated Modules & Menu Cleanup**: Removed "Interact (Modul 2)" and "Risikoassessment" from navigation sidebar completely. Both modules now contain deactivation comments in their code header (`InteractModule.tsx`, `RealTimeRiskAssessment.tsx`). The active view routes are replaced with user-friendly deactivated notice cards.
- **Smartphone Scroll Optimization**: Formatted the menu layout for full smartphone compatibility, utilizing `flex-1 overflow-y-auto` to add an automatic scrollbar when vertical height is insufficient.
- **Unified Versioning**: Pinned all metrics to Version 0.5.0.
