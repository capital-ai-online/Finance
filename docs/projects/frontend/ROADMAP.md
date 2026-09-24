# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-24 — FE Roadmap/Landingpage presentation is merged and live; stale FE self-writer/Production-blocked projections are converged against exact CURRENT_MAIN without changing foreign-owner task state
**Baseline:** `main@67f9be45e41d78ca5d5c58f9be860d1887e4afad`
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

Archive/superseded copies and historical non-terminal markers are evidence only. Executable work must resolve from CURRENT_MAIN and current Owner direction.

## Current-main reconciliation — 2026-09-23

This FE projection is re-correlated to `main@426a98d4703271e438cbc6df4b1442fb3a9b032d`.

- PR #1334 (`Render Auth-Management-Token Recovery`) merged as `main@426a98d4703271e438cbc6df4b1442fb3a9b032d` while this FE PR was being created. The FE branch was synchronized by a non-conflicting merge; fresh provider readback now returns no foreign open writer (only this review-ready PR #1335). Historical PR #1299, #1300, #1315 and #1334 are terminal and are not projected as active provider work.
- The old UI snapshot baseline `7bcc6aee2700d6fa3f926ff8615b04cde136750c` is 185 commits behind this CURRENT_MAIN correlation and is evidence only.
- Render Production remains live on `7c1d9293ee4c61e32791e447463fcaf263644c6d` / deploy `dep-daq2vqou01pc73fjldv0`. Recovery PR #1334 is merged into CURRENT_MAIN, and its exact-main deploy `dep-daq3dkmgekts73be39i0` started within the post-merge SLA. Checkout, build, release manifest and Quality were PASS; Runtime startup nevertheless failed again with `SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING`, which proves that none of the accepted server-only management-token keys resolved a usable credential in the Render service environment. Production therefore remains truthful `PRODUCTION_DRIFT`, not PASS. No secret value is recorded. The UI continues to read `/healthz` at runtime.
- SEO issues #1233, #1252, #1254, #1258 and #1263 are terminal; no open `project:CAPITAL-AI-SEO` issue was returned in the fresh provider readback.
- A new current-state drift is explicit rather than silently repaired: `AppRoutes.tsx` no longer renders `/universe`, while `routeSeo.ts`, `sitemap.xml`, prerender and the server public-route allowlist still publish it. FE does **not** restore the removed client route; retirement of the stale projections remains owner-correct across FE/SEO/OPS.
- Documentary correlation resolves `CAPITAL-AI-DOC / PVC-03` with **zero executable active work items** on this generation: `WP-DOC-14..16` are terminal, `WP-DOC-17` is historical `NOT_APPLICABLE_FOR_IMPLEMENTATION`, WP-06A..E is terminal through #1131, repository-structure AUTO-01 is terminal through #1154, and Documentary Change Impact startup-failure remediation is terminal through #1310. Residual `status: active` claim/package markers are stale coordination evidence under `/AGENTS.md` and are shown only as a non-active integration ledger entry; they do not reactivate DOC work.
- Current integrated deltas now projected separately include SH-02.11 `RETRY_SAFE_OPERATION`, the pricing/public-visibility archive chain, FIN-SENT-01, the production `/roadmap` direct route, consent-gated GA4 wiring, #1331 Auth/Profile plus merged recovery #1334 as main-only/deploy-blocked, and both failed exact-main Render promotions as Production-drift evidence.

## FE-LANDING-TEMPLATE-01 — Landingpage design as public auxiliary-page template

**Canonical identity:** `FE-LANDING-TEMPLATE-01`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Scope:** Frontend presentation + canonical Branding Kit only; no productive PVC ownership  
**Status:** `DONE_MAIN / TERMINAL`  
**Baseline:** `main@adcd5609b0db58627fb2d89e58d32f7054baf918`

Fresh Owner direction replaces the historical dashboard-style template used by `/roadmap` with one reusable public-site template derived from the current productive Landingpage.

Implementation boundary:

- `LandingPageTemplate.tsx` provides the shared public-site frame/header/panel composition;
- `design-tokens.json#color.landingPage`, `font.landingPage` and `patterns.landingPage` extend the existing Branding Kit rather than creating a second design authority;
- Roadmap continues to be a read-only, non-authorizing projection;
- current `BrandLogo` / canonical `brandmark.json` geometry is reused;
- semantic asset/score/status colors and PDF/Social core roles are not redefined;
- open PR #1367 is an independent Dashboard runtime/performance writer and has no changed-file overlap with this slice.

