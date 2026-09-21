# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-22 — upstream review snapshot is f2a101; FE-LF-03 promotes that graphical generation into runtime while preserving host authorities  
**Baseline:** `main@a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## FE-LF-01-UPSTREAM-ARCH — Current presentation architecture adoption

**Pinned source for PR #1206:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Scope:** current graphical/presentation architecture + canonical root binding  
**LF-01 exit state:** `MERGED / RECONCILED ON MAIN`

PR #1206 adopted the current upstream application composition, presentation types, all current graphical components/modals and visual image assets.

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

After #1206 merged, the owner clarified the device contract: the synchronized mobile/tablet view is accepted unchanged; only desktop requires a website adaptation.

## FE-LF-02-DESKTOP-RESPONSIVE — Desktop website adapter

**Canonical identity:** `FE-LF-02-DESKTOP-RESPONSIVE`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Scope:** Frontend presentation only; affected rendered `PVC-01..PVC-18` output may be used as presentation/adaptation scope; no productive PVC ownership  
**Desktop breakpoint:** `>=1024px`  
**Status:** `IMPLEMENTED_PENDING_EXACT_HEAD_EVIDENCE`

The pinned upstream `ReferenceApp` remains unchanged and source-locked. Finance adapts only desktop presentation through `frontend-port.css`:

- sub-1024px mobile/tablet layout remains upstream-identical from the Finance adapter perspective;
- desktop removes the source preview toolbar, simulated phone frame/status chrome and iOS home indicator;
- desktop uses a bounded website canvas, desktop hero hierarchy and responsive card grids;
- no User-Agent/device sniffing is introduced;
- when a rendered surface consumes an owner-correct PVC output, FE may adapt its own layout, responsive behavior, accessibility and interaction while the PVC Primary Owner and domain semantics remain unchanged;
- every upstream sync requires the desktop adapter and validates the current `src/App.tsx` preview-shell markers;
- marker drift fails closed with a desktop-adapter correlation error so a future sync cannot silently restore the phone preview on desktop.

The hourly upstream sync therefore keeps future source visibility through review PRs while requiring desktop re-correlation before changed preview-shell architecture is accepted.

## FE-LF-03-RUNTIME-PROMOTION-F2A101 — Current graphical generation

**Canonical identity:** `FE-LF-03-RUNTIME-PROMOTION-F2A101`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Source:** `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`  
**Status:** `IMPLEMENTED_PENDING_EXACT_HEAD_EVIDENCE`

This work closes the gap where the hourly source-sync updated only the inert review snapshot while productive runtime remained locked to `8f6b629...`.

Exit evidence:

- landing runtime and source-lock identify `f2a101330...`;
- new Header/Footer, market subclass navigation and `SubclassDetailModal` are present;
- Cyber-Earth emblem geometry is current while Finance design tokens remain authoritative;
- productive Auth/Session and Compliance content are not replaced by upstream demo/sample logic;
- desktop adapter remains correlated at >=1024px;
- source-sync schema 1.2 is executable and can no longer reject its own config;
- exact-head Frontend/unit/build evidence is green before merge readiness.

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
