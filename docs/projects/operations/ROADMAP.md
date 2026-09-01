# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.3.0`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-01`  
**Repository baseline:** `main@f40aeb084675d282a1a188bf05832ce9dc976836`  
**Open PR baseline:** none at this reconciliation; PR #683 merged during the PR-create gate and invalidated the prior approved snapshot  
**Primary project stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`

## 1. Objective

CAPITAL-AI-OPS is the organizational execution and runtime project for the recurring controlled-delivery lifecycle and the OPS-owned Project Value Chain stages. It connects Controlled Implementation, Supervisor, Version, Release, Production and EventMesh/Traceability while preserving existing Authorities and component boundaries.

Per `docs/projects/ROADMAP_REGISTRY.md`, this file is the sole organizational project execution/status roadmap for CAPITAL-AI-OPS. Bounded technical/program roadmaps remain detail or evidence inputs and do not become a second OPS project-status source.

## 2. Canonical flow

```text
PVC-02 Controlled Implementation
→ [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03] / project_stage PVC-03
→ PVC-04 Supervisor
→ [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05] / project_stage PVC-05
→ PVC-06 Version Management
→ PVC-07 Release Management
→ PVC-08 Production Operations
→ PVC-18 EventMesh / Traceability
```

`VC-*` in the marker is repository compatibility syntax. Project ownership is always stated explicitly through `project_namespace: PVC` and `project_stage: PVC-*`.

## 3. Authority invariants

1. `/AGENTS.md` remains the trust root.
2. Governance owns the DevelopmentChain execution policy and protected decision controls.
3. OPS owns Controlled Implementation execution coordination, not the policy authority.
4. `package.json#version` remains the sole platform-version authority.
5. VersionManager remains read-only compatibility.
6. Release Version Gate remains the only controlled platform-version transition mechanism.
7. Supervisor may observe, evaluate, escalate and execute only explicitly approved bounded recovery; it may not make protected decisions.
8. EventMesh creates no authority and its public-interface dependency direction remains intact.
9. Traceability remains non-deciding/non-authorizing.
10. Release does not imply Production deployment.
11. Production mutation requires separate current authorization.
12. Security verification remains independent under CAPITAL-AI-SEC.
13. Human/CODEOWNER merge remains non-delegable under the current Governance baseline, including ADR-0104 v1.2 hardening from PR #684.

## 4. Current-main reconciliation — 2026-09-01

| Item | Correlated state | OPS treatment |
|---|---|---|
| PR #632 — OPS project surface / Security handoffs | `MERGED`; historical writer already `released/non-exclusive` | retain as project-surface and Security-handoff evidence |
| PR #642 — Alpha Vantage secret/deployment control plane | `MERGED`; repository implementation is on main | stale writer terminalized in this reconciliation candidate; no Production secret/deploy mutation is asserted |
| PR #648 — one-hour merged-branch cleanup | `MERGED` | retain as `PVC-02` branch-lifecycle hardening evidence |
| PR #679 — Documentary Mermaid projection | `MERGED`, foreign `PVC-03` | no OPS changed-file/semantic overlap; incorporated without expanding OPS scope |
| PR #684 — ADR-0104 v1.2 Governance hardening | `MERGED`, Governance `PVC-05` | current Governance baseline; no local Governance Authority mutation |
| PR #683 — User Lifecycle Harness | `MERGED` at `f40aeb084675d282a1a188bf05832ce9dc976836`; repository implementation exists | retain as `PVC-02` implementation evidence plus bounded `PVC-08` provider/runtime evidence; provider execution is partial, unexecuted scenarios remain `NOT_AVAILABLE`, and `EVIDENCE_READY` is not claimed; stale writer terminalized in this candidate |

The reconciliation package changes claim/project coordination metadata only. It does not modify the eight Lifecycle implementation/test/evidence paths merged through PR #683, mutate provider/Production state, claim Security verification or absorb Frontend/Compliance work.

## 5. Workstreams

| Workstream | PVC | Scope | Current state |
|---|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | current-main correlation, branch/claim lifecycle, bounded implementation, pre-PR evidence | ACTIVE / CURRENT-MAIN RECONCILED; ULS REPOSITORY IMPLEMENTATION MERGED |
| `OPS-04` Supervisor | `PVC-04` | observation, evaluation, escalation, approved bounded recovery | PARTIAL |
| `OPS-06` Version Management | `PVC-06` | toolchain/version identity and controlled transition coordination | PARTIAL / BOUNDARY RESOLVED |
| `OPS-07` Release Management | `PVC-07` | Release candidate evidence, gate execution, rollback contract | PARTIAL |
| `OPS-08` Production Operations | `PVC-08` | readiness, health, post-deploy verification, incident/recovery, reliability/capacity | PARTIAL / ULS PROVIDER EXECUTION PARTIAL |
| `OPS-18` EventMesh & Traceability | `PVC-18` | EventMesh reliability plus non-authorizing trace/evidence linkage | PARTIAL |

## 6. Component placement

No runtime component is moved solely for organizational ownership:

| Component | Canonical path | Decision |
|---|---|---|
| Supervisor | `src/platform/Supervisor` | REUSE IN PLACE |
| VersionManager | `src/platform/VersionManager` | REUSE IN PLACE / READ-ONLY |
| Release | `src/platform/Release` | REUSE IN PLACE |
| EventMesh | `src/platform/EventMesh` | REUSE IN PLACE |
| Traceability | `src/platform/Traceability` | REUSE IN PLACE |
| Production runtime | existing server/provider/deployment paths | REUSE; no monolithic OPS runtime |

## 7. Security handoffs from CAPITAL-AI-SEC PR #631

| Security finding | Project stage | OPS responsibility | Security gate | Target state |
|---|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `PVC-06` | converge approved Node identity in target-owned config/control-plane | independent Security identity verification | `REFERRED_NOT_EXECUTED` → OPS remediation |
| `S1-R2-04` fatal process handling | `PVC-04` + evidence from `PVC-08` | fail-fast implementation/recovery evidence | negative child-process + runtime recovery verification | OPS remediation/evidence |
| `S1-R2-05` Stripe redirect boundary | `PVC-02` | server-owned canonical redirect policy | open-redirect DENY verification | OPS remediation |
| `S1-R2-06` entitlement authority | `PVC-02` | parent protected-capability inventory and server-enforcement coordination | escalation/forgery/missing-auth DENY verification | ACTIVE parent package |
| `S1-R2-07` recovery / RPO / RTO | `PVC-08` | approved objectives, recurring encrypted off-site backup, isolated measured restore | Security verifies measured/integrity evidence | OPS runtime evidence |
| `S1-R2-09` strict CSP promotion | `PVC-08` | no strict promotion until compatibility evidence is accepted | Security verifies promotion evidence | WAITING_FOR_EVIDENCE |
| `S1-R2-10` demo billing isolation | `PVC-08` | production bundle/runtime reachability evidence | Security verifies DEV simulation unreachable | WAITING_FOR_EVIDENCE |

`S1-R2-11` remains primary `CAPITAL-AI-DATA / PVC-10`. OPS accepts only a later secondary code/tooling handoff if DATA/Security identifies an OPS-owned implementation dependency.

## 8. User-Lifecycle inbound handoff

`GOV-CHAT-040` / `PR-OPS-ULS-HARNESS` is an OPS-owned dependency with primary `PVC-02` and secondary `PVC-08` evidence scope. PR #683 has merged the repository implementation for:

- lifecycle/provider harness;
- repository/provider contract tests;
- subscription-identity migration source;
- durable webhook/outbox/subscription projection evidence;
- stable server-side authentication/billing test contract.

The merged evidence record explicitly reports `CANDIDATE IMPLEMENTED / PROVIDER EXECUTION PARTIAL`. Supabase Local/Mailpit and Stripe Sandbox/Test Clock scenarios not actually executed remain `NOT_AVAILABLE`; the migration is not deployed; no Production mutation occurred; `EVIDENCE_READY` and Security `VERIFIED/CLOSED` are not claimed.

This handoff does not transfer Frontend projection, Security verification, Compliance/legal assessment or Governance closeout authority. Those downstream owners remain dependent on sufficient returned OPS/FE evidence according to the current Governance dependency map.

## 9. Priority execution queue

