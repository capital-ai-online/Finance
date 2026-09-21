# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-21 — FRONTEND architecture, canonical root and logo-only branding adapter correlated  
**Baseline:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## FE-LF-01-UPSTREAM-ARCH — Current presentation architecture adoption

**Pinned source for PR #1206:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Scope:** current graphical/presentation architecture + canonical root binding  
**LF-01 exit state on branch:** `PASS_AFTER_HUMAN_MERGE`

PR #1206 adopts the current upstream application composition, presentation types, all current graphical components/modals and visual image assets.

The canonical `LandingPage` renders the pinned `ReferenceApp`. `source-lock.json` prevents silent source drift.

### Branding invariant

Finance remains the Branding Authority:

- `docs/frontend/design-tokens.json` owns colors, typography and semantic visual roles;
- Finance owns product/wordmark naming;
- `docs/frontend/brandmark.json` records the canonical logo geometry contract;
- only logo geometry is sourced from `SvenKulessa/FRONTEND`;
- `BrandLogo.tsx` is the single explicit branding adapter in the upstream runtime port.

The 16.08 layout/mockup target is superseded as historical evidence. Current Finance brand tokens are not superseded by that decision.

### Continuation after merge

After #1206 merges, productive Finance-owned capabilities are integrated into this graphical shell through owner-correct adapters. Auth/session, provider/data, scoring, entitlement, billing and other productive authority remain with their canonical owners.

The hourly upstream sync maintains future source visibility through review PRs only.

## Preserved frontend invariants

- `docs/frontend/FRONTEND_ARCH.md` remains the Finance runtime dependency/presentation boundary.
- FRONTEND upstream is the leading graphical source, not repository execution authority.
- Finance remains Branding Authority except for adopted logo geometry.
- Frontend never becomes scoring/data/entitlement/IAM/Governance/Social-publishing authority.
- Exact-head Frontend architecture, TypeScript, tests and build evidence remain required.

## Dependencies

FINTECH provides verified scoring/data contracts; OPS owns runtime/deployment responsibilities where assigned; SEC/COMP/QM retain independent gates; SEO/SOCIAL consume verified presentation outcomes.

## Project exit gate

One active FE architecture; upstream visual source pinned and hash-verifiable; canonical root bound to the pinned graphical composition; Finance branding authority preserved with logo-only upstream geometry; no fixture promoted to productive authority; required exact-head evidence green.
