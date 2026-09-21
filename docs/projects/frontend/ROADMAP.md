# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-21 — FRONTEND upstream architecture + canonical root binding correlated  
**Baseline:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## FE-LF-01-UPSTREAM-ARCH — Current presentation architecture adoption

**Owner direction:** 2026-09-21  
**Pinned source for PR #1206:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Scope:** complete current graphical/presentation architecture + canonical root presentation binding  
**LF-01 exit state on branch:** `PASS_AFTER_HUMAN_MERGE`

PR #1206 physically adopts the current upstream application composition, styles, presentation types, all 13 graphical components/modals and all four visual image assets. The source is retained as an inert review snapshot and as a byte-identical runtime presentation copy.

The canonical `src/features/public/ui/LandingPage.tsx` renders the pinned `ReferenceApp`. `source-lock.json` and `frontendReferenceDesignLock.test.ts` prevent silent component/asset drift by checking exact Git blob identities.

`mockData.ts` remains presentation fixture content. It does not become canonical market, news or scoring evidence and does not transfer FINTECH authority.

### Continuation after merge

After #1206 merges, productive Finance-owned capabilities are integrated into this graphical shell through separate owner-correct adapters where required. Auth/session, provider/data, scoring, entitlement, billing and other productive authority remain with their canonical owners.

The hourly upstream sync maintains future source visibility through review PRs only. It does not automatically replace the pinned runtime landing version.

## Preserved frontend invariants

- `docs/frontend/FRONTEND_ARCH.md` remains the Finance runtime dependency/presentation boundary.
- FRONTEND upstream is the leading visual source, not repository execution authority.
- The productive root presentation is pinned to an exact reviewed FRONTEND commit.
- Frontend never becomes scoring/data/entitlement/IAM/Governance/Social-publishing authority.
- Exact-head Frontend architecture, TypeScript, tests and build evidence remain required.

## Dependencies

FINTECH provides verified scoring/data contracts; OPS owns runtime/deployment responsibilities where assigned; SEC/COMP/QM retain independent gates; SEO/SOCIAL consume verified presentation outcomes.

## Project exit gate

One active FE architecture; upstream visual source pinned and hash-verifiable; canonical root bound to the pinned graphical composition; no fixture promoted to productive authority; required exact-head evidence green.
