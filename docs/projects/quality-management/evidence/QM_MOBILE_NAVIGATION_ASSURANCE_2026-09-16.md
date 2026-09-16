# QM Mobile Navigation Assurance — 2026-09-16

**Project:** `CAPITAL-AI-QM`  
**Project folder:** `docs/projects/quality-management/`  
**Execution prompts:** `QM-MOBILE-NAVIGATION-DETECTION-01`, `QM-MOBILE-NAVIGATION-ROUTING-02`, `QM-MOBILE-NAVIGATION-VERIFICATION-03`  
**Repository:** `capital-ai-online/Finance`  
**Source identity:** `main@28579c54f2bf70fd79330c96bad4551dd29b64b8`  
**Status:** `PARTIAL_EXECUTION / SOURCE_FINDING_CONFIRMED / BROWSER_EVIDENCE_NOT_AVAILABLE`  

## 1. Authority and execution boundary

This assurance slice executes under the current `AGENTS.md` trust root and the active technical quality boundary `ESS-0005`. `CAPITAL-AI-QM` has no productive PVC ownership and does not implement Frontend remediation in this branch.

The proposed QM-V2 lifecycle / finding-routing authority is not treated as already active. Owner references below are therefore evidence-backed routing metadata for the explicit owner request, not an assertion that a proposed governance lifecycle has already become authoritative.

`NOT_RUN` and `NOT_AVAILABLE` are never promoted to `PASS`.

## 2. Baseline refresh

The prompt-observed SHA `c58f662deee989f270d6968881644d284435d5bd` is stale. Execution was refreshed to current `main@28579c54f2bf70fd79330c96bad4551dd29b64b8` before branch creation.

The refreshed baseline materially changes the inspected interaction surface compared with the earlier snapshot: current main contains newer `DashboardNavigation`, `PublicAnalysisWorkbench`, `LandingPage`, `AppRoutes`, and `SessionComposition` work. All conclusions in this evidence refer only to `28579c54...` unless a row is explicitly marked historical.

## 3. Available execution surfaces

| Surface | Result | Assurance use |
|---|---|---|
| Current-main repository/source readback | `AVAILABLE` | Source identity, route inventory, interaction topology, static defect proof |
| Existing Vitest/source regression surfaces | `AVAILABLE_AS_REPOSITORY_CONTENT` | Coverage inspection only; not re-executed in this connector session |
| Authorized interactive browser/touch harness | `NOT_AVAILABLE` | No synthetic PASS for touch, pointer interception, visual response, browser console, network, Long Tasks or actual INP |
| Existing repository browser E2E harness | `NOT_DETECTED` | No QM-local foreign dependency added |
| External mobile performance audit | `NOT_AVAILABLE` | Audit surface required additional entitlement; audit did not execute and consumed no usage |
| Production/mobile post-deploy interaction readback | `NOT_AVAILABLE` | Production Acceptance is not inferred from source or repository tests |

## 4. Required device matrix

The required profiles are preserved exactly. Because no authorized browser execution surface is available in this run, runtime interaction rows remain `NOT_AVAILABLE`; source-level findings are recorded separately and do not masquerade as device execution.

| Device | Viewport | Touch | Initial load | visible taps | repeat tap | overlay then navigate | back/forward | console/network/long-task capture | Status |
|---|---:|---:|---|---|---|---|---|---|---|
| `android_standard` | 390x844 | yes | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | `NOT_AVAILABLE` |
| `android_small` | 360x800 | yes | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | `NOT_AVAILABLE` |
| `narrow_mobile` | 320x700 | yes | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | `NOT_AVAILABLE` |
| `desktop_control` | 1440x900 | no | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | NOT_AVAILABLE | `NOT_AVAILABLE` |

## 5. Current-main navigation inventory

### Public/top-level route surface

Current `AppRoutes` resolves these primary path-level surfaces from `window.location.pathname`: `/`, `/login`, `/datenschutz`, `/impressum`, `/agb`, `/learning-platform`, `/dashboard`, and `/media-studio`, with unknown/private paths redirected according to session state.

The public Landing/Workbench currently exposes explicit links or controls for login, learning, analysis/workbench activation and public tool selection. Public heavy analysis tools remain lazy-loaded at the app/workbench boundary.

### Authenticated Dashboard surface

