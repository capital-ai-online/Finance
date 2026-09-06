# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Security requirements, findings, testing and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-06`  
**Correlation baseline:** `main@6a4a34f1b849763cce0f80b394817d3d83bdf24d`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the thin owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and then detailed in the canonical Security roadmap. It does not create a second finding register, Security authority, IAM plane, release path or productive PVC owner.

Current project routing is resolved only from:

- `/AGENTS.md`;
- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`.

Post-PVC policy overlays withdrawn by current `/AGENTS.md`, including the former Cross-Project Handoff Contract, are historical/non-authorizing and are not current routing inputs.

## Current-main consolidation — 2026-09-06

Repository-backed Security work visible from current `main` was re-correlated rather than inferred from historical chat status alone.

| Work item | Main / branch evidence | Current Security disposition |
|---|---|---|
| Security project/PVC consolidation | PR #749 merged; canonical Security project and detailed roadmap on main | `DONE_MAIN` |
| Adversarial Web/Mobile Security Assessment capability | `.ai/skills/CAPITAL-AI-Security-Assessment.md`, schema/validator and PR #706 | `IMPLEMENTED_MAIN` |
| Security Assessment validator CI binding | `package.json#test:raw` executes `scripts/security/validateSecurityAssessment.test.mjs`; PR #711 merged | `DONE_MAIN` |
| Security Assessment trust-root alignment | PR #766 merged; bounded SEC verification/remediation-owner split aligned to current trust root | `DONE_MAIN` |
| Owner Device Authorization Stage-C verification | initial FAIL evidence followed by independent PASS re-verification evidence on main | `COMPLETE / HISTORICAL`; do not reopen retired M10/withdrawn cutover overlays without new current authority |
| GOV-CHAT-042 / `SEC-VERIFY-ULS-001` | PR #725 contract evidence, OPS User Lifecycle return, DATA PR #730 and current provider/code re-verification | `FAIL — CURRENT GOV-07 SECURITY VERIFIER RETURN`; identity and several gates verify, but required protected capabilities still have productive bypass/unbound paths |
| DATA `realtime_ai_newsfeed` remediation | PR #730 merged; `/api/news*` parent mount uses one verified-principal/server-entitlement gate before provider I/O | `VERIFIED` for the current repository capability boundary; no blanket User Lifecycle closure implied |
| OPS Security return correlation | OPS User Lifecycle closeout and current OPS roadmap provide repository/read-only-provider evidence while retaining provider E2E gaps | `CORRELATED_MAIN`; `EVIDENCE_READY` is not Security verification |
| S1 hardening findings | current owner roadmaps, code and evidence | mixed; no blanket closure |

## Priority queue

Security-owned work is separated from foreign productive remediation.

