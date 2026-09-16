# GOV-CHAT-079 — 16.08 Mockup Visual Target / CAPITAL-AI-FE Foreign Execution

**State:** `OWNER_SCOPE_CAPTURED / GOV_REFERENCE_MATERIALIZED / FE_SUCCESSOR_HELD_UNTIL_GOV_PR_TERMINAL`  
**Priority:** `5/5 — strategic visual restoration`  
**Owner direction date:** `2026-09-16`  
**Executing Project for this GOV slice:** `CAPITAL-AI-GOV`  
**Executing Project Folder:** `docs/projects/governance/`  
**Executing PVC:** `PVC-05 — Platform Director`  
**Target Project:** `CAPITAL-AI-FE`  
**Target Project Folder:** `docs/projects/frontend/`  
**Target Primary Productive PVC:** `N/A` — Frontend is cross-cutting and owns no productive PVC solely by presentation  
**Target Primary Owner:** `CAPITAL-AI-FE`  
**Foreign-execution authority:** `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION` / `CTRL-GOV-OPS-FOREIGN-EXEC-001`  
**Trust root:** `/AGENTS.md@current-main`  
**GOV reference baseline:** `main@ae86cb625d742119c00b1dc80c3fe4bfb0b0454f`  
**Historical visual provenance:** `src/index.css@c08a68bdfdeaa91cb8ba974b5a1829bf00fe61bb` / blob `bf980fc95a316fcfea5983b12638300896989fef`  
**Machine-readable companion:** `GOV_CHAT_079_1608_MOCKUP_FOREIGN_EXECUTION_2026-09-16.json`

## 1. Owner objective

Restore the CAPITAL-AI frontend **appearance** to the approved 16.08 visual language represented by the 2026-09-16 mockup, while retaining the complete current functional, security, consent, data, scoring, routing, authentication, provider and business-logic state from then-current `main`.

This is an appearance-only restoration. It is **not** a source rollback, historical branch resurrection or permission to restore historical logic.

The target is therefore:

```text
CURRENT-MAIN LOGIC / CONTRACTS / SECURITY / DATA / CONSENT / ROUTING
+
16.08-INSPIRED VISUAL LANGUAGE AND APPROVED MOCKUP COMPOSITION
```

not:

```text
CHECKOUT / RESTORE APPLICATION CODE FROM 16.08.2026
```

## 2. Authority and ownership boundary

The current repository already has one canonical Frontend architecture and one canonical design-token authority:

- `docs/frontend/FRONTEND_ARCH.md` — Frontend presentation/source-tree architecture;
- `docs/frontend/design-tokens.json` — machine-readable Branding/Design-Token authority;
- `docs/frontend/FRONTEND_ROADMAP.md` — detailed Frontend migration/visual-recovery sequencing;
- `docs/projects/frontend/ROADMAP.md` — canonical project execution projection.

This GOV file is **Owner-decision evidence and a bounded execution specification only**. It MUST NOT become a second design system, second token registry, second Frontend roadmap, second runtime architecture or second business/domain authority.

Under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`, Governance may execute the bounded successor implementation, but Target Project, branch/PR project identity, Frontend architecture, design-token authority and domain acceptance remain `CAPITAL-AI-FE`-owned. Human/CODEOWNER-only merge and protected-production boundaries remain unchanged.

## 3. Current-main preservation floor

The successor implementation MUST start from fresh then-current `main`, never from the historical 16.08 commit.

The GOV baseline already includes Human-merged PR #1008, which restored Landing-Cockpit/Mobile-Sideboard behavior. The FE successor MUST preserve that current behavior, including the current Public Analysis sideboard initial-open/mobile affordance and accessibility semantics. A visual restyle MUST NOT undo those functional changes.

Any later current-main changes merged before the successor starts are equally part of the preservation floor and require fresh correlation.

## 4. Historical 16.08 visual provenance

The verified historical `src/index.css` at commit `c08a68bdfdeaa91cb8ba974b5a1829bf00fe61bb` provides reproducible visual provenance for the requested 16.08 language.

### 4.1 Core historical values to recover visually

| Role | Target visual value |
|---|---|
| Primary canvas | `#18181B` |
| Generic light border | `rgba(255, 255, 255, 0.08)` |
| Glass-panel border | `rgba(255, 255, 255, 0.10)` |
| Glass-panel background | `rgba(10, 10, 10, 0.40)` |
| Glass blur | `12px` |
| Glass radius | `1rem` |
| Default panel padding | `1.5rem` |
| Capital Gold light | `#FFF2B2` |
| Capital Gold | `#F5C453` |
| Capital Gold dark | `#D4A017` |
| Capital Gold muted | `#8A640F` |
| Decorative cyan | `#0DDDDD` |
| Decorative purple | `#B026FF` |
| Body/UI font | `Poppins` |
| Display/headline font | `Montserrat` |
| Technical/score font | `JetBrains Mono` |
| Section gap | `2rem` |
| Card gap | `1.5rem` |
| Minimum interactive target | `44px` |
| Focus ring | `2px #F5C453`, `4px` offset |

