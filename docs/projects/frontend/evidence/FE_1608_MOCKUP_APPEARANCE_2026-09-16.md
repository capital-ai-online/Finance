# FE-1608-APPEARANCE — GOV-CHAT-079 implementation evidence

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` — cross-cutting presentation project  
**Primary Owner:** `CAPITAL-AI-FE`  
**Work package:** `GOV-CHAT-079 — 16.08 Mockup Visual Target / CAPITAL-AI-FE Foreign Execution`  
**Branch:** `agent/frontend-1608-mockup-appearance-20260916`  
**Start baseline:** `main@c58f662deee989f270d6968881644d284435d5bd`  
**Historical appearance provenance:** `src/index.css@c08a68bdfdeaa91cb8ba974b5a1829bf00fe61bb`  
**State:** `IMPLEMENTED_ON_BRANCH / EXACT_HEAD_VALIDATION_PENDING`

## Scope

This slice implements the Owner-approved 16.08 **appearance only** through the current canonical Frontend token and shared-presentation surfaces. It does not restore historical application code and does not change Auth, Consent, DATA, FINTECH, IAM, provider, billing, routing, scoring or production behavior.

Current-main remains the functional preservation floor. In particular, PR #1010's on-demand Public Analysis activation remains untouched in `src/features/public/ui/LandingPage.tsx`; the consumer inherits the canonical appearance through its existing `bg-background`, `brand-primary`, `border-border` and related token classes.

Open Draft PR #1011 is not a dependency. Its crypto workspace files are not part of this branch.

## Before → After

| Surface | Current-main before | Branch after | Semantic impact |
|---|---|---|---|
| Primary canvas | `#08080C` | `#18181B` | visual only |
| Generic border | `#252529` | `rgba(255,255,255,0.08)` | visual only |
| Capital Gold visual anchor | `#F9BF21` | `#F5C453` | visual hierarchy only; score-warning/commodity semantics stay current |
| Display font | Inter | Montserrat | typography only |
| Glass background | token `rgba(18,18,21,0.72)` / mixed runtime | `rgba(10,10,10,0.40)` | visual only |
| Glass border | generic border | `rgba(255,255,255,0.10)` | visual only |
| Glass blur | 12px | 12px | unchanged target |
| Panel radius | mixed `.75rem`/1rem | canonical 1rem glass radius | visual only |
| Decorative cyan | no explicit decorative role | `#0DDDDD` | decoration only |
| Decorative purple | semantic accent reused | `#B026FF` separate decorative role | decoration only |
| Min shared button target | `sm` = 36px | `sm` = 44px | accessibility/presentation only |
| Reduced motion | supported | preserved | no behavior regression |

## Semantic preservation

The following current-main values deliberately remain unchanged even though they differ from historical 16.08 colors:

- Crypto asset semantic: `#8D26FF`;
- Stock asset semantic: `#44DE88`;
- Index asset semantic: `#60A5FA`;
- Forex asset semantic: `#E879F9`;
- score best: `#44DE88`;
- score worst: `#F87171`;
- semantic info/data: `#22D3EE`;
- missing pattern evidence remains omitted (`noPlaceholder=true`).

This prevents a visual restoration from becoming a financial/domain semantic rollback.

## Shared appearance projection

- `docs/frontend/design-tokens.json` remains the only token authority.
- `src/index.css` projects that authority into runtime CSS variables and shared glass/button/shell classes.
- `Card` consumes `ui-panel` / `ui-panel--elevated` instead of its own neutral palette.
- `Button` consumes shared variant classes and raises the small control target to 44px.
- `AppShell` consumes `app-shell-frame`; its component API and composition behavior are unchanged.
- `NeuralBackground` consumes explicit decorative Gold/Cyan/Purple variables and remains `pointer-events-none` / `aria-hidden`.
- the active Public Landing consumer remains source-unchanged and therefore preserves PR #1010 event logic while inheriting the updated canonical token projection.

## Responsive / accessibility boundary

- mobile panel padding/gaps tighten under `max-width: 640px` without changing component behavior;
- no horizontal-overflow rule is loosened;
- body background attachment falls back to normal scrolling on mobile;
- all shared Button sizes now meet the 44px target;
- focus outline remains 2px with 4px offset, now using the Owner-approved Capital Gold;
- reduced-motion disables decorative animations/transitions as before;
- decorative network layers remain pointer-transparent.

## Validation

Materialized focused guard:

`tests/unit/frontend1608AppearanceContract.test.ts`

It verifies:

1. exact Owner-approved appearance tokens;
2. preserved current financial semantic colors;
3. runtime CSS projection and mobile/reduced-motion gates;
4. shared Card/Button/AppShell use the shared appearance layer;
5. the active Public Landing page retains PR #1010 on-demand activation and no `IntersectionObserver`;
6. neural decoration cannot become financial semantic authority.

### Truthful execution state

- focused test: `NOT RUN` pre-PR — GitHub Connector has no repository checkout/test executor in this chat;
- TypeScript: `NOT RUN` pre-PR;
- Frontend architecture validator: `NOT RUN` pre-PR;
- Production build: `NOT RUN` pre-PR;
- browser/mobile visual evidence: `NOT RUN` pre-PR;
- hosted checks: intentionally deferred until after Draft PR creation according to the current lifecycle and cost policy.

`NOT RUN` is not classified as `PASS`.

## Supabase / provider boundary

This appearance slice performs no Supabase mutation. Read-only correlation confirmed project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`) is `ACTIVE_HEALTHY` in `eu-west-1` and exposes API URL `https://ryzywoktpmyhwzxmstyu.supabase.co`. The connected Supabase action surface does not expose the project's Auth Site URL / Redirect URL allow-list, so those settings are not claimed as VERIFIED here and are not modified.

## Exit status

Repository materialization: `PASS_PENDING_EXACT_HEAD_CORRELATION`.

Still required before Draft PR creation:

- refresh then-current `main` and open PRs/writers;
- compare final branch head against `main` and PR #1011 file/semantic scope;
- read current PR template and production identity;
- classify all unavailable checks truthfully;
- create Draft only for final `CREATE-CORRELATION=PASS`.

Human/CODEOWNER-only merge and separate production/deployment authority remain unchanged.