1. **`SEC-VERIFY-ULS-001` — GOV-07 User Lifecycle subscription/entitlement re-verification.** Current verifier return is `FAIL`: the bounded subscription-identity chain is independently verified read-only and `buffett_value_check`, `realtime_ai_newsfeed` and `pdf_compliance_export` have authoritative server boundaries, but `verified_screening`, `backtest`, `monte_carlo` and `full_ai_analysis` do not satisfy the required protected-capability boundary on current main. Productive remediation remains with FINTECH/DATA/OPS by actual PVC ownership; Security does not implement those changes.
2. **`SEC-VERIFY-R2-04` — Fatal-process remediation verification.** Implementation is on main; Security closure still requires applicable negative/runtime/post-deploy evidence.
3. **`SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle correlation.** ESS-0020 remains proposed; no Security or Governance agent may self-promote or retire it. Any lifecycle change follows current authority/Human gates.
4. Track foreign-owner S1 remediation/evidence returns without absorbing implementation: `S1-R2-03`, `05`, `06`, `07`, `09`, `10`, `11` and User Lifecycle provider residuals.

## SEC-VERIFY-ULS-001 — GOV-07 verifier return — 2026-09-06

### Exit gate

`SEC_VERIFY_ULS_001 = FAIL`

Reason: a PASS/PARTIAL-only disposition would hide confirmed productive entitlement bypasses. The core identity projection is sound, but GOV-07 requested verification covers the protected capability set as well as the provider residuals. Multiple required capabilities can still execute without the authoritative server entitlement/quota boundary.

No productive foreign-owner remediation is performed by this Security return.

### Subscription identity chain

Required chain:

`verified bearer -> metadata.user_id -> auth.users.id -> public.subscriptions.user_id`

**Result: `VERIFIED` for the bounded identity projection.**

Current-main and live read-only evidence establish:

- `resolveVerifiedIdentity(req)` accepts a strict bearer token and resolves the principal with `supabase.auth.getUser(token)`; request/query/body identity is not authoritative.
- server-owned Stripe Checkout copies the verified user identifier into subscription metadata; the public projection does not trust browser-supplied `user_id` as entitlement authority.
- the deployed `public.sync_stripe_subscription_to_public()` trigger reads `NEW.metadata->>'user_id'`, requires UUID parsing and a matching `auth.users.id`, then upserts `public.subscriptions.user_id`.
- remote migration `20260905103413 / user_lifecycle_subscription_identity_authority` is present.
- live read-only integrity checks returned `0` orphan `public.subscriptions.user_id` rows and `0` duplicate `user_id` rows.
- `/api/stripe/user-subscription` resolves the bearer principal first and calls `getSubscription(identity.userId)`.

This verifies the identity projection only; it does not upgrade missing capability gates or unavailable provider E2E scenarios to PASS.

### Capability verification

| Capability | Result | Current-main verifier evidence | Productive owner boundary |
|---|---|---|---|
| `verified_screening` | `FAIL` | `server/quota.ts` has a verified-principal/server-tier quota gate, and legacy scoring routes consume it; however `src/features/registry/registryRoutes.ts` executes productive `/assets/verified-scores`, `/assets/:symbol/verified-context` and `/assets/:symbol/verified-score` without `enforceScreeningQuota()` | `CAPITAL-AI-FINTECH / PVC-16` |
| `backtest` | `FAIL` | ADR-0034 requires Pro/Enterprise, but `server/routes/historyRoutes.ts` exposes `/api/backtest-history` without verified identity or subscription enforcement and frontend backtest consumers use that history path | `CAPITAL-AI-FINTECH / PVC-15` |
| `monte_carlo` | `FAIL` | `MonteCarloDetailed.tsx` executes the simulation client-side and its effect calls `runSimulation(true)`, explicitly bypassing the optional `triggerAttempt` boundary | `CAPITAL-AI-FINTECH / PVC-15` |
| `full_ai_analysis` | `FAIL` | capability exists in `subscription-entitlements/1.0.0` and quota schema, but no explicit productive authoritative execution boundary is bound to it on current main; verification therefore fails closed | `CAPITAL-AI-FINTECH / PVC-15` |
| `buffett_value_check` | `VERIFIED` | `/api/entitlements/warren-buffett/authorize` consumes `enforceBuffettValueCheckQuota`; identity and current server subscription are resolved before quota decision, and the UI authorizes before verified-display hydration | `CAPITAL-AI-FINTECH / PVC-15`; no new remediation from this return |
| `realtime_ai_newsfeed` | `VERIFIED` | DATA PR #730 is merged; `registerApplicationRoutes.ts` mounts `realtimeAiNewsfeedEntitlement` before `newsRouter`; missing identity -> 401, Free/Starter -> 403, authority failure -> 503, Pro/Enterprise -> allow; exact-head PR #730 `build-and-test` and security/governance checks completed successfully | `CAPITAL-AI-DATA / PVC-09`; prior runtime gap is closed at repository boundary |
| `pdf_compliance_export` | `VERIFIED` | `/api/stripe/pdf-credits` and `/api/stripe/consume-pdf-credit` resolve verified identity and server state; `PdfExportModal.tsx` uses authenticated fetch before protected export consumption; regression tests guard removal of the earlier local-tier bypass | existing owner boundary; no new productive remediation from this return |

### Negative-case verification

| Negative case | Result | Verifier disposition |
|---|---|---|
| forged identity | `FAIL` | verified-principal routes reject spoofed request identity, but required protected capabilities with no server gate remain executable without establishing the principal at all |
| cross-user access | `PARTIAL` | live RLS policy is own-row only and provider integrity is sound; an independent two-user provider E2E denial run was not available in this pass |
| missing auth | `FAIL` | newsfeed/Buffett/PDF fail closed, while verified registry scoring, backtest and client-local Monte Carlo retain no equivalent required auth boundary |
| stale entitlement | `FAIL` | authoritative server-gated capabilities re-read server subscription state, but bypass/unbound capabilities do not consume that authority and therefore cannot prove downgrade/staleness denial |
| alternate route | `FAIL` | confirmed current-main registry screening and client-local Monte Carlo alternate paths; backtest compatibility route also lacks entitlement enforcement |
| quota bypass | `FAIL` | confirmed protected-capability paths can bypass the canonical quota/entitlement engine even though the engine itself fails closed/falls back to server in-memory enforcement where used |
| authority unavailable | `FAIL` | newsfeed explicitly returns 503 and server quota paths retain enforcement fallback; required bypass/unbound capabilities do not consult the authority and therefore cannot prove fail-closed behavior |

### Provider evidence

Provider statuses use only `VERIFIED`, `PARTIAL`, `FAIL`, `NOT_AVAILABLE`, `NOT_RUN`.

| Provider evidence | Status | Current read-only evidence / boundary |
|---|---|---|
| Supabase RLS | `VERIFIED` | live `public.subscriptions` RLS is enabled; authenticated policy is `SELECT` with `auth.uid() = user_id`; service role retains the separate privileged path. No browser write policy was observed in this verifier readback. |
| Stripe sandbox and Test Clock | `NOT_AVAILABLE` | the connected Stripe context available to this verifier is live-mode only. No sandbox/Test Clock context was available, and `provider_mutation=false` prohibits creating one or advancing a clock. |
| webhook redelivery | `NOT_AVAILABLE` | live read-only Stripe evidence confirms the managed Stripe→Supabase webhook endpoint is enabled, but this pass had no sandbox delivery-attempt/redelivery surface that could produce a reproducible failed-delivery + retry proof without provider mutation. Stripe retry semantics are not substituted for project evidence. |
| session revocation | `PARTIAL` | repository code has explicit local/global Supabase sign-out and browser projection clearing, but no provider mutation was permitted to create/revoke sessions in this pass. Current Supabase session semantics also leave an already-issued access JWT usable until expiry unless a sensitive operation additionally validates `session_id` against `auth.sessions`; the current `resolveVerifiedIdentity` path does not establish that stronger revocation guarantee. |

Additional live Supabase Security Advisor observation: leaked-password protection remains disabled (`WARN`). This is defense-in-depth provider configuration and is not silently mutated by this verifier.

### GOV-07 return

Security returns the following to Governance:

- bounded subscription identity projection: `VERIFIED`;
- protected capability set: `FAIL` because four required capabilities retain confirmed bypass/unbound paths;
- provider evidence: mixed `VERIFIED / PARTIAL / NOT_AVAILABLE`; no unavailable provider scenario is promoted to PASS;
- foreign remediation: `false`; route FINTECH-owned capability fixes to FINTECH and any newly identified owner-specific runtime/provider work to the corresponding Primary Owner;
- GOV-07 must remain open on this Security gate until the failed capabilities are remediated and independently re-verified. Provider residuals remain separately visible even after capability remediation.

## Current finding projection

| Finding / residual | Primary productive owner | Main-correlated state | Security next gate |
|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `CAPITAL-AI-OPS / PVC-06` | owner-controlled; not re-adjudicated by this bounded GOV-07 verifier | verify exact identity after OPS implementation |
| `S1-R2-04` fatal process handling | `CAPITAL-AI-OPS / PVC-04`, runtime evidence `PVC-08` | implemented on main; independent Security/post-deploy verification remains separate | negative + post-deploy/supervisor evidence |
| `S1-R2-05` Stripe redirect boundary | `CAPITAL-AI-OPS / PVC-02` | owner-controlled; not re-adjudicated by this bounded GOV-07 verifier | open-redirect DENY evidence after OPS remediation |
| `S1-R2-06` entitlement authority | OPS parent inventory; FINTECH/DATA children by actual capability owner | `FAIL` in current `SEC-VERIFY-ULS-001`: DATA newsfeed child now verifies via PR #730, while FINTECH screening/backtest/Monte-Carlo/full-AI gaps remain | owner remediation -> independent per-capability DENY re-verification |
| `S1-R2-07` recovery / RPO / RTO | `CAPITAL-AI-OPS / PVC-08` | current OPS return correlated; not re-adjudicated by this bounded GOV-07 verifier | separate Security verification |
| `S1-R2-09` strict CSP promotion | `CAPITAL-AI-OPS / PVC-08` | owner-controlled; not re-adjudicated here | compatibility/violation evidence before strict-state claim |
| `S1-R2-10` demo billing isolation | `CAPITAL-AI-OPS / PVC-08` | owner-controlled; not re-adjudicated here | production reachability proof bound to deployed identity |
| `S1-R2-11` evidence identity/freshness | `CAPITAL-AI-DATA / PVC-10` | DATA roadmap retains Security evidence work | current/stale/wrong-identity behavior evidence |
| User Lifecycle subscription identity | `CAPITAL-AI-OPS / PVC-08` evidence provider | `VERIFIED` bounded identity projection on 2026-09-06 read-only re-verification | preserve chain; re-run after material identity/provider change |
| User Lifecycle provider E2E | `CAPITAL-AI-OPS / PVC-08` plus applicable provider/runtime owners | Supabase RLS `VERIFIED`; session revocation `PARTIAL`; Stripe Sandbox/Test Clock and webhook redelivery `NOT_AVAILABLE` | remain non-PASS until reproducible evidence exists |
| leaked-password protection | `CAPITAL-AI-OPS / PVC-08` provider configuration | `OPEN DEFENSE-IN-DEPTH`; live advisor warning remains | separate protected config decision/mutation, then Security evidence |
| MFA/AAL authority lifecycle | no productive Security PVC ownership; current lifecycle requires applicable authority/Human decision | `OPEN / CLARIFY`; ESS-0020 remains `PROPOSED` | current authority correlation; no unilateral promotion/retirement |

No row above grants CAPITAL-AI-SEC productive implementation ownership.

## Current correlation state

Current task baseline is `main@6a4a34f1b849763cce0f80b394817d3d83bdf24d`. `/AGENTS.md` is current Control Plane v2.8.0 and `ESS-0006` remains v1.1.0. `ADR-0034` is the accepted canonical subscription-entitlement decision used by this verifier.

At the pre-mutation and immediate branch-creation correlation snapshots there were **zero open pull requests**. The historical Security project-surface claim is `released` / non-exclusive, and no current `security` branch or active claim overlapping `docs/projects/security/ROADMAP.md` was found. The scoped branch `agent/security-gov07-uls-verify-20260906` was created fresh from the exact current-main SHA above.

The current OPS, FE, FINTECH and DATA owner returns were correlated. Their productive ownership is preserved: Security records verification/finding state only and does not modify foreign productive code or provider configuration.

## Security execution invariants

- Missing, stale or `NOT_AVAILABLE` required evidence is never PASS.
- `EVIDENCE_READY` is not `VERIFIED`.
- Security may define, test, reject and independently verify but does not silently implement foreign productive code.
- `ACCEPTED_RISK` requires applicable Human/Owner authority.
- Security project navigation never creates Authority.
- `src/platform/Security` is the reusable Security implementation boundary only for inherently Security-owned controls.
- Technical `VC-*` identifiers and organizational `PVC-*` routing remain separate namespaces.
- M10 productive runtime is retired/off under current `/AGENTS.md`; historical Owner Device evidence does not reactivate it.
- Merge, Release, Production and protected external mutation remain under current repository/Human gates.

## Secondary-surface status

The dated Security Work Packages and Traceability Matrix remain useful detailed evidence/history but can contain pre-current-main routing/status text. Where they conflict with this current-main projection, they must not override current `/AGENTS.md`, current project mapping or the detailed Security roadmap. Their full normalization is a separate Security documentation-maintenance task, not foreign productive remediation.

## Validation / completion gate

For `SEC-VERIFY-ULS-001`:

1. current `/AGENTS.md` v2.8.0 and exact `main@6a4a34f1b849763cce0f80b394817d3d83bdf24d` were read and re-correlated;
2. project/PVC/Primary Owner mapping is `CAPITAL-AI-SEC`, `docs/projects/security/`, productive PVC `[]`;
3. Security ROADMAP, detailed Security roadmap, current OPS/FE/FINTECH/DATA returns, `ESS-0006` v1.1.0 and accepted ADR-0034 were correlated;
4. open PR, writer/claim, changed-file and semantic overlap checks found no blocker at branch creation;
5. live Supabase read-only RLS/function/migration/integrity/advisor evidence was collected without DDL/DML mutation;
6. connected Stripe evidence was read-only; no sandbox/Test Clock context was available and no provider mutation was performed;
7. current-main capability routes were independently inspected rather than inheriting OPS classifications; this found confirmed FAIL paths for screening, backtest and Monte Carlo and retained fail-closed verification for unbound `full_ai_analysis`;
8. DATA PR #730 was re-correlated as merged and its exact-head GitHub Actions `build-and-test`, governance/security and hardened-image checks were successful; the current newsfeed gate is therefore not left stale as an open DATA runtime gap;
9. current-main CI evidence was inspected; skipped checks are not represented as PASS;
10. provider-mutating session-revocation, Stripe sandbox/Test Clock and webhook-redelivery execution is `NOT RUN`/`NOT_AVAILABLE` as stated above, never PASS;
11. this branch changes only this Security roadmap projection; no foreign productive file is remediated;
12. before PR creation, exact current main/head SHA, overlap, changed files, applicable checks and the resolved PR title must be re-correlated and presented for exact Human/Owner approval;
13. merge remains Human/CODEOWNER-only.