Reduced-motion behavior from the current Frontend architecture remains mandatory. Decorative animations may use the quieter 16.08 gold/neural character but MUST stop or simplify under `prefers-reduced-motion`.

### 4.2 Compatibility with current semantic tokens

The visual restoration changes the **appearance language**, not financial/domain semantics.

The FE successor MAY update the canonical visual/branding values inside `docs/frontend/design-tokens.json` when required to implement this Owner direction, but MUST preserve current semantic roles and product decisions unless a separate Owner/domain decision changes them. In particular:

- current asset-class semantic identities remain authoritative;
- BUY/SELL / best/worst / ready/reject semantics remain current-contract driven;
- `Bond/Anleihen` remains disabled for productive Frontend presentation where current contracts say so;
- missing pattern evidence remains omitted rather than synthesized;
- cyan/purple used for the 16.08 look are decorative or their already-authorized semantic roles, never new financial meaning;
- no deprecated `aif-*` namespace becomes a new source of truth merely because historical CSS used those names.

The new Owner direction supersedes earlier presentation choices only where they directly conflict with the approved visual target. It does not silently supersede unrelated Universe/domain rules.

## 5. Approved mockup composition contract

The approved mockup is represented reproducibly by the following composition contract. Sample names, amounts, prices, percentages and market entries visible in the concept are **layout placeholders only** and MUST NOT be copied into production as synthetic financial truth.

### 5.1 Desktop composition

1. **Application frame**
   - near-black / charcoal canvas with restrained warm-gold ambient glow;
   - premium, spacious composition rather than dense utility UI;
   - subtle gold orbital/neural decoration may sit behind the application chrome without reducing legibility.

2. **Left navigation rail**
   - persistent dark glass/solid hybrid sidebar on desktop;
   - brand mark at the top;
   - vertically grouped primary navigation with icon + text;
   - selected item uses a restrained gold-tinted surface/border, not a full bright fill;
   - optional lower informational/premium panel only if supported by current product contracts; do not invent paid entitlements.

3. **Top application toolbar**
   - compact top bar aligned with the content frame;
   - search/command affordance only where an existing current feature supports it;
   - current notification/profile/session controls retain their existing logic;
   - chrome is dark, glassy and visually subordinate to content.

4. **Hero / welcome band**
   - strong display heading with selective gold emphasis;
   - short supporting copy;
   - cinematic dark-gold decorative visual or existing owned/shared visual treatment;
   - no dependency on unlicensed stock imagery and no external asset required merely to satisfy styling.

5. **KPI / state-card row**
   - three to four responsive glass cards when current contracts provide those surfaces;
   - large primary value, small label/status, restrained sparkline/icon treatment;
   - gold is the premium/focus anchor; purple/cyan/semantic colors are secondary;
   - current missing/unavailable/partial states remain explicit and are never replaced with fabricated numbers.

6. **Primary dashboard grid**
   - dominant analysis/performance visualization area on the left or main column;
   - secondary market/list/context panel beside it on wide viewports;
   - rounded glass panels, thin light borders, generous internal whitespace;
   - existing chart/data contracts remain authoritative.

7. **Lower insight / intelligence area**
   - modular cards for already-existing AI/analysis/evidence surfaces;
   - premium branded callout/panel may be used as a visual balancing element;
   - labels and status remain driven by current evidence/contracts, not by mockup placeholder language.

### 5.2 Mobile composition

