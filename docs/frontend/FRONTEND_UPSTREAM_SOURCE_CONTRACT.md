# FRONTEND upstream presentation-source contract

**Project:** `CAPITAL-AI-FE`  
**Source repository:** `SvenKulessa/FRONTEND`  
**Source ref:** `main`  
**Pinned adoption snapshot in PR #1206:** `8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Finance execution authority:** `/AGENTS.md@CURRENT_MAIN`

## Architecture adoption

Merge of PR #1206 adopts the current `SvenKulessa/FRONTEND` presentation architecture as the leading graphical architecture for CAPITAL-AI.

The adopted snapshot includes the complete current presentation surface: application composition, entry point, global styles, presentation type shapes, all graphical components/modals, and the fixture data required to reproduce those components visually.

The snapshot is physically stored under `docs/frontend/upstream-source/SvenKulessa-FRONTEND/` and is pinned to the upstream SHA in its manifest. It is therefore reviewable and reproducible at merge time rather than being merely a future-sync declaration.

## Boundary

The upstream repository owns visual intent, graphical components, UI slices and presentation composition. Finance retains productive auth/session, data/provider, news, scoring, entitlement, billing, Security, Compliance, Governance and deployment authority.

`src/data/mockData.ts` is adopted solely as `VISUAL_FIXTURE_ONLY`. Its prices, scores, news, labels or other sample values are not productive evidence and must never be wired as live Finance data.

## Binding sequence after #1206

1. merge #1206 and establish the upstream presentation architecture on CURRENT_MAIN;
2. treat the pinned snapshot and future hourly snapshots as the graphical reference;
3. bind existing Finance-owned components/contracts to that graphical architecture through owner-correct adapters;
4. remove or replace mock/demo dependencies during each productive adapter step;
5. verify exact-head TypeScript, Frontend architecture, tests/build and applicable SEC/COMP/QM gates.

The hourly workflow updates the same presentation architecture scope and opens/updates a review PR. It never executes upstream code and never promotes a snapshot automatically into Finance runtime `src/`.
