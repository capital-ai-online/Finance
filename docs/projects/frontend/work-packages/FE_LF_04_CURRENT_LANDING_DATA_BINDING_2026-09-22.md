# FE-LF-04 — Current Landing Data Binding

**Canonical identity:** `FE-LF-04-CURRENT-LANDING-DATA-BINDING`  
**Project:** `CAPITAL-AI-FE`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**PVC relationship:** cross-cutting presentation consumer; no productive PVC ownership  
**Consumed productive authority:** `CAPITAL-AI-FINTECH / PVC-09..17`  
**Baseline:** `main@9c8a3e80c4451ed0b6ea45f368175604608f6f4b`  
**Current graphical reference:** `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`  
**Status:** `IMPLEMENTED_PENDING_EXACT_HEAD_EVIDENCE`

## Objective

Bind the current, newly promoted `f2a101` landing generation to existing verified Finance data without reverting any of the new graphical, navigation, login, legal or asset-subclass presentation changes.

The closed PR #1227 is historical evidence only and is not continued. This package is a fresh CURRENT_MAIN-derived implementation.

## Scope

- preserve the current `f2a101` visual generation as the graphical reference;
- modify only the Finance composition adapter and a new Finance-owned runtime adapter;
- keep all `EXACT_GIT_BLOB` component files unchanged;
- map all 15 currently visible market cards to canonical Finance asset identities;
- hydrate only the selected asset through `verified-asset-display/1.0.0`;
- keep provider access behind the existing server-side Finance contracts;
- do not initialize or fan out providers on initial root render;
- intercept all current analysis entry points, including Hero, Header, Product Tour and subclass analysis;
- keep productive landing scoring fail-closed behind `FIN-LF-01`;
- prevent the pinned AI Newsfeed sample content from being presented as productive live news;
- preserve current `/login`, legal/FAQ, subclass and all-markets navigation.

## Current asset mapping

| Current design identity | Canonical Finance identity |
|---|---|
| S&P 500 / SPX | `GSPC` |
| DAX 40 / DAX | `GDAXI` |
| Nasdaq 100 / NDX | `NDX` |
| BTC/USD | `BTC` |
| ETH/USD | `ETH` |
| SOL/USD | `SOL` |
| NVDA | `NVDA` |
| AAPL | `AAPL` |
| MSFT | `MSFT` |
| EUR/USD | `EURUSD` |
| GBP/USD | `GBPUSD` |
| USD/JPY | `USDJPY` |
| XAU/USD | `CMD_GOLD_COMEX` |
| XAG/USD | `CMD_SILVER_COMEX` |
| BRENT | `CMD_BRENT_ICE` |

## Authority boundaries

1. FRONTEND remains the graphical source only.
2. FE owns composition/presentation integration only.
3. FINTECH retains provider, evidence, Data Quality, feature, scoring, canonical scoring and ranking authority.
4. No browser-local scoring, entitlement, ranking or provider authority is introduced.
5. `/api/landing/quick-analysis` is not promoted to canonical scoring authority.
6. Productive landing scoring remains HELD until `LF-02_AUTH_PROFILE_PASS`, `LF-03_PRICING_ENTITLEMENTS_PASS`, `SEC_REVIEW_READY` and `QM_VALIDATION_READY` are evidenced on CURRENT_MAIN.
7. Missing data remains unavailable; no presentation fixture becomes a fallback financial observation.

## Exit evidence

- source lock still identifies `f2a101330...`;
- exact-source graphical component blobs remain unchanged;
- `ReferenceApp` uses the Finance-owned current landing runtime adapter;
- all current market selection paths load only the selected asset through `verified-asset-display/1.0.0`;
- Header/Hero/Product Tour/Subclass analysis paths no longer open the pinned mock analysis as productive behavior;
- AI Newsfeed fixture content is gated from productive live-data presentation;
- login, legal/FAQ, subclass and all-markets navigation remain present;
- focused regression passes;
- CURRENT_MAIN is ancestor of exact PR head;
- required hosted checks pass;
- Human/CODEOWNER merge remains required.