1. compact Capital AI header with existing current controls;
2. stacked hero/welcome area;
3. one dominant primary metric/state card when current data supports it;
4. compact secondary metric cards in an adaptive row/grid;
5. stacked market/analysis/list panels with the same glass/gold vocabulary;
6. mobile navigation uses the current canonical routing/navigation contract and may be presented as a bottom bar/drawer only where that preserves existing behavior;
7. all interactive targets remain at least `44px`, touch-safe and keyboard/focus accessible where applicable;
8. no horizontal overflow, frozen overlay or pointer-blocking decorative layer.

### 5.3 Visual character

The overall visual result MUST read as:

```text
premium fintech
+ dark charcoal depth
+ Capital Gold hierarchy
+ restrained cyan/purple intelligence/data accents
+ glass surfaces
+ generous spacing
+ soft neural/orbital atmosphere
+ mobile/desktop parity
```

It MUST NOT read as a bright neon arcade UI, generic admin template, flat gray enterprise CRUD screen or a pixel-for-pixel resurrection of obsolete 16.08 application logic.

## 6. Successor FE implementation scope

After the GOV reference PR reaches a terminal **Human-merged** outcome, foreign-project execution proceeds only after refreshing then-current `main`, open PRs/writers, Target Project mapping, FE Roadmaps, `FRONTEND_ARCH.md`, design tokens and materially applicable contracts.

The successor uses a **fresh current-main-based FE target branch** whose branch slug is `frontend`. Governance may be the executing project, but repository identity remains Target Project `CAPITAL-AI-FE`.

### Phase A — Canonical visual token materialization

- update `docs/frontend/design-tokens.json` only for visual values required by this Owner target;
- update `src/index.css`/theme projection to consume canonical values;
- retain current semantic asset/score/status roles;
- introduce no duplicate token registry or local component-level hardcoded palette except justified rendering math derived from canonical tokens.

### Phase B — Shared appearance primitives

Restyle existing shared primitives rather than creating parallel replacements:

- panels/cards;
- buttons/focus states;
- navigation surfaces;
- brand/logo treatment;
- shared background/neural visuals;
- typography and spacing;
- shell/header/sidebar chrome.

Existing behavior/API contracts remain unchanged.

### Phase C — Current application consumers

Apply the same visual system to current canonical presentation surfaces, prioritizing the active composition path:

- current application shell/header/navigation;
- Dashboard Home / MyWorkspace surfaces that exist on then-current main;
- Public Analysis / Landing cockpit including the PR #1008 behavior floor;
- current canonical analysis/ranking/market cards where presentation alignment is needed.

Do not reactivate archived features or copy Legacy Dashboard business logic merely to visually fill the mockup.

### Phase D — Responsive/mobile parity

- mobile stacking and density;
- current drawer/sideboard/bottom-navigation presentation as permitted by current routing/navigation contracts;
- touch target, viewport, scroll, pointer and overlay behavior;
- reduced-motion behavior;
- no frozen page after opening/closing menus or consent/settings surfaces.

### Phase E — Evidence and exact-head validation

Validate on the exact final FE branch head using the smallest sufficient checks first. Relevant checks include, when available on that head:

- focused unit/regression tests for changed Frontend consumers;
- Frontend architecture/design-token validation;
- TypeScript;
- build;
- browser evidence for desktop and mobile;
- accessibility checks for focus, non-color-only semantics, contrast and reduced motion.

`NOT RUN`, `SKIPPED`, unavailable browser evidence or provider-dependent evidence MUST remain truthfully classified and never be reported as PASS.

## 7. Hard non-goals / protected invariants

The successor MUST NOT change behavior merely to match the picture. Unless independently required by then-current authority, this package prohibits changes to:

- API contracts, data providers or provider routing;
- scoring/ranking/model algorithms or financial semantics;
- synthetic financial values or placeholder production data;
- authentication/session/IAM/AuthZ behavior;
- entitlement/billing/payment logic;
- CookieConsent/Consent state logic, GA4/AdSense gating or CMP semantics;
- application routing semantics or route availability;
- Security/Compliance gates;
- production/deployment settings;
- secrets, OAuth, connector permissions or external integrations;
- disabled/archived feature activation;
- Human/CODEOWNER-only merge authority.

Presentational wrappers may be refactored only where required for responsive composition and only when observable event/API/route/session/data semantics remain unchanged.

## 8. Candidate changed-file envelope for the FE successor

This is a correlation envelope, not permission to mutate every listed file.

Likely in-scope surfaces include:

```text
docs/frontend/design-tokens.json
src/index.css
src/shared/ui/**
src/shared/branding/**
src/shared/visuals/**
src/app/AppShell.tsx
src/app/dashboard/**          # presentation/composition only
src/app/public/**             # presentation/composition only
src/features/**/ui/**         # only consumers actually needed for visual parity
docs/projects/frontend/ROADMAP.md
docs/frontend/** evidence/visual documentation
focused Frontend tests
```

If implementation requires changes outside this envelope, the executor MUST first re-resolve ownership/authority. A foreign Primary Owner or protected-mutation boundary splits the work rather than being absorbed into the FE branch.

## 9. Acceptance / exit gates

The FE successor is complete only when all applicable conditions below are proven on its exact head:

1. the canonical theme presents the 16.08 visual language described in sections 4–5;
2. desktop and mobile composition are recognizably aligned with the approved mockup rather than merely recolored;
3. current main behavior, including post-#1008 current UI behavior, remains functionally intact;
4. no mockup placeholder value becomes production financial/domain truth;
5. current data unavailable/partial/stale/error states remain explicit;
6. current semantic asset/score/status rules remain intact unless separately owner-authorized;
7. 44px target sizing, visible focus and reduced-motion behavior remain intact;
8. no pointer-blocking decorative layer, frozen viewport or mobile horizontal overflow is introduced;
9. no parallel design system, token registry, frontend root, scoring/data authority or routing authority is introduced;
10. relevant validation is truthfully recorded and final current-main/open-writer/create-correlation is `PASS` before Draft PR creation.

## 10. Ordered automated execution lane

This work package intentionally uses the existing serial PR lifecycle instead of stacked branches or a shadow queue:

```text
GOV reference materialization on current-main branch
→ final GOV create-correlation PASS
→ Draft GOV PR
→ Human/CODEOWNER review + Human merge or close
→ terminal outcome detected
→ refresh then-current main / open writers / Project-PVC / FE Roadmaps / FE architecture
→ if GOV PR merged: create fresh frontend target branch
→ GOV executor performs bounded CAPITAL-AI-FE foreign implementation
→ complete all immediately executable appearance-only phases on one coherent FE branch
→ exact-head validation
→ final FE create-correlation PASS
→ Draft PR title: [CAPITAL-AI-FE] [ChatGPT] 16.08-Mockup-Design visuell wiederherstellen
→ stop at Human/CODEOWNER merge boundary
```

If the GOV PR closes without merge, no successor assumes this package as current-main payload; the queue/scope is recomputed from then-current repository truth.

No FE successor branch is pre-created while the GOV predecessor remains unintegrated. No agent self-merges or enables auto-merge.

## 11. Automation contract

When the active execution host can observe the GOV PR terminal outcome using an already available authorized automation capability, the continuation may be registered against the concrete GOV PR. The continuation action is:

```text
IF PR is still open:
  no successor work
ELSE IF PR closed without merge:
  recompute from then-current main; do not assume package payload
ELSE IF PR Human-merged:
  refresh then-current repository truth
  resolve CAPITAL-AI-FE target ownership and applicable contracts
  re-correlate all overlaps
  create a fresh target-identity frontend branch
  implement this appearance-only package
  validate truthfully
  create the bounded Draft FE PR only for final create-correlation PASS
  stop before merge
```

The automation is an execution transport only. It does not create new Governance authority, a persistent repository queue, merge authority or production-mutation authority.

## 12. GOV-slice exit

The current GOV slice is complete when:

- this bounded Owner target is reproducibly captured;
- historical 16.08 visual provenance and current-main preservation floor are explicit;
- Target Project/Owner/foreign-execution identities are explicit;
- the machine-readable companion is present and states `nonAuthorizing: true`;
- the implementation/validation/non-goal/serial-successor contract is explicit;
- no Frontend runtime/design implementation has been smuggled into the GOV reference branch;
- final GOV current-main/open-writer/create correlation passes and the Draft GOV PR is created using the canonical current-main PR template.
