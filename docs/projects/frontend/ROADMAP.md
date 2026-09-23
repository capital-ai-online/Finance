# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-23 — branded Roadmap Live Dashboard correlated to fresh CURRENT_MAIN; merged Vocabulary route return retained; no productive domain ownership changes  
**Baseline:** `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## Current-main reconciliation — 2026-09-23

This FE projection is re-correlated to `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`.

- PR #1298 is Human/CODEOWNER-merged; the former `AppRoutes.tsx` writer overlap for Vocabulary return is terminal.
- PR #1297 is Human/CODEOWNER-merged; SH-02.10 is no longer an open PR and is not projected as active FE work.
- Open PR #1300 remains an independent FE consent writer with no changed-file overlap against the Roadmap dashboard slice.
- Open PR #1299 remains a GOV Vocabulary writer and does not transfer Governance ownership to FE.
- Production/deployment state is not inferred from repository merge state; the Roadmap UI reads the non-secret `/healthz` deployment identity independently.

## FE-ROADMAP-LIVE-01 — Branded Roadmap Live Dashboard

**Canonical identity:** `FE-ROADMAP-LIVE-01`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Scope:** read-only presentation/aggregation of canonical current-state evidence; no productive PVC ownership  
**Status:** `IMPLEMENTED_ON_BRANCH / DIRECT_ROUTE_HANDOFF_REQUIRED`  
**Fresh baseline:** `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`  
**Branding contracts:** `docs/frontend/brandmark.json`, `docs/frontend/design-tokens.json`, `src/shared/branding/CapitalAiLogo.tsx`, `src/shared/ui/Card.tsx`

Fresh Human/Owner direction requests a real `/roadmap` page that projects the current Roadmap and all actively processed work packages. The implementation remains a non-authorizing derived view:

- canonical task state remains in each owner-correct `docs/projects/<project>/ROADMAP.md` or exact provider-backed PR/branch evidence;
- the UI snapshot is bound to the exact correlated CURRENT_MAIN SHA and is never a second task registry;
- open PRs and active exclusive branches are shown only as provider evidence, not as instruction or ownership authority;
- `CapitalAiLogo` uses the canonical brandmark geometry; colors/typography/roadmap roles resolve from `design-tokens.json` and the existing CSS token projection;
- Production identity is read from same-origin `/healthz` and remains explicitly separate from repository CURRENT_MAIN;
- direct production deep-link fallback for `/roadmap` is an OPS-owned server/runtime concern and is not silently absorbed by FE.

**Exit:** exact-head FE tests/build are green; `/roadmap` is wired in the client router; the owner-correct OPS direct-route fallback is merged or otherwise evidenced; current-main/open-writer correlation remains PASS; Human/CODEOWNER merge remains required.

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
**Merged evidence:** PR #1245 → `4a095d7e267b284ed4456750ad031457a2ef9a0a`; contained in current main ancestry

The pinned upstream `ReferenceApp` remains unchanged and source-locked. Finance adapts only desktop presentation through `frontend-port.css`:

- sub-1024px mobile/tablet layout remains upstream-identical from the Finance adapter perspective;
- desktop removes the source preview toolbar, simulated phone frame/status chrome and iOS home indicator;
- desktop uses a bounded website canvas, desktop hero hierarchy and responsive card grids;
- no User-Agent/device sniffing is introduced;
- when a rendered surface consumes an owner-correct PVC output, FE may adapt its own layout, responsive behavior, accessibility and interaction while the PVC Primary Owner and domain semantics remain unchanged;
- every upstream sync requires the desktop adapter and validates the current `src/App.tsx` preview-shell markers;
- marker drift fails closed with a desktop-adapter correlation error so a future sync cannot silently restore the phone preview on desktop.

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

One active FE architecture; canonical branding remains source-bound; `FE-ROADMAP-LIVE-01` is a read-only non-authorizing projection; upstream graphical composition remains pinned/hash-verifiable; no fixture becomes productive authority; productive deployment/readback stays an owner-correct OPS concern.
