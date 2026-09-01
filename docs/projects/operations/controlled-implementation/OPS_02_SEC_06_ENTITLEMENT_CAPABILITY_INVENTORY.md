# OPS-02-SEC-06 — Premium / Protected Capability Inventory

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Work package:** `OPS-02-SEC-06`  
**Security finding:** `S1-R2-06 — Entitlement authority`  
**Project stage:** `PVC-02 — Controlled Implementation`  
**Correlation baseline:** `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`  
**Status:** `PARENT INVENTORY COMPLETE — CHILD REMEDIATION REQUIRED — SECURITY VERIFICATION PENDING`  
**Authority boundary:** inventory/coordination only; no foreign productive code is implemented here.

## 1. Objective

Inventory every canonical subscription capability and determine whether a paid/protected grant is actually decided by a verified principal plus authoritative server/provider entitlement state.

The package consumes the accepted `subscription-entitlements/1.0.0` contract and the Security requirement that browser/local subscription projection must never become protected-capability authority.

This document distinguishes:

- **product contract** — what the accepted plan matrix promises;
- **presentation projection** — browser/UI state, never sufficient authorization;
- **productive entry point** — route/component that actually executes or hydrates the capability;
- **authoritative decision point** — verified identity plus server/provider entitlement/quota/ledger;
- **alternate path** — any route or browser execution path that can reach the capability without the intended authority;
- **Primary Owner** — project that owns productive domain implementation according to the current PVC model.

Security retains finding ownership and independent verification. OPS does not mark `S1-R2-06` `VERIFIED` or `CLOSED`.

## 2. Correlated sources

Primary sources re-read or re-correlated on the current baseline:

