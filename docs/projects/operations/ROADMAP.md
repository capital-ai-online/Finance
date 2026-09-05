# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.3.0`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-05`  
**Correlation baseline:** `main@687105ffe90f649c8ada6310976826c9ea625f27`  
**Open PR baseline:** PR #728 FINTECH Equity P1-B; zero changed-file/semantic overlap with OPS User Lifecycle closeout  
**Primary project stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`

## 1. Objective

CAPITAL-AI-OPS is the organizational execution and runtime project for the recurring controlled-delivery lifecycle and the OPS-owned Project Value Chain stages. It connects Controlled Implementation, Supervisor, Version, Release, Production and EventMesh/Traceability while preserving existing Authorities and component boundaries.

## 2. Canonical flow

```text
PVC-02 Controlled Implementation
→ PVC-03 Documentary Engine / CAPITAL-AI-DOC
→ PVC-04 Supervisor
→ PVC-05 Platform Director / CAPITAL-AI-GOV
→ PVC-06 Version Management
→ PVC-07 Release Management
→ PVC-08 Production Operations
→ PVC-18 EventMesh / Traceability
```

Project ownership is resolved through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. No withdrawn post-PVC routing overlay is required for ordinary project execution.

## 3. Authority invariants

1. `/AGENTS.md` remains the trust root.
2. Governance owns Development lifecycle policy and protected decision controls; OPS owns Controlled Implementation execution coordination, not Governance authority.
3. `package.json#version` remains the sole platform-version authority.
4. VersionManager remains read-only compatibility.
5. Release Version Gate remains the controlled platform-version transition mechanism.
6. Supervisor may observe, evaluate, escalate and execute only explicitly approved bounded recovery; it may not make protected decisions.
7. EventMesh creates no authority and its public-interface dependency direction remains intact.
8. Traceability remains non-deciding/non-authorizing.
9. Release does not imply Production deployment.
10. Production mutation requires separate current authorization.
11. Security verification remains independent under CAPITAL-AI-SEC.
12. Browser/local subscription projection is presentation state only and cannot grant a protected capability.
13. Pull Request merge remains Human/CODEOWNER-only.

## 4. Workstreams

| Workstream | PVC | Scope | Current state |
|---|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | current-main correlation, branch/claim lifecycle, bounded implementation, pre-PR evidence | ACTIVE — User Lifecycle repository/provider evidence ready; `OPS-02-SEC-06` parent inventory evidence ready; foreign children remain |
| `OPS-04` Supervisor | `PVC-04` | observation, evaluation, escalation, approved bounded recovery | PARTIAL |
| `OPS-06` Version Management | `PVC-06` | toolchain/version identity and controlled transition coordination | PARTIAL / BOUNDARY RESOLVED |
| `OPS-07` Release Management | `PVC-07` | Release candidate evidence, gate execution, rollback contract | PARTIAL |
| `OPS-08` Production Operations | `PVC-08` | readiness, health, post-deploy verification, incident/recovery, reliability/capacity | PARTIAL — User Lifecycle subscription identity provider correlation PASS; isolated provider scenarios remain |
| `OPS-18` EventMesh & Traceability | `PVC-18` | EventMesh reliability plus non-authorizing trace/evidence linkage | PARTIAL |

## 5. Component placement

No runtime component is moved solely for organizational ownership:

| Component | Canonical path | Decision |
|---|---|---|
| Supervisor | `src/platform/Supervisor` | REUSE IN PLACE |
| VersionManager | `src/platform/VersionManager` | REUSE IN PLACE / READ-ONLY |
| Release | `src/platform/Release` | REUSE IN PLACE |
| EventMesh | `src/platform/EventMesh` | REUSE IN PLACE |
| Traceability | `src/platform/Traceability` | REUSE IN PLACE |
| Production runtime | existing server/provider/deployment paths | REUSE; no monolithic OPS runtime |

## 6. Security handoffs from CAPITAL-AI-SEC PR #631

| Security finding | Project stage | OPS responsibility | Security gate | Target state |
|---|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `PVC-06` | converge approved Node identity in target-owned config/control-plane | independent Security identity verification | OPS remediation/evidence |
| `S1-R2-04` fatal process handling | `PVC-04` + evidence from `PVC-08` | fail-fast implementation/recovery evidence | negative child-process + runtime recovery verification | OPS remediation/evidence |
| `S1-R2-05` Stripe redirect boundary | `PVC-02` | server-owned redirect policy in affected implementation | open-redirect DENY verification | separate OPS remediation |
| `S1-R2-06` entitlement authority | `PVC-02` | parent protected-capability inventory and server-enforcement coordination | escalation/forgery/missing-auth/stale-entitlement/alternate-path DENY verification | **PARENT INVENTORY EVIDENCE READY / CHILD REMEDIATION REFERRED / SECURITY VERIFICATION PENDING** |
| `S1-R2-07` recovery / RPO / RTO | `PVC-08` | approved recovery objectives, recurring off-site backup, isolated measured restore | Security verifies measured/integrity evidence | OPS runtime evidence |
| `S1-R2-09` strict CSP promotion | `PVC-08` | no strict promotion until compatibility evidence is accepted | Security verifies promotion evidence | WAITING_FOR_EVIDENCE |
| `S1-R2-10` demo billing isolation | `PVC-08` | production bundle/runtime reachability evidence | Security verifies DEV simulation unreachable | WAITING_FOR_EVIDENCE |

`S1-R2-11` remains primary `CAPITAL-AI-DATA / PVC-10`. OPS accepts only a later secondary code/tooling dependency if DATA/Security identifies an OPS-owned implementation requirement.