The canonical drawer exposes the main hub and analysis items plus the Asset-Universes accordion. Current main includes visible presentation entries for Dashboard, Myworkspace, Learning, Universe rankings, Buffett Value Check, Profile & Settings, Subscriptions, Multi-Asset Universe, Market Screener, Charts, Price Alerts, Backtest, Sentiment, Commodities, Social Media and asset-universe sub-actions. Admin entries are conditional.

## 6. Confirmed QM finding

### QM-MNAV-001 — Dashboard history is not bound to internal view navigation

**Class:** `ROUTER_REGRESSION`  
**Secondary verification concern:** `ACCESSIBILITY_NAVIGATION_FAILURE` for the required Back/Forward interaction gate  
**Evidence type:** deterministic current-main source topology, not a claimed live-device reproduction  
**Owner:** `CAPITAL-AI-FE`  
**PVC:** `N/A — cross-cutting Frontend presentation/interaction`  
**Routing marker:** `[QUALITY_HANDOFF -> CAPITAL-AI-FE | N/A]`

#### Root cause

`src/app/dashboard/Dashboard.tsx` owns the authenticated sub-view as local React state:

- `const [activeView, setActiveView] = useState<DashboardView>('dashboard')`
- `navigateTo(view)` only calls `setActiveView(view)` and scrolls to the top.

`src/app/dashboard/DashboardNavigation.tsx` calls the supplied `onNavigate(view)` callback and closes the drawer; it does not create a browser-history entry.

`src/app/routing/AppRoutes.tsx` reads the pathname once into `currentPath` and does not bind authenticated Dashboard sub-views to a pathname/search/hash/history projection.

The only observed `window.history.replaceState(...)` inside the Dashboard is a payment-query cleanup and does not encode the active Dashboard view.

Therefore an internal transition such as `Dashboard -> Myworkspace -> Charts` does not establish browser-history state for those view transitions. The verification requirement `browser_back_forward_functional` cannot be satisfied by the current implementation topology for internal Dashboard views.

#### Affected files / symbols

- `src/app/dashboard/Dashboard.tsx::activeView`
- `src/app/dashboard/Dashboard.tsx::navigateTo`
- `src/app/dashboard/DashboardNavigation.tsx::navigate`
- `src/app/routing/AppRoutes.tsx::currentPath`

#### Deterministic source reproduction

1. Start from authenticated `/dashboard` with `activeView='dashboard'`.
2. Trigger a visible drawer item such as `Myworkspace`; `navigateTo('myworkspace')` mutates only React state.
3. Trigger another internal view such as `Charts`; `navigateTo('charts')` again mutates only React state.
4. No corresponding `history.pushState`, route URL, query or hash identity is created for either state transition.
5. Browser Back/Forward therefore has no Dashboard-view history entries to restore.

**Runtime duration / INP measurement:** `NOT_AVAILABLE`  
**Console/network/Long Task evidence:** `NOT_AVAILABLE`  
**Current finding status:** `FAIL` for the required internal Dashboard Back/Forward contract based on source topology; no claim is made that this finding itself reproduces a page freeze.

#### Expected behavior

Internal navigation that is presented to the user as a navigable Dashboard destination must have one canonical history representation, so Back/Forward restores the prior/next visible Dashboard destination without introducing a second Frontend router, bypassing auth/consent/security contracts or requiring a full-page reload for each internal view.

#### Frontend remediation boundary

Remediation belongs to `CAPITAL-AI-FE`. The FE owner should bind internal Dashboard view transitions to the existing canonical routing/history authority rather than creating a second router. The implementation choice may use the existing route surface or a single consolidated routing model, but must preserve IAM, consent, entitlement and domain boundaries.

A regression test is required before closure and must cover at minimum:

- mobile touch navigation;
- desktop control navigation;
- two or more consecutive route/view transitions;
- repeat interaction;
- browser Back and Forward restoration;
- error/fallback path;
- no duplicate action from one tap.

## 7. Runtime conditions inspected but not proven

### Pointer / overlay block

`DashboardNavigationDrawer` contains a full-screen overlay and a modal panel while open and restores body overflow in effect cleanup. Existing source regression tests assert the presence of modal semantics, focus handling and scroll-lock cleanup. They do **not** execute a real touch sequence or prove that the Motion exit interval cannot intercept a rapid follow-up tap.

**Status:** `NOT_AVAILABLE` — no pointer-blocking defect is asserted and no PASS is granted.

### Public workbench mobile sideboard

Current main uses a compact/expandable public sideboard. Tool buttons are 44px-class targets and tool modules are lazy-loaded. This source shape is compatible with the desired Mobile UX but does not prove touch responsiveness or absence of a freeze.