- `/AGENTS.md`;
- `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md` v1.3.0 for current execution boundaries only;
- `docs/projects/PROJECT_VALUE_CHAIN.md` and `docs/projects/ROADMAP_REGISTRY.md`;
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`;
- `docs/projects/operations/ROADMAP.md`;
- `docs/projects/operations/WORK_PACKAGES.md`;
- `docs/projects/operations/SECURITY_HANDOFFS.md`;
- `docs/evidence/security/S1_R2_00_ENTITLEMENT_AUTHORITY_TRACE_2026-08-30.md`;
- `docs/adr/ADR-0034-central-subscription-entitlements-and-buffett-access.md`;
- `src/config/subscriptionEntitlements.ts`;
- `server/quota.ts`;
- `server/entitlements.ts`;
- `server/routes/historyRoutes.ts`;
- `src/features/registry/registryRoutes.ts`;
- `src/features/news/newsRoutes.ts`;
- `src/components/Dashboard.tsx`;
- `src/components/BacktestEngine.tsx`;
- `src/components/MonteCarloDetailed.tsx`;
- `src/components/RealtimeAiNewsfeed.tsx`;
- `src/components/BuffetValueCheck.tsx`;
- `src/components/PdfExportModal.tsx`;
- `src/platform/Security/authMiddleware.ts`;
- `src/lib/subscriptionReadback.ts`;
- `scripts/operations/userLifecycleHarness.ts`;
- `supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql`;
- `tests/unit/s1R2EntitlementAuthority.test.ts`;
- `tests/unit/userLifecycleSubscriptionProjection.test.ts`.

### Current-main / writer recorrelation

- PR #683 is Human-merged in `main` and adds the User Lifecycle Harness plus stable user-ID subscription projection. It strengthens subscription identity/readback but does not add authoritative enforcement to Backtest, Monte Carlo, Newsfeed or canonical verified-score alternate routes.
- PR #688 is Human-merged and releases the terminal User-Lifecycle work claim; it changes coordination metadata only.
- PR #689 is Human-merged and makes ADR-0104 v1.3.0 current; its slot-policy changes do not alter entitlement product/runtime semantics.
- PR #691 is currently open for M10 runtime retirement. Its changed paths are M10/CI/DevelopmentChain-specific and have zero file/semantic overlap with this inventory. Its unmerged candidate is not used as evidence here.
- `agent/operations-entitlement-capability-inventory-20260901` is a stale PR-less predecessor working branch. The active candidate is `agent/operations-entitlement-capability-inventory-v2-20260901`; the predecessor is retained only as history and is not a parallel authority.

The current-main source checks reproduce the previous capability classifications. No later merge closes the child gaps below.

## 3. Canonical entitlement set

`src/config/subscriptionEntitlements.ts` defines exactly seven feature keys:

| Capability | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| `verified_screening` | 3 / rolling 5d | 5 / rolling day | 20 / rolling day | unlimited |
| `backtest` | denied | denied | allowed | allowed |
| `monte_carlo` | denied | denied | 1 / rolling day | unlimited |
| `full_ai_analysis` | preview only | 1 / rolling day | unlimited | unlimited |
| `realtime_ai_newsfeed` | denied | denied | allowed | allowed |
| `buffett_value_check` | 1 asset / rolling 3d | 1 asset / rolling 3d | unlimited | unlimited |
| `pdf_compliance_export` | denied | denied | denied | allowed/unlimited server-ledger path |

`canUseFeature()` exists as a plan helper, but current repository correlation finds no productive caller. It is therefore a contract/presentation helper, not an enforcement boundary.

## 4. Capability matrix

| Capability | Productive paths correlated | Authoritative decision currently present | Alternate-path result | Primary owner / routing | Classification |
|---|---|---|---|---|---|
| `verified_screening` | legacy `/api/crypto-scoring/:symbol`; legacy scoring compatibility; canonical registry `/assets/verified-scores`, `/verified-context`, `/verified-score` | `enforceScreeningQuota()` is server-side for the legacy guarded paths and resolves verified identity + `getSubscription()` | canonical registry score routes execute without `enforceScreeningQuota()` | `CAPITAL-AI-FINTECH / PVC-16`, canonical scoring/result boundary | `PARTIAL_SERVER_ENFORCEMENT / ALTERNATE_PATH_GAP` |
| `backtest` | `BacktestEngine` -> `/api/backtest-history`; `PortfolioBacktester` compatibility consumer | no paid-tier server decision on `/api/backtest-history`; `triggerAttempt` is guest UX only | registered Free/Starter can reach history and browser backtest execution without paid entitlement | `CAPITAL-AI-FINTECH / PVC-15` for productive analysis contract | `NO_PAID_ENTITLEMENT_ENFORCEMENT` |
| `monte_carlo` | `MonteCarloDetailed` browser simulation | no authoritative server entitlement decision | browser-local execution/automatic path can run without a server paid grant; optional `triggerAttempt` is not authority | `CAPITAL-AI-FINTECH / PVC-15` for productive analysis contract | `CLIENT_LOCAL_ALTERNATE_PATH_GAP` |
| `full_ai_analysis` | canonical plan key and quota-kind semantics exist; no productive execution path is bound to the key on current correlation | none evidenced for the named capability | cannot prove ALLOW/DENY because product key is not bound to one canonical productive entry point | `CAPITAL-AI-FINTECH / PVC-15` must bind or explicitly decompose the financial domain capability before consumer migration | `UNBOUND_PRODUCT_CAPABILITY / FAIL_CLOSED_FOR_VERIFICATION` |
| `realtime_ai_newsfeed` | `RealtimeAiNewsfeed` -> public `/api/news`, `/api/news/assets`, `/api/news/sources` | none; `subscriptionTier` is displayed by UI but not used as authority | Free/Starter can call public news evidence routes directly despite accepted Pro/Enterprise plan claim | `CAPITAL-AI-DATA / PVC-09` owns provider/evidence ingress; presentation remains downstream | `PRODUCT_CONTRACT_VS_RUNTIME_GAP` |
| `buffett_value_check` | `BuffetValueCheck` -> `POST /api/entitlements/warren-buffett/authorize` -> verified-display | server route uses `enforceBuffettValueCheckQuota()`, verified bearer identity, server subscription and subject quota | current UI uses native `fetch` without the bearer-aware client contract required by `resolveVerifiedIdentity`; this fails closed rather than granting | `CAPITAL-AI-FINTECH / PVC-15` owns valuation capability; consumer transport follow-up must preserve server authority | `SERVER_AUTHORITY_PRESENT / FAIL_CLOSED_CLIENT_INTEGRATION_GAP` |
| `pdf_compliance_export` | `PdfExportModal` -> `/api/stripe/pdf-credits`, `/api/stripe/consume-pdf-credit` | `authFetch` bearer + server subscription/credit ledger; client defaults to zero credits and fails closed | historical browser-only alternate export was removed; current modal cannot commit protected export through the old missing-email branch | no new productive remediation identified by parent inventory | `SERVER_ENFORCED / EVIDENCE_PRESENT` |

## 5. Current-main reinforcing observations

### User-Lifecycle merge

The merged User-Lifecycle package makes `supabase_auth_user_id` the primary Stripe/Supabase projection identity and keeps email secondary. Authenticated subscription readback remains bearer-bound. This strengthens the authority chain but does not turn browser tier into a protected grant and does not add missing feature-specific enforcement.

### Backtest

`GET /api/backtest-history` still accepts `symbol`/`range` and returns history without verified identity or subscription entitlement. `BacktestEngine` performs the strategy calculation in the browser after fetching that data. Therefore the accepted Pro/Enterprise Backtest plan rule is not authoritatively enforced at the productive execution boundary.

### Newsfeed

`RealtimeAiNewsfeed` still uses `subscriptionTier` only as presentation text while fetching public Newsfeed metadata/feed surfaces. Public evidence semantics do not themselves establish whether the product capability should be paid; while ADR-0034 remains the accepted plan contract, direct public access is an unresolved contract/runtime gap rather than an implicit reclassification.

### Buffett

The server authorization endpoint remains the correct authority pattern. The browser caller still uses native `fetch` without the bearer-aware authentication wrapper. The observed outcome is fail-closed integration failure, not an authorization bypass.

## 6. Global browser-tier finding

Browser `profile.subscriptionTier` and any temporary Checkout-return projection are **presentation state only**. They MUST NOT satisfy any protected-capability decision.

Current package result:

- persisted Stripe/Supabase subscription truth remains server-owned;
- stable user-ID subscription projection is stronger after the merged User-Lifecycle package;
- robust quota/PDF server paths do not trust browser tier as authority;
- several other capabilities still execute without a server entitlement boundary, so the presentation-state invariant is not globally proven.

No browser tier, local cache, query/body user ID, provider/model label or `triggerAttempt` result is accepted as entitlement authority.

## 7. Required DENY matrix

The following expectations are mandatory for every capability classified as protected. `NOT_APPLICABLE` requires evidence that the capability is explicitly public/non-protected under current authority, not merely an unguarded route.

| Capability | Browser-tier escalation | Forged identity | Missing bearer | Stale entitlement | Alternate path |
|---|---|---|---|---|---|
| verified screening | `DENY` beyond authoritative quota | `DENY` | guest-only limits where explicitly allowed; otherwise `DENY` | authoritative server state wins | every canonical score route must consume same quota policy |
| backtest | `DENY` for Free/Starter regardless of local tier | `DENY` | `DENY` for paid execution | server state wins | direct history/compute path must not bypass grant |
| Monte Carlo | `DENY` for Free/Starter | `DENY` | `DENY` for paid execution | server state wins | automatic/browser-local execution must not bypass grant |
| full AI analysis | local tier cannot grant | `DENY` | `DENY` for paid/full execution | server state wins | one canonical productive boundary must be identified before verification |
| Realtime AI Newsfeed | local Pro/Enterprise projection cannot grant | `DENY` where protected identity is required | `DENY` while ADR-0034 paid classification remains effective | server state wins | direct `/api/news*` must not bypass paid classification |
| Buffett Value Check | local tier cannot grant | `DENY` | `DENY` | server state/quota wins | no verified-display hydration before authorization |
| PDF Compliance Export | local tier cannot grant | `DENY` | `DENY` | server subscription/credit ledger wins | no prepared download commit without ledger ALLOW |

## 8. Child remediation — FINTECH

### 8.1 Canonical screening alternate routes

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]`

