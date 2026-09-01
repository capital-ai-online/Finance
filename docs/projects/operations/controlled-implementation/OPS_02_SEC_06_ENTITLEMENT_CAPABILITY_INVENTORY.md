# OPS-02-SEC-06 — Premium / Protected Capability Inventory

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Work package:** `OPS-02-SEC-06`  
**Security finding:** `S1-R2-06 — Entitlement authority`  
**Project stage:** `PVC-02 — Controlled Implementation`  
**Correlation baseline:** `main@6dea22e5b8c4f2b0b9c9fbfb73615738acf57a54`  
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

Primary sources read on the correlation baseline:

- `/AGENTS.md`;
- `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md` v1.2.0 for current execution boundaries only;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
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
- `src/platform/Security/authMiddleware.ts`.

### Concurrent-writer correlation

PR #683 (`CAPITAL-AI-OPS User Lifecycle Harness`) is concurrently open and semantically adjacent because it works on Subscription Identity / entitlement readback. Its eight changed paths have **zero file overlap** with this package. Its unmerged candidate is not treated as current Authority or implementation evidence here.

PR #684 changed only Governance/ADR-0104 registry/control surfaces and produced current `main@6dea22e5b8c4f2b0b9c9fbfb73615738acf57a54`; comparison against the prior baseline shows no OPS or entitlement-source file change. The inventory conclusions therefore remain substantively stable after recorrelation.

PR #685 was a non-merged create-time race artifact from the superseded branch. It was closed immediately after GitHub reported a newer base than the pre-create snapshot and carries no current-state authority.

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
| `verified_screening` | legacy `/api/crypto-scoring/:symbol`; legacy scoring compatibility; canonical registry `/assets/verified-scores`, `/verified-context`, `/verified-score` | `enforceScreeningQuota()` is server-side for the legacy guarded paths and resolves verified identity + `getSubscription()` | canonical registry score routes execute without `enforceScreeningQuota()` | `CAPITAL-AI-FINTECH`, scoring/orchestration/canonical-score stages | `PARTIAL_SERVER_ENFORCEMENT / ALTERNATE_PATH_GAP` |
| `backtest` | `BacktestEngine` -> `/api/backtest-history`; `PortfolioBacktester` compatibility consumer | no paid-tier server decision on `/api/backtest-history`; `triggerAttempt` is guest UX only | registered Free/Starter can reach history and browser backtest execution without paid entitlement | `CAPITAL-AI-FINTECH / PVC-15` for productive analysis contract | `NO_PAID_ENTITLEMENT_ENFORCEMENT` |
| `monte_carlo` | `MonteCarloDetailed` browser simulation | no authoritative server entitlement decision | effect invokes `runSimulation(true)`, explicitly bypassing optional `triggerAttempt`; execution is browser-local | `CAPITAL-AI-FINTECH / PVC-15` for productive analysis contract | `CLIENT_LOCAL_ALTERNATE_PATH_GAP` |
| `full_ai_analysis` | canonical plan key and quota-kind migration exist; no productive execution path is bound to the key on current correlation | none evidenced for the named capability | cannot prove ALLOW/DENY because product key is not bound to one canonical productive entry point | `CAPITAL-AI-FINTECH / PVC-15` must bind or explicitly decompose the financial domain capability before consumer migration | `UNBOUND_PRODUCT_CAPABILITY / FAIL_CLOSED_FOR_VERIFICATION` |
| `realtime_ai_newsfeed` | `RealtimeAiNewsfeed` -> public `/api/news`, `/api/news/assets`, `/api/news/sources` | none; `subscriptionTier` is displayed by UI but not used as authority | Free/Starter can call public news evidence routes directly despite accepted Pro/Enterprise plan claim | server evidence boundary correlates to `CAPITAL-AI-DATA / PVC-09`; presentation remains a downstream consumer | `PRODUCT_CONTRACT_VS_RUNTIME_GAP` |
| `buffett_value_check` | `BuffetValueCheck` -> `POST /api/entitlements/warren-buffett/authorize` -> verified-display | server route uses `enforceBuffettValueCheckQuota()`, verified bearer identity, server subscription and subject quota | current UI uses native `fetch` without attaching the bearer required by `resolveVerifiedIdentity`; this fails closed rather than granting | `CAPITAL-AI-FINTECH / PVC-15` owns valuation capability; consumer transport follow-up must preserve server authority | `SERVER_AUTHORITY_PRESENT / FAIL_CLOSED_CLIENT_INTEGRATION_GAP` |
| `pdf_compliance_export` | `PdfExportModal` -> `/api/stripe/pdf-credits`, `/api/stripe/consume-pdf-credit` | `authFetch` bearer + server subscription/credit ledger; client defaults to zero credits and fails closed | historical browser-only alternate export was removed; current correlated modal cannot commit protected export through the old missing-email branch | no new productive remediation identified by parent inventory | `SERVER_ENFORCED / EVIDENCE_PRESENT` |

