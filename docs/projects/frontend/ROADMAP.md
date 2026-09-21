# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-21 — FRONTEND upstream architecture adoption correlated  
**Baseline:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## FE-LF-01-UPSTREAM-ARCH — Current presentation architecture adoption

**Owner direction:** 2026-09-21  
**Pinned source for PR #1206:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Scope:** complete current graphical/presentation architecture  
**LF-01 exit state on branch:** `PASS_AFTER_HUMAN_MERGE`

PR #1206 physically adopts the current upstream application composition, entry point, styles, presentation types, all graphical components/modals and the visual fixture required to reproduce them. The snapshot is inert and reviewable under `docs/frontend/upstream-source/SvenKulessa-FRONTEND/`.

`mockData.ts` is `VISUAL_FIXTURE_ONLY`: it may reproduce layout/content density but it is not productive market, news or scoring evidence.

### Continuation after merge

After #1206 merges, existing Finance-owned frontend/domain consumers are bound to this graphical architecture through adapters. Auth/session, data/provider, scoring, entitlement, billing and other productive authority remain with their canonical Finance owners. Each binding slice removes demo dependencies and preserves applicable SEC/COMP/QM gates.

The hourly upstream sync maintains the same presentation-architecture scope through review PRs; it does not directly mutate productive runtime.

## Preserved frontend invariants

- `docs/frontend/FRONTEND_ARCH.md` remains the Finance runtime dependency/presentation boundary.
- FRONTEND upstream is the leading visual source, not repository execution authority.
- Frontend never becomes scoring/data/entitlement/IAM/Governance/Social-publishing authority.
- Exact-head Frontend architecture, TypeScript, tests and build evidence remain required for productive adapter changes.

## Dependencies

FINTECH provides verified scoring/data contracts; OPS owns runtime/deployment responsibilities where assigned; SEC/COMP/QM retain independent gates; SEO/SOCIAL consume verified presentation outcomes.

## Project exit gate

One active FE architecture; upstream visual snapshot traceable to an exact SHA; productive Finance components connected through owner-correct adapters; no demo fixture promoted to live authority; required exact-head evidence green.
