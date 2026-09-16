# FE-1608-APPEARANCE — GOV-CHAT-079 implementation evidence

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` — cross-cutting presentation project  
**Primary Owner:** `CAPITAL-AI-FE`  
**Work package:** `GOV-CHAT-079 — 16.08 Mockup Visual Target / CAPITAL-AI-FE Foreign Execution`  
**Branch:** `agent/frontend-1608-mockup-appearance-20260916`  
**Current baseline:** `main@bea9373811202aef98f3ad8ffd53dba99d37c453`  
**Historical appearance provenance:** `src/index.css@c08a68bdfdeaa91cb8ba974b5a1829bf00fe61bb`  
**State:** `IMPLEMENTED_ON_DRAFT_PR / HOSTED_VALIDATION_IN_PROGRESS`

## Scope

The original slice materialized the Owner-approved 16.08 appearance through the current canonical Frontend token and shared-presentation surfaces. A subsequent explicit Human/Owner direction expanded the same coherent Frontend presentation package to restore current Universe-platform presentation surfaces without restoring historical application authority or inventing DATA/FINTECH semantics.

The expanded Frontend-owned scope now includes:

- the 16.08 visual contract through the existing token authority;
- Vocabulary as a modern `Universe Knowledge Grid`, still read-only over the canonical Vocabulary registry;
- visible asset-class identities for Aktien, Indizes, Forex, Krypto and Rohstoffe in the current dashboard sideboard;
- preservation of evidence-backed Pattern badges and their text-plus-color semantics;
- continued Profile-page and IAM-gated Admin-Portal integration through their existing facades;
- an immediately visible unauthenticated public Enterprise Scorer on `/`, with public asset state fixed to BTC;
- a compact 88px desktop public sideboard that expands to 300px and retains the existing mobile toggle contract;
- Buffett Value Check presentation only under the Aktien universe;
- a disabled `Satoshi Universe Check` placement under Krypto as an explicit FINTECH handoff, with no Frontend-local valuation formula, model or score authority.

This package does **not** implement the Satoshi valuation/scoring contract, activate Gemini/DeepSeek providers, create a second LLM gateway, change provider credentials, modify Supabase, or change protected external infrastructure. Those are foreign-owner boundaries.

## Before → After

| Surface | Current-main before | Branch after | Semantic impact |
|---|---|---|---|
| Primary canvas | `#08080C` | `#18181B` | visual only |
| Capital Gold visual anchor | `#F9BF21` | `#F5C453` | visual hierarchy only |
| Display font | Inter | Montserrat | typography only |
| Glass surface | mixed runtime | `rgba(10,10,10,0.40)`, 12px blur | visual only |
| Vocabulary | canonical registry with conventional card presentation | canonical registry rendered as Universe Knowledge Grid | presentation only |
| Asset sideboard | generic universe icon; no explicit Indizes entry | differentiated canonical asset colors/icons plus Indizes | presentation/navigation only |
| Buffett navigation | appeared under multiple universe menus | rendered only under Aktien | owner-correct presentation boundary |
| Krypto value counterpart | absent | disabled Satoshi Universe Check FINTECH-handoff slot | no business logic created |
| Public analysis | PR #1010 required explicit activation | explicit Owner direction renders public workbench directly | presentation/runtime-composition change |
| Public symbol | mutable workbench state | fixed `BTC` public state | bounded public presentation choice |
| Public desktop sideboard | broad expanded cockpit | 88px collapsed / 300px expanded | presentation only |
| Pattern badges | evidence-backed direction/intensity with labels | preserved | no financial semantic change |
| Profile / Admin | existing routed/facaded surfaces | preserved and contract-guarded | no IAM authority change |

## Semantic preservation

The following current semantic values deliberately remain unchanged:

- Crypto asset: `#8D26FF`;
- Stock asset: `#44DE88`;
- Index asset: `#60A5FA`;
- Forex asset: `#E879F9`;
- score best: `#44DE88`;
- score worst: `#F87171`;
- semantic info/data: `#22D3EE`;
- missing Pattern evidence remains omitted (`noPlaceholder=true`).

Pattern direction continues to be communicated by text (`BUY` / `SELL`) in addition to color. Decorative Cyan/Purple are not reused as financial truth.

## Public landing boundary

PR #1010 previously removed eager public analysis activation because that composition could pull scorer-heavy code and begin the default BTC scoring request before explicit analysis intent. The later Human/Owner direction in this work package explicitly chooses an immediately visible public Enterprise Scorer again, but narrows public asset selection to BTC and keeps the public sideboard compact.

Therefore the PR #1010 **on-demand activation behavior is intentionally superseded only for this public presentation composition**. Existing Auth, anonymous-session rejection, DATA/FINTECH score authority, server gates, login-required tools, error boundaries and no-synthetic-data behavior remain current.

This explicit trade-off must be validated with browser/mobile and production performance evidence before any claim that the new landing composition improves performance.

## Vocabulary / Profile / Admin / Pattern boundaries

- `LearningVocabulary` continues to consume `createDefaultVocabularyRegistry()`; no parallel vocabulary registry is introduced.
- `ProfilePage` remains routed through the current dashboard view router.
- `AdminPortal` remains exposed through the current governance facade and `isAdmin`-gated dashboard navigation.
- `RankingBoard` retains the current PatternBadge evidence behavior; no missing Pattern placeholder is manufactured.
- the disabled Satoshi slot explicitly states that a FINTECH feature contract is required.

## Consent observation

The Human/Owner reported on 2026-09-16 that cookie selection was visible/usable for the first time during live use. This is recorded only as:

`HUMAN_OBSERVATION / POSITIVE_SIGNAL / NOT_INDEPENDENTLY_VERIFIED`

It does not by itself prove the full FE-CONSENT-V3 exit gate, mobile persistence, revocation, analytics network behavior, CMP/TCF suitability or Compliance acceptance. No Consent source/configuration is changed by this branch.

## Validation

Focused guards now include:

- `tests/unit/frontend1608AppearanceContract.test.ts`;
- `tests/unit/frontendUniversePresentation.test.ts`;
- updated `tests/unit/publicLandingRoute.test.ts`.

Hosted exact-head validation for head `bbb89bef4cbffa064cd36318dd802842639350a2` produced:

- Repository integrity: PASS;
- dependency installation / npm audit at install: PASS (`0 vulnerabilities` reported by the run);
- TypeScript (`npm run lint` / `tsc --noEmit`): PASS;
- `tests/unit/publicLandingRoute.test.ts`: PASS, 17/17;
- `tests/unit/frontendUniversePresentation.test.ts`: PASS, 5/5;
- `tests/unit/frontend1608AppearanceContract.test.ts`: 5/6 PASS, 1 FAIL because the test still asserted the superseded PR #1010 `loadPreview` contract;
- Container Security: PASS;
- PR Governance: PASS;
- build/predeploy were not reached because focused Vitest failed.

The failing assertion is a stale guard, not evidence that the new explicit Owner-directed public composition is correct by itself. The guard is updated in the next branch head to assert the new fixed-BTC/direct-preview contract, after which exact-head hosted validation must run again. `NOT RUN` and skipped checks are never reported as PASS.

## Production / external boundaries

The current production baseline used for this PR remains `main@bea9373811202aef98f3ad8ffd53dba99d37c453` with production-to-main drift `0` at the last validated baseline readback. This branch performs no Render deployment, Supabase mutation, provider activation, credential change or billing mutation.

## Correlation

- current trust-root baseline: `/AGENTS.md@main@bea9373811202aef98f3ad8ffd53dba99d37c453`;
- branch merge base equals current main;
- branch was `0 behind` before this evidence/test correction;
- PR #1012 is an open FINTECH-only writer and is not used as an unmerged dependency of this FE PR;
- no DATA, FINTECH runtime, provider, Supabase, Docker, deployment, Billing, Auth or Consent source file is in this FE diff;
- the Satoshi domain implementation and LLM-provider/gateway work are explicitly held at their owner boundaries.

## Exit status

The Frontend materialization is on Draft PR #1013. Human/CODEOWNER merge remains the only merge authority. Exact-head hosted validation must be green after this stale-test correction; browser/mobile and deployed performance evidence remain separate post-build/post-deploy evidence and are not fabricated here.