- `project_namespace: PVC`
- `project_stage: PVC-16`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: make every productive canonical verified-score/context/batch path consume the accepted verified_screening entitlement/quota boundary without creating a second scoring or entitlement authority`
- `reason: canonical registry score routes currently bypass enforceScreeningQuota while legacy scoring routes consume it`
- `dependency: ADR-0034; existing ScoringModelRegistry/ScoringDispatcher/CanonicalScoreResult chain; server quota contract`
- `required_evidence: Free/Starter/Pro/Enterprise quota-positive cases plus browser-tier, forged-identity, missing/invalid identity where applicable, stale-entitlement and direct alternate-route DENY evidence`
- `verification_gate: CAPITAL-AI-SEC independent verification of S1-R2-06 returned boundary`
- `status: REFERRED_NOT_EXECUTED`

### 8.2 Financial analysis capability family

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`

- `project_namespace: PVC`
- `project_stage: PVC-15`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: define one authoritative entitlement boundary for Backtest and Monte Carlo; bind full_ai_analysis to an explicit productive financial-domain execution contract; preserve the existing Buffett server authority while correcting its consumer integration through the proper downstream handoff`
- `reason: Backtest and Monte Carlo are currently executable without a paid server grant; full_ai_analysis is unbound; Buffett is fail-closed because the current browser caller does not use the bearer-aware client contract`
- `dependency: ADR-0034; DATA validated/history inputs where applicable; Frontend remains a consumer and must not invent business entitlement semantics`
- `required_evidence: server/principal entitlement decision for protected execution; Free/Starter DENY; forged/missing-bearer DENY; stale-entitlement DENY; automatic/direct alternate-path DENY; exact capability binding for full_ai_analysis; Buffett authorization success/failure through bearer-aware consumer path`
- `verification_gate: CAPITAL-AI-SEC independent verification after FINTECH-owned implementation and any required downstream consumer handoff`
- `status: REFERRED_NOT_EXECUTED`

## 9. Child remediation — DATA

### 9.1 Paid Newsfeed contract versus public evidence route

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]`

- `project_namespace: PVC`
- `project_stage: PVC-09`
- `target_project: CAPITAL-AI-DATA`
- `target_project_folder: docs/projects/data/`
- `primary_owner: CAPITAL-AI-DATA`
- `task: reconcile the current public /api/news evidence ingress with the accepted Pro/Enterprise realtime_ai_newsfeed entitlement contract; consume a canonical verified server entitlement boundary if the paid classification remains applicable, while retaining provider/evidence semantics in DATA`
- `reason: /api/news is currently public and RealtimeAiNewsfeed only displays subscriptionTier; direct requests therefore bypass the accepted paid-plan classification`
- `dependency: ADR-0034 entitlement decision; current news evidence/provider boundary; Frontend is presentation-only and must consume rather than define access semantics`
- `required_evidence: Free/Starter direct-route DENY and Pro/Enterprise ALLOW when protected; forged/missing-bearer DENY; stale entitlement DENY; /api/news, /api/news/assets and /api/news/sources alternate-path coverage, or explicit higher-authority reclassification if the product is intentionally public`
- `verification_gate: CAPITAL-AI-SEC independent verification`
- `status: REFERRED_NOT_EXECUTED`

## 10. No child remediation identified — PDF

The current PDF flow is retained as the reference pattern:

```text
browser intent
  -> authFetch bearer
  -> verified server principal
  -> getSubscription / PDF credit ledger
  -> ALLOW
  -> prepared download commit
```

Failure to read authoritative credits results in zero usable credits and a blocked export. This inventory does not reopen the historical PDF implementation solely because R2-06 remains globally active.

## 11. Parent package result

`OPS-02-SEC-06` parent inventory is complete on this candidate when all of the following hold:

- all seven canonical feature keys are present exactly once in the matrix;
- productive and alternate paths are identified to the extent current repository evidence permits;
- browser projection is explicitly non-authoritative;
- DENY expectations are mapped per feature;
- concrete foreign productive remediation is routed to its current Primary Owner;
- no foreign code is modified by this OPS package;
- Security verification remains pending and independent.

### Security return projection

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

- `source_security_finding: S1-R2-06`
- `target_project: CAPITAL-AI-OPS`
- `project_stage: PVC-02`
- `implementation_status: EVIDENCE_READY`
- `changed_files: OPS-owned inventory/roadmap/handoff/work-package documents plus work claim only`
- `candidate_sha: bound to the exact PR head by repository PR evidence; no runtime SHA claim`
- `runtime_sha_if_applicable: N/A — no production/runtime mutation`
- `security_tests: inventory maps existing server authority and required future positive cases; no foreign remediation test is claimed PASS`
- `negative_tests: browser-tier escalation, forged identity, missing bearer, stale entitlement and alternate-path expectations mapped per capability`
- `evidence_paths: docs/projects/operations/controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`
- `known_residual_risk: unguarded or client-local paid capabilities remain until child owners implement and return evidence`
- `unresolved_dependencies: FINTECH PVC-15/PVC-16 and DATA PVC-09 child remediation; independent Security verification`
- `verification_requested: true`

The return means **parent inventory evidence ready**, not `S1-R2-06 VERIFIED/CLOSED`.