## 5. Global browser-tier finding

`Dashboard.tsx` still permits a Stripe-return query to temporarily project `plan` into `profile.subscriptionTier` before authenticated readback reconciles the value.

That value is **presentation state only**. It MUST NOT satisfy any protected-capability decision.

Current package result:

- persisted Stripe/Supabase subscription truth remains server-owned;
- `profile.subscriptionTier` is not trusted as authority by the robust quota/PDF server paths;
- several capabilities still execute without a server entitlement boundary, so the presentation-state invariant is not globally proven.

No browser tier, local cache, query/body user ID, provider/model label or `triggerAttempt` result is accepted as entitlement authority.

## 6. Required DENY matrix

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

## 7. Child remediation — FINTECH

### 7.1 Canonical screening alternate routes

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

### 7.2 Financial analysis capability family

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`

- `project_namespace: PVC`
- `project_stage: PVC-15`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: define one authoritative entitlement boundary for backtest and Monte Carlo; bind full_ai_analysis to an explicit productive financial-domain execution contract; preserve the existing Buffett server authority while correcting its consumer integration through the proper downstream handoff`
- `reason: backtest and Monte Carlo are currently executable without a paid server grant; full_ai_analysis is unbound; Buffett is fail-closed because the current browser caller does not use the bearer-aware client contract`
- `dependency: ADR-0034; DATA validated/history inputs where applicable; Frontend remains a consumer and must not invent business entitlement semantics`
- `required_evidence: server/principal entitlement decision for protected execution; Free/Starter DENY; forged/missing-bearer DENY; stale-entitlement DENY; automatic/direct alternate-path DENY; exact capability binding for full_ai_analysis; Buffett authorization success/failure through bearer-aware consumer path`
- `verification_gate: CAPITAL-AI-SEC independent verification after FINTECH-owned implementation and any required downstream consumer handoff`
- `status: REFERRED_NOT_EXECUTED`

## 8. Child remediation — DATA

### 8.1 Paid Newsfeed contract versus public evidence route

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]`

- `project_namespace: PVC`
- `project_stage: PVC-09`
- `target_project: CAPITAL-AI-DATA`
- `target_project_folder: docs/projects/data/`
- `primary_owner: CAPITAL-AI-DATA`
- `task: reconcile the current public /api/news evidence ingress with the accepted Pro/Enterprise realtime_ai_newsfeed entitlement contract; consume a canonical verified server entitlement boundary if the paid classification remains applicable, while retaining provider/evidence semantics in DATA`
- `reason: /api/news is currently public and RealtimeAiNewsfeed only displays subscriptionTier; direct requests therefore bypass the accepted paid-plan classification`
- `dependency: ADR-0034 entitlement decision; current news evidence/provider boundary; Frontend is presentation-only and must consume rather than define access semantics`
- `required_evidence: Free/Starter direct-route DENY and Pro/Enterprise ALLOW when protected; forged/missing-bearer DENY; stale entitlement DENY; `/api/news`, `/api/news/assets` and `/api/news/sources` alternate-path coverage, or explicit higher-authority reclassification if the product is intentionally public`
- `verification_gate: CAPITAL-AI-SEC independent verification`
- `status: REFERRED_NOT_EXECUTED`

## 9. No child remediation identified — PDF

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

## 10. Parent package result

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
