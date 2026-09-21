# FE-LF-03 — FRONTEND f2a101 Runtime Promotion

**Project:** `CAPITAL-AI-FE`  
**Owner:** `CAPITAL-AI-FE`  
**PVC relationship:** cross-cutting presentation; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Base:** `main@a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Upstream:** `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`  
**Status:** `IMPLEMENTED_PENDING_EXACT_HEAD_EVIDENCE`

## Finding

The hourly FRONTEND sync had already mirrored the current graphical source into
`docs/frontend/upstream-source/SvenKulessa-FRONTEND/`, but
`src/features/public/ui/frontend-port/source-lock.json` and the canonical landing runtime still
pointed to `8f6b629c...`. The sync contract intentionally disables automatic runtime promotion, so
the review snapshot converged while the website stayed on the older graphical generation.

A second defect existed in the same sync path: config schema `1.2.0` was paired with a script that
still rejected every schema except `1.1.0`.

## Bounded implementation

- promote current graphical Header/Footer, market subclass model, modal and presentation fixture;
- add `SubclassDetailModal`;
- bind new landing interactions to existing Finance routes instead of importing upstream routing/Auth;
- adopt current Cyber-Earth emblem geometry through Finance design tokens;
- keep productive Login/Auth/Session and COMP legal/FAQ content on canonical host surfaces;
- bridge upstream Header/Footer analytics calls to an internal presentation event only;
- update source lock, architecture contract and exact-source regression tests;
- align the source-sync implementation with schema `1.2.0`.

## Explicit non-goals

No Supabase/Auth authority change, no Compliance wording import, no upstream GA/GTM script loading,
no scoring/market-data authority change, no deployment mutation, and no removal of the Finance desktop adapter.

## Exit gate

1. Runtime generation is pinned to `f2a101330...` / tree `ddd6f578...`.
2. Every landing graphical component required by the current source is present or explicitly host-adapted.
3. Exact-source components remain Git-blob locked; Finance adapters are truthfully classified.
4. Mobile/tablet source behavior and desktop >=1024 website adaptation remain intact.
5. Frontend source-lock, sync-contract, TypeScript/unit/build evidence pass on the exact PR head.
6. Human/CODEOWNER merge remains required.