### S1-R2-06 parent result

Canonical evidence: `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`.

The seven canonical subscription capabilities are classified against current `main`. Residuals remain owner-routed. The User Lifecycle package strengthens stable user-ID subscription projection and authenticated readback but does not transfer productive FINTECH/DATA capability ownership to OPS.

## 7. Priority execution queue

1. `OPS-02-SEC-06` — **parent inventory EVIDENCE_READY**; track foreign child returns and CAPITAL-AI-SEC verification without absorbing foreign remediation.
2. `OPS-06-SEC-03` — Node control-plane convergence (`S1-R2-03`).
3. `OPS-04-SEC-04` — fatal process handling and recovery contract (`S1-R2-04`).
4. `OPS-02-SEC-05` — Stripe redirect boundary (`S1-R2-05`).
5. `OPS-08-SEC-07` — recovery/RPO/RTO evidence (`S1-R2-07`).
6. `OPS-08-SEC-09` — CSP promotion evidence (`S1-R2-09`).
7. `OPS-08-SEC-10` — production billing-isolation evidence (`S1-R2-10`).
8. `OPS-07-A` — Release evidence contract correlation.
9. `OPS-18-A` — EventMesh/Traceability operational coverage.
10. reliability/capacity and lower-priority operational evidence packages.

No Security finding is marked VERIFIED by this roadmap.

## 8. Cross-project dependencies

- `CAPITAL-AI-GOV / PVC-05`: policy/Platform Director decisions and governance authority.
- `CAPITAL-AI-DOC / PVC-03`: Documentary/evidence stage.
- `CAPITAL-AI-SEC`: Security requirements/findings/tests/independent verification; no productive PVC ownership.
- `CAPITAL-AI-DATA / PVC-09`: R2-06 Newsfeed evidence-ingress child remediation.
- `CAPITAL-AI-DATA / PVC-10`: S1-R2-11 primary evidence identity/freshness ownership.
- `CAPITAL-AI-FINTECH / PVC-15`: R2-06 backtest/Monte-Carlo/full-AI/Buffett productive-capability child remediation.
- `CAPITAL-AI-FINTECH / PVC-16`: R2-06 canonical verified-screening alternate-route child remediation.
- `CAPITAL-AI-CLIENT / PVC-01`: child entitlement work only if a productive Client path is later identified.
- SEO/marketing surfaces may supply CSP compatibility evidence but own no Production Operations stage.

Foreign-owner User Lifecycle work is intentionally deferred until the OPS package is completed, per Owner direction.

## 9. Validation / Definition of Done

- [x] canonical OPS project path aligned to `docs/projects/operations/`;
- [x] `PVC-*` project namespace used explicitly;
- [x] PVC-02/04/06/07/08/18 uniquely assigned to CAPITAL-AI-OPS;
- [x] Development lifecycle authority preserved;
- [x] no second Version, Release, EventMesh, Traceability or Production architecture;
- [x] Security PR #631 dependencies correlated to OPS-owned stages;
- [x] R2-11 remains DATA-owned unless a secondary OPS dependency is created;
- [x] Security return boundary defined;
- [x] `OPS-02-SEC-06` parent protected-capability inventory completed without foreign implementation;
- [x] User Lifecycle harness/repository identity contract present on main;
- [x] User Lifecycle stable-user-ID projection confirmed read-only on connected Supabase provider;
- [x] stale merged Auth Lifecycle writer terminalized in the closeout candidate;
- [ ] historical Supabase migration baseline reconciled sufficiently for reproducible clean local application-schema replay;
- [ ] Supabase Local/Mailpit and applicable cross-user provider E2E executed in an isolated reproducible environment;
- [ ] Stripe sandbox/Test Clock lifecycle evidence executed with verified test-mode fixtures;
- [ ] CAPITAL-AI-SEC independent verification completed for applicable returned evidence;
- [ ] exact final PR-head hosted validation completed;
- [ ] Human Owner merge completed separately.

## 10. PR / production boundary

This roadmap does not authorize PR merge, Release transition or Production/provider mutation. Current Authority controls apply. Human/CODEOWNER merge remains mandatory. Any future protected provider configuration or Production mutation requires its own current authorization.

## 11. User Lifecycle current-main closeout — 2026-09-05

Canonical closeout package: `work-packages/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`; evidence: `evidence/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`.

Against `main@687105ffe90f649c8ada6310976826c9ea625f27`:

- PR #683 User Lifecycle harness is merged and present;
- repository stable-user-ID subscription migration is implemented;
- connected Supabase now runs the stable `metadata.user_id -> auth.users.id -> public.subscriptions.user_id` projection, confirmed read-only;
- remote migration history includes `user_lifecycle_subscription_identity_authority` as `20260905103413`;
- checked-in migrations still do not cover the beginning of hosted migration history, so full clean local application-schema replay is not yet proven;
- `public.subscriptions` RLS is enabled with authenticated own-row SELECT and explicit service-role access;
- Supabase Local/Mailpit and Stripe sandbox/Test Clock provider E2E remain `NOT_AVAILABLE` in the current connector execution surface;
- leaked-password protection remains disabled; changing it is a separate protected provider-config action;
- the stale active Auth Lifecycle claim left after merged PR #722 is released by the closeout branch;
- Annual Pro price drift remains foreign shared/product-contract work; OPS does not create or select a second Billing authority;
- Security re-verification remains exclusively with CAPITAL-AI-SEC.

The User Lifecycle closeout does not claim that all general OPS Security backlog is complete. `OPS-02-SEC-05` and other independently scoped Security-priority packages remain separate work items.