1. `OPS-02-SEC-06` — premium/protected capability inventory and child-owner routing (`S1-R2-06`).
2. `OPS-02-GOV-040` — repository implementation merged in PR #683; remaining work is evidence closure for unavailable provider scenarios and downstream return correlation, not duplicate implementation.
3. `OPS-06-SEC-03` — Node control-plane convergence (`S1-R2-03`).
4. `OPS-04-SEC-04` — fatal process handling and recovery contract (`S1-R2-04`).
5. `OPS-02-SEC-05` — Stripe redirect boundary (`S1-R2-05`).
6. `OPS-08-SEC-07` — recovery/RPO/RTO evidence (`S1-R2-07`).
7. `OPS-08-SEC-09` — CSP promotion evidence (`S1-R2-09`).
8. `OPS-08-SEC-10` — production billing-isolation evidence (`S1-R2-10`).
9. `OPS-07-A` — Release evidence contract correlation.
10. `OPS-18-A` — EventMesh/Traceability operational coverage.
11. reliability/capacity and lower-priority operational evidence packages.

`OPS-02-SEC-06` and `OPS-02-GOV-040` remain semantically adjacent around entitlement/auth/billing boundaries, but no parallel duplicate implementation is created. Any next technical package requires a fresh current-main/changed-file/semantic-overlap correlation.

No Security finding is marked VERIFIED by this roadmap.

## 10. Cross-project dependencies

- `CAPITAL-AI-GOV / PVC-05`: policy/Platform Director decisions, governance authority, project model, User-Lifecycle decisions and current ADR-0104 v1.2 baseline.
- `CAPITAL-AI-DOC / PVC-03`: Documentary/evidence handoff.
- `CAPITAL-AI-SEC`: Security requirements/findings/tests/independent verification; no productive PVC ownership.
- `CAPITAL-AI-DATA / PVC-10`: S1-R2-11 primary evidence identity/freshness ownership.
- `CAPITAL-AI-CLIENT / PVC-01` and `CAPITAL-AI-FINTECH / PVC-12..17`: child entitlement remediation only when the R2-06 inventory identifies their productive code.
- `CAPITAL-AI-FE`: User-Lifecycle presentation/projection consumer; consumes sufficient stable OPS contract/evidence without receiving OPS ownership.
- `CAPITAL-AI-COMP`: independent consumer/compliance assessment after OPS/FE evidence; technical evidence does not create legal authority.
- SEO/marketing surfaces may supply CSP compatibility evidence but own no Production Operations stage.

## 11. Validation / Definition of Done

- [x] canonical OPS project path aligned to `docs/projects/operations/`;
- [x] `PVC-*` project namespace used explicitly;
- [x] PVC-02/04/06/07/08/18 uniquely assigned to CAPITAL-AI-OPS;
- [x] DevelopmentChain authority preserved;
- [x] no second Version, Release, EventMesh, Traceability or Production architecture;
- [x] Security PR #631 handoffs correlated to OPS-owned stages;
- [x] R2-11 remains DATA-owned unless a secondary OPS handoff is created;
- [x] Security return contract defined;
- [x] current-main roadmap role reconciled to `ROADMAP_REGISTRY.md`;
- [x] merged PR #642 stale writer terminalization represented in this candidate;
- [x] merged PR #648 branch-lifecycle evidence correlated to `PVC-02`;
- [x] `GOV-CHAT-040` accepted into OPS planning;
- [x] PR #683 repository implementation merged and re-correlated;
- [x] PR #683 stale post-merge writer terminalization represented in this candidate;
- [ ] unavailable provider scenarios executed where infrastructure/authorization becomes available;
- [ ] sufficient OPS lifecycle evidence returned to downstream owners;
- [ ] target-owned technical remediation packages implemented on separate bounded branches where code changes are required;
- [ ] applicable positive/negative Security tests executed per package;
- [ ] CAPITAL-AI-SEC independent verification completed for returned evidence;
- [ ] exact-candidate PR validation and Human/CODEOWNER merge completed.

## 12. PR / production boundary

This roadmap does not authorize PR creation, merge, Release transition or Production mutation. Exact-main/head Owner approval remains mandatory before PR creation; Human/CODEOWNER merge remains separate and non-delegable; Production mutation requires a separate current gate.
