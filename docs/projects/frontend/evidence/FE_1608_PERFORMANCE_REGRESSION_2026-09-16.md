# FE 16.08 Performance Regression Correlation — 2026-09-16

**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Owner:** `CAPITAL-AI-FE`  
**Productive PVC:** `N/A — cross-cutting Presentation / Interaction`  
**Work package:** explicit Owner scope `FE-1608-PERF-01` under `FE-CARRY-01` and merged `GOV-CHAT-079` target context  
**Correlation baseline:** `main@fa0a8e109e3e9a96be7a633a06e1407d35a59cce`  
**Historical comparison:** `c08a68bdfdeaa91cb8ba974b5a1829bf00fe61bb` (`2026-08-16`)  
**Status:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`

## Objective

Identify evidence-backed contributors to the material perceived slowdown reported after the 16.08.2026 frontend state and remove the smallest current Frontend-owned regression without rolling back current Auth, Consent, DATA, FINTECH, IAM, Provider, Security or Compliance contracts.

## Correlation result

### 1. Post-16.08 public landing runtime expansion — confirmed Frontend regression candidate

`src/app/public/PublicAnalysisWorkbench.tsx` was introduced after the 16.08 reference; Git history shows the public analysis sideboard materialization on 2026-09-07 (`54e935b82801a691a4b7441d6a820195f255c867`). The current `/` route injects this app-owned workbench into the public Landing page.

Before this remediation, `LandingPage.tsx` used an `IntersectionObserver` with `rootMargin: '320px 0px'`. Therefore the workbench could be mounted before the user reached the analysis surface. On mount, `PublicAnalysisWorkbench` defaults to `enterprise-scorer`, which lazy-loads the canonical public Crypto scorer. `CryptoScoringEnterprise` in turn executes `loadEvaluation()` from a mount/symbol effect and performs `POST /api/crypto/score` for the default BTC symbol.

Consequences of that composition:

- public landing navigation could trigger the analysis chunk before explicit analysis intent;
- the browser could load Motion/Recharts-heavy scorer code during initial landing interaction;
- a productive scoring request could start even though the visitor had not selected an analysis tool;
- the public landing critical path became coupled to an expensive feature runtime introduced after 16.08.

This is an owner-correct Frontend presentation/composition issue. No scoring algorithm, route handler or DATA/FINTECH authority change is required to decouple it.

### 2. Auth/session path changed materially after 16.08 — relevant but not changed in this slice

The historical 16.08 `src/App.tsx` used an optimistic local cached-session path plus Supabase verification. Current `src/app/auth/SessionComposition.tsx` uses the consolidated Supabase auth-state composition, onboarding/AAL gates and bounded watchdogs. The current watchdog limits a missing initial auth event to 8 seconds and individual session stages to 10 seconds; those bounds prevent indefinite hangs but do not make a slow provider/session stage fast.

Because this slice can remove a confirmed public landing regression without changing Security/IAM semantics, SessionComposition is kept unchanged. Auth-bootstrap optimization requires a separately bounded review proving that no cached-session projection can bypass onboarding, MFA/AAL, entitlement or identity mismatch gates.

### 3. Database changes after 16.08 — confirmed changes, no current evidence of primary page-load bottleneck

Read-only Supabase correlation on project `AIFINANCIAL` confirmed multiple migrations after 16.08, including M10/Auth/Privacy changes, FinTech Core traceability, commodity evidence, consent policy, subscription identity and privacy notice guard.

However the current performance evidence does not identify those migrations as the primary website slowdown:

- Supabase Performance Advisor reported only information-level findings (two unindexed foreign keys, one table without primary key and unused-index observations), not a critical runtime query finding;
- current `pg_stat_activity` showed a small idle PostgREST/system connection set rather than connection pressure;
- `pg_stat_statements` showed high aggregate call volume but common PostgREST/runtime statements with low single-digit millisecond mean execution times; the high mean-duration statements observed were predominantly catalog/management introspection queries rather than application landing queries;
- the current Render web service showed low CPU utilization and moderate memory utilization rather than server resource saturation.

A database mutation is therefore **not authorized or justified by this finding**. Any future DATA/OPS remediation must start from a concrete slow-query/lock/index/request-lineage finding and its then-current Primary Owner.

### 4. External Supabase factor — possible contributor, not repository root-cause proof

Supabase reported a September 2026 JWT/PostgREST incident and rollback from PostgREST 14.17 to 14.5 due unintended performance side effects. The project currently exposes PostgREST 14.5 connections. This remains an external-provider correlation factor but does not explain away the repository-side eager public analysis activation documented above.

## Implemented remediation

`src/features/public/ui/LandingPage.tsx` now keeps the public analysis surface on-demand:

1. no viewport-proximity `IntersectionObserver` automatically mounts the workbench;
2. initial `loadPreview=false` preserves the lightweight Landing shell;
3. explicit user actions (`Analyse`, `Bewertungstools öffnen`, `Analyse-Workbench starten`) activate the preview;
4. until activation, a lightweight accessible activation state is rendered;
5. after activation, the same canonical `PublicAnalysisWorkbench` and existing Scorer/Data contracts are used unchanged.

This preserves PR #1008's visible/mobile cockpit recovery after activation and does not change tool availability, auth/entitlement gates, scoring semantics, provider behavior, Consent or route availability.

## Validation truth

Pre-PR hosted build/test/deploy work: **NOT RUN**. The ChatGPT GitHub connector does not provide a local installed checkout, and cost-bearing hosted validation is intentionally deferred until Draft PR creation under the current repository lifecycle.

Repository regression coverage was updated in `tests/unit/publicLandingRoute.test.ts` to require explicit analysis activation and reject restoration of the former `IntersectionObserver` / `320px` eager-load boundary.

## Exit gate

The bounded remediation reaches implementation exit when the exact PR head proves:

- Landing shell mounts without automatically mounting `PublicAnalysisWorkbench`;
- `/api/crypto/score` cannot be triggered by the public Scorer before explicit analysis activation;
- explicit analysis controls still expose the same canonical workbench;
- PR #1008 cockpit/accessibility behavior remains available in the activated workbench;
- Auth, Consent, DATA, FINTECH, IAM, Provider and entitlement semantics remain unchanged;
- focused Frontend regression tests, TypeScript/build and applicable browser evidence pass on the exact PR head, or any not-run evidence is truthfully reported.

## Successor lane

After terminal integration of this performance slice, the same chat may continue the merged GOV-CHAT-079 FE work package from then-current `main`: 16.08 visual-token alignment, shared appearance primitives, current consumers, responsive/mobile parity and exact-head evidence. Crypto Category/Subclass UI work remains FE projection only and must consume then-current DATA/FINTECH-owned classification/model contracts rather than creating local authority.
