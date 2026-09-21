# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-21 — PR #1206 merged; upstream graphical source re-correlated; responsive promotion defect identified from current main  
**Baseline:** `main@d6be9db867d058d057c39df6e93e49fe3c875145`  
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

## FE-LF-02-PVC-RESPONSIVE-ADAPTER — Device-native promotion contract

**Canonical identity:** `FE-LF-02-PVC-RESPONSIVE-ADAPTER`  
**Resolved Owner:** `CAPITAL-AI-FE`  
**Project/PVC relationship:** `presentation_consumer` across applicable `PVC-01..18`; no productive PVC ownership transfer  
**Status:** `IMPLEMENTED_PENDING_EXACT_HEAD_EVIDENCE`  
**Finding:** the pinned FRONTEND source is synchronized correctly, but its source `App.tsx` is a design-preview shell whose desktop default remains an iPhone frame (`sm:max-w-[412px]`). Promoting that shell unchanged therefore produces the wrong website/desktop presentation.

### Scope

- preserve the upstream source and hash lock unchanged;
- require a FE-owned responsive adapter for every runtime promotion;
- render the canonical root against the actual mobile/tablet/desktop viewport;
- remove source preview controls, phone chrome and fixed 412px desktop framing from production presentation;
- convert mobile-only card carousels to desktop grids at the FE adapter layer without changing source data or productive domain semantics;
- expose PVC units as presentation-consumer review scope so FE can remediate rendering/interaction findings while Primary Owners retain domain truth.

### Dependencies

- `/AGENTS.md@CURRENT_MAIN`;
- `docs/projects/PROJECT_VALUE_CHAIN.md` Primary Owner mapping;
- pinned `SvenKulessa/FRONTEND` graphical source and source lock;
- Finance branding tokens and accepted Frontend architecture;
- owner-correct contracts from any PVC whose output is rendered.

### Exit evidence

1. `LandingPage` identifies the FE-owned device-native responsive shell.
2. Runtime CSS has explicit mobile-first, tablet (`>=640px`) and desktop (`>=1024px`) behavior.
3. Desktop production presentation is not constrained to the upstream 412px iPhone frame.
4. Upstream preview controls/status chrome are not exposed as canonical website UI.
5. Desktop card collections use responsive grid behavior while the source components remain hash-verifiable.
6. `.github/frontend-upstream-sync.json` requires the responsive adapter and forbids direct preview-shell promotion.
7. Unit contracts verify the promotion boundary and PVC presentation-consumer relationship.
8. Exact-head required checks pass before Human/CODEOWNER merge.

### Acceptance criteria

The same synchronized graphical architecture is usable on phone, tablet and desktop through FE-owned adaptation; no productive PVC/domain authority moves into Frontend; future source syncs cannot be promoted by treating an upstream device-preview shell as the production viewport contract.

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