**Status:** `NOT_AVAILABLE` for actual touch/freeze behavior.

### Main-thread / Long Task / INP

Current repository work has reduced several known critical-path couplings, and an open FE PR (`#1029`) further targets the public scorer critical path. No PerformanceObserver/DevTools/browser trace was available in this run.

**Status:** `NOT_AVAILABLE` for measured Long Tasks, main-thread blocking and mobile INP. No current `MAIN_THREAD_BLOCKING` or `PERFORMANCE_REGRESSION` finding is opened from unmeasured timing.

### Consent preference interaction

Current consent configuration declares `disablePageInteraction: false` and provides a persistent settings control, but no real browser sequence was available to verify open -> save -> close -> reopen -> navigate -> reload behavior.

**Status:** `NOT_AVAILABLE` for runtime verification.

## 8. Open-PR correlation

At final pre-write correlation, the active writers were:

- PR `#1029` — `CAPITAL-AI-FE`, public scorer critical-path split; runtime files are outside this QM evidence file. It reinforces that current mobile/perceived-performance validation must be repeated after the FE change reaches its terminal state.
- PR `#1022` — `CAPITAL-AI-GOV`, governance/instruction consolidation; no file overlap with this QM evidence file. Until merged, current-main `AGENTS.md` remains the trust root used here.

No open PR was found modifying `docs/projects/quality-management/evidence/QM_MOBILE_NAVIGATION_ASSURANCE_2026-09-16.md`.

## 9. Verification-03 state

| Verification gate | Status | Reason |
|---|---|---|
| all primary navigation targets reachable | `NOT_AVAILABLE` | requires real browser interaction |
| all visible navigation taps respond | `NOT_AVAILABLE` | requires touch/browser evidence |
| no reproduced page freeze | `NOT_AVAILABLE` | absence cannot be proven without runtime matrix |
| no pointer-blocking overlay after close | `NOT_AVAILABLE` | requires pointer hit-testing during/after overlay lifecycle |
| mobile drawer open/close repeatable | `NOT_AVAILABLE` | source coverage exists, runtime sequence absent |
| browser back/forward functional | `FAIL` | current Dashboard internal view navigation has no history projection |
| settings open/close repeatable | `NOT_AVAILABLE` | runtime sequence absent |
| consent preferences reopenable | `NOT_AVAILABLE` | runtime sequence absent |
| login navigation functional | `NOT_AVAILABLE` | runtime sequence absent |
| analysis navigation functional | `NOT_AVAILABLE` | runtime sequence absent |
| reload does not leave application stuck | `NOT_AVAILABLE` | runtime sequence absent |
| exact-head repository tests | `NOT_RUN` in this QM branch before PR | connector source readback is not test execution |
| production mobile acceptance | `NOT_AVAILABLE` | post-deploy browser readback required |

## 10. Exit-gate result

`QM-MOBILE-NAVIGATION-DETECTION-01`: **PARTIAL / NOT CLOSED**. The route and interaction surfaces were inventoried against exact current main and one source-proven routing defect was identified, but the mandatory real Mobile Touch matrix could not be executed on the available surfaces.

`QM-MOBILE-NAVIGATION-ROUTING-02`: **BOUNDED HANDOFF RECORDED** for `QM-MNAV-001` to `CAPITAL-AI-FE`; no remediation is implemented inside QM.

`QM-MOBILE-NAVIGATION-VERIFICATION-03`: **NOT RUN TO CLOSURE**. Independent retest must occur after FE remediation and after an authorized browser/touch execution surface is available. The finding cannot close until exact-head evidence covers all required device and interaction dimensions.

## 11. Next executable handoff

1. `CAPITAL-AI-FE` resolves `QM-MNAV-001` without a second routing authority and adds regression coverage for internal history semantics.
2. If no authorized browser harness is available by then, the required browser-E2E addition is owner-routed to `CAPITAL-AI-FE`; QM does not add the foreign dependency itself.
3. QM reruns Verification-03 on the exact remediation PR head across `390x844`, `360x800`, `320x700` and desktop `1440x900`, including first/second/rapid tap, navigate-away/back, scroll+navigate, overlay close+navigate, console/rejection/network capture, Long Tasks and post-deploy readback.
4. Only zero reproduced freezes, zero blocked required navigation, zero unhandled runtime errors and complete exact-head evidence may produce `PASS`.