**Exit:** SATISFIED — PR #1374 merged as `cb0012e7f38452eb638ed2e3affe5e74f0b44ed6`; Roadmap consumes `LandingPageTemplate` / `LandingPanel`, the old shared-`Card`/dashboard shell is absent from the Roadmap renderer, Branding Kit + CSS projection expose the productive Landingpage profile, and exact-head Governance/CI/Security validation passed.

## FE-ROADMAP-LIVE-01 — Branded Roadmap Live Dashboard

**Canonical identity:** `FE-ROADMAP-LIVE-01`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Scope:** read-only presentation/aggregation of canonical current-state evidence; no productive PVC ownership  
**Status:** `DONE_MAIN / TERMINAL`  
**Fresh baseline:** `main@adcd5609b0db58627fb2d89e58d32f7054baf918`  
**Branding contracts:** `docs/frontend/brandmark.json`, `docs/frontend/design-tokens.json`, `src/features/public/ui/frontend-port/components/BrandLogo.tsx`, `src/features/public/ui/LandingPageTemplate.tsx`, `src/features/public/ui/frontend-port/frontend-port.css`

Fresh Human/Owner direction requests a real `/roadmap` page that projects the current Roadmap and all actively processed work packages. The implementation remains a non-authorizing derived view:

- canonical task state remains in each owner-correct `docs/projects/<project>/ROADMAP.md` or exact provider-backed PR/branch evidence;
- the UI snapshot records an exact **correlation baseline** and is never a second task registry or a claim that repository main can be queried live from the browser;
- provider-backed PR/branch rows are shown only while fresh provider evidence supports them; terminal writers are removed instead of retained as stale work;
- `CapitalAiLogo` uses the canonical brandmark geometry; colors/typography/roadmap roles resolve from `design-tokens.json` and the existing CSS token projection;
- Production identity is read from same-origin `/healthz` and remains explicitly separate from repository correlation state;
- the owner-correct `/roadmap` server fallback is merged through PR #1319 and is represented as an integrated runtime surface, not an open OPS handoff;
- the SEO/Production integration ledger distinguishes `production-covered`, `repository-integrated`, `main-only`, `provider-gate` and `legacy-drift`; repository configuration or historical provider evidence never becomes a synthetic PASS;
- the current `/universe` mismatch is represented as **retirement work**, never as authority to restore the removed Client route.

**Exit:** exact-head FE tests/build are green; `/roadmap` continues to resolve through the existing client/server path; current-main/open-writer correlation remains PASS; the integration ledger matches the correlated repository/Production evidence; Human/CODEOWNER merge remains required.

**Terminal evidence:** PR #1335 merged as `8f5fff57613f183e0e1a2a8c8b41017338e63491`; the Landingpage-template chain #1374/#1376 is merged. Render deploy `dep-daqa9sh42hec738ulhcg` is live on `d28eff774f24ceab05c1d18268c9b12749a09fe5`; after Governance-only #1377, CURRENT_MAIN is `adcd5609b0db58627fb2d89e58d32f7054baf918` and Production remains a healthy cadence-conformant ancestor until the next 5-merge boundary. The historical exclusive FE claim is stale and is released by this bounded post-merge convergence slice; foreign-owner Roadmap states remain unchanged.

### FE-ROADMAP-LIVE-01 — SEO / Production convergence slice — 2026-09-23

Fresh Human/Owner direction extends the existing `FE-ROADMAP-LIVE-01` presentation without creating a new roadmap authority.

The derived dashboard now makes these states visible in one place:

1. **Active canonical work** — only current owner-roadmap identities or fresh Human direction.
2. **Repository-integrated** — merged/current-main implementation whose external provider state is still independent.
3. **Production-covered** — implementation known to be contained in the observed Production audit commit.
4. **Main-only / deploy-blocked** — merged after the observed Production commit or blocked by a failed promotion and therefore not represented as live until a later exact-SHA Production readback.
5. **Provider-gate** — GSC/GA4/GenAI or other provider evidence that cannot be inferred from repository wiring.
6. **Legacy drift** — old connections still advertised by technical SEO/server surfaces but no longer backed by the current productive Client surface.

The current SEO audit records no open SEO issue/PR lane, but it does keep the still-actionable WPs `WP-SEO-METRICS` and `WP-SEO-AI-VIS` held behind real read-only provider evidence. `SEO-UNIVERSE-LEGACY-RETIREMENT` is surfaced as a fresh drift finding: remove stale SEO/prerender/server publication owner-correctly; do not revive `/universe`.

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
