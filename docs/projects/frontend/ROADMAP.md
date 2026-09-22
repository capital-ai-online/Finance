# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-22 — merged landing/runtime/data/desktop/consent outcomes re-correlated on fresh CURRENT_MAIN; no productive domain ownership changes  
**Baseline:** `main@aee799282298596a5f2d9140a4e805edf52783a0`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## Current-main reconciliation — 2026-09-22

This bounded status-only reconciliation records merged FE evidence without changing runtime behavior:

- PR #1226 → `de035ee4fdec2fdc270745d4966a6fd484f9e7c2`: extended landing/legal paths/assets synchronized;
- PR #1227 → `b1e6b1259641f767f11ea14385ea60a7911ec6ae`: verified data binding integrated into the landing composition;
- PR #1241 → `9c8a3e80c4451ed0b6ea45f368175604608f6f4b`: current FRONTEND graphical generation promoted into productive Finance runtime;
- PR #1243 → `3a1e43743fed486668371dd9251d19c66e9397d3`: verified data binding re-correlated to the current `f2a101` landing generation;
- PR #1245 → `4a095d7e267b284ed4456750ad031457a2ef9a0a`: native desktop landing responsiveness fixed and merged;
- PR #1261 → `aee799282298596a5f2d9140a4e805edf52783a0`: incognito first-visit cookie interaction unblocked without changing FE/domain ownership.

The former `main@4a095d7e...` correlation point remains valid historical merge evidence, but it is no longer CURRENT_MAIN. Production/deployment readback is not inferred from repository merge state and remains owner-correct outside FE.

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
**Status:** `DONE_MAIN / TERMINAL`  
**Merged evidence:** PR #1245 → `4a095d7e267b284ed4456750ad031457a2ef9a0a`; contained in `main@aee799282298596a5f2d9140a4e805edf52783a0`

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
**Status:** `DONE_MAIN / TERMINAL`  
**Merged evidence:** PR #1241 → `9c8a3e80c4451ed0b6ea45f368175604608f6f4b`; PR #1243 → `3a1e43743fed486668371dd9251d19c66e9397d3`; desktop convergence PR #1245 → `4a095d7e267b284ed4456750ad031457a2ef9a0a`

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

One active FE architecture; upstream visual source pinned and hash-verifiable; canonical root bound to the pinned graphical composition; Finance branding authority preserved with logo-only upstream geometry; no fixture promoted to productive authority; merged FE-LF-02/03 outcomes are contained in current main. Productive deployment/readback remains a separate owner-correct concern and is not asserted from FE merge evidence.
