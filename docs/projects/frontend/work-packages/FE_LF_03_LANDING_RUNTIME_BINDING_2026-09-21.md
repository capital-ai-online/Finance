# FE-LF-03 — Landing Runtime Binding

**Canonical identity:** `FE-LF-03-LANDING-RUNTIME-BINDING`  
**Project:** `CAPITAL-AI-FE`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Productive domain owners consumed:** `CAPITAL-AI-FINTECH` for verified market/scoring contracts; existing Auth/Entitlement owners remain unchanged  
**PVC relationship:** FE remains a cross-cutting presentation consumer with no productive PVC ownership; FINTECH retains `PVC-09..17`  
**Baseline:** `main@a54f54c43fd7e33e9a77b61542f75947e6deb23c`  
**Pinned design:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Status:** `IMPLEMENTED_PENDING_EXACT_HEAD_EVIDENCE`

## Objective

Bind the accepted landing design to existing productive Finance data and logic without mutating the pinned presentation source, creating a second scoring authority, or promoting presentation fixtures into financial evidence.

## Scope

- Keep every source-locked file under `src/features/public/ui/frontend-port/**` unchanged.
- Add a Finance-owned runtime adapter outside the pinned tree.
- Neutralize pinned market/module fixture values before they can be interpreted as productive finance data.
- Resolve design asset identities to the canonical Finance catalog.
- Hydrate a selected asset progressively through `GET /api/registry/assets/:symbol/verified-display` and contract `verified-asset-display/1.0.0`.
- Route landing analysis CTAs to the existing `PublicCryptoScoringPreview`, fixed to BTC in public/Free mode.
- Keep Buffett/News and other protected module actions behind their existing login/server entitlement boundaries.
- Preserve the new Mobile/Tablet/Desktop graphical architecture from LF-01/LF-02.

## Canonical asset mapping

| Design identity | Finance identity |
|---|---|
| S&P 500 | `GSPC` |
| DAX | `GDAXI` |
| NASDAQ-100 | `NDX` |
| BTC / ETH / SOL | `BTC` / `ETH` / `SOL` |
| NVDA / AAPL / MSFT | unchanged |
| EUR/USD / GBP/USD / USD/JPY | `EURUSD` / `GBPUSD` / `USDJPY` |
| Gold / Silver / Brent | `CMD_GOLD_COMEX` / `CMD_SILVER_COMEX` / `CMD_BRENT_ICE` |

## Guardrails

1. No direct provider calls from the landing adapter.
2. No browser-local scoring, ranking, entitlement or evidence semantics.
3. No eager full-catalog provider hydration; selected assets hydrate progressively.
4. Missing/unverified data remains unavailable instead of falling back to design fixtures.
5. Public Enterprise Scorer remains BTC-only and delegates to the canonical FINTECH scorer.
6. Human/CODEOWNER merge and applicable SEC/COMP/QM gates remain required.

## Exit evidence

- pinned `source-lock.json` remains unchanged;
- `LandingPage` declares the verified runtime binding and delegates interactions to the Finance adapter;
- market selection uses only `verified-asset-display/1.0.0`;
- design analysis actions can no longer open the mock analysis flow;
- public scorer uses `PublicCryptoScoringPreview` with `BTC` and `subscriptionTier="Free"`;
- focused regression verifies provider/scoring authority boundaries;
- required exact-head checks pass.
