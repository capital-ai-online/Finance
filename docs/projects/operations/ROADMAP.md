# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.4.0`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-05`  
**Correlation baseline:** `main@4e9dedd74aee1f9b3609037d1abb4fef0932a1b6`  
**Open PR baseline:** zero open PRs against `main`; merged PR #746 changed only `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_REQUIREMENTS_INVENTORY.md` and is included in this resynchronized baseline without OPS changed-file/authority conflict  
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
14. Provider/model identity is metadata, never execution or governance authority; DR-03 must reuse ESS-0019 and existing IAM/capability/policy/audit boundaries.

## 4. Workstreams

| Workstream | PVC | Scope | Current state |
|---|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | current-main correlation, branch/claim lifecycle, bounded implementation, pre-PR evidence | ACTIVE — User Lifecycle closeout is merged/terminal; `OPS-02-SEC-06` parent inventory evidence ready; foreign children and Security verification remain |
| `OPS-04` Supervisor | `PVC-04` | observation, evaluation, escalation, approved bounded recovery | IMPLEMENTED / VERIFICATION PENDING — fatal-process fail-fast implementation merged in PR #720; independent post-deploy/Security recovery evidence remains |
| `OPS-06` Version Management | `PVC-06` | toolchain/version identity and controlled transition coordination | ACTIVE P1 GAP — `OPS-06-SEC-03` requires Node 24.20.0 while current `.nvmrc` remains 24.18.0 |
| `OPS-07` Release Management | `PVC-07` | Release candidate evidence, gate execution, rollback contract | PARTIAL |
| `OPS-08` Production Operations | `PVC-08` | readiness, health, post-deploy verification, incident/recovery, reliability/capacity | PARTIAL — User Lifecycle repository/provider correlation is terminal; recovery/CSP/billing-isolation evidence remains open |
| `OPS-18` EventMesh & Traceability | `PVC-18` | EventMesh reliability plus non-authorizing trace/evidence linkage | PARTIAL |

## 5. Component placement

No runtime component is moved solely for organizational ownership:

| Component | Canonical path | Decision |
|---|---|---|
| Supervisor | `src/platform/Supervisor` | REUSE IN PLACE |
| Provider profiles / provider-neutral IAM | `src/platform/Security/providerProfile.ts`, `src/platform/Security/agentIam.ts` | REUSE / EXTEND ONLY |
| VersionManager | `src/platform/VersionManager` | REUSE IN PLACE / READ-ONLY |
| Release | `src/platform/Release` | REUSE IN PLACE |
| EventMesh | `src/platform/EventMesh` | REUSE IN PLACE |
| Traceability | `src/platform/Traceability` | REUSE IN PLACE |
| Production runtime | existing server/provider/deployment paths | REUSE; no monolithic OPS runtime |

## 6. Security handoffs from CAPITAL-AI-SEC PR #631

| Security finding | Project stage | OPS responsibility | Security gate | Current OPS disposition |
|---|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `PVC-06` | converge approved Node identity in target-owned config/control-plane | independent Security identity verification | **OPEN / HIGHEST EXECUTABLE P1 OPS GAP** |
| `S1-R2-04` fatal process handling | `PVC-04` + evidence from `PVC-08` | fail-fast implementation/recovery evidence | negative child-process + runtime recovery verification | **IMPLEMENTED ON MAIN via PR #720 / SECURITY + POST-DEPLOY VERIFICATION PENDING** |
| `S1-R2-05` Stripe redirect boundary | `PVC-02` | server-owned redirect policy in affected implementation | open-redirect DENY verification | OPEN / separate OPS remediation |
| `S1-R2-06` entitlement authority | `PVC-02` | parent protected-capability inventory and server-enforcement coordination | escalation/forgery/missing-auth/stale-entitlement/alternate-path DENY verification | **PARENT INVENTORY EVIDENCE READY / CHILD REMEDIATION REFERRED / SECURITY VERIFICATION PENDING** |
| `S1-R2-07` recovery / RPO / RTO | `PVC-08` | approved recovery objectives, recurring off-site backup, isolated measured restore | Security verifies measured/integrity evidence | OPEN / UNVERIFIED |
| `S1-R2-09` strict CSP promotion | `PVC-08` | no strict promotion until compatibility evidence is accepted | Security verifies promotion evidence | WAITING_FOR_EVIDENCE |
| `S1-R2-10` demo billing isolation | `PVC-08` | production bundle/runtime reachability evidence | Security verifies DEV simulation unreachable | WAITING_FOR_EVIDENCE |

`S1-R2-11` remains primary `CAPITAL-AI-DATA / PVC-10`. OPS accepts only a later secondary code/tooling dependency if DATA/Security identifies an OPS-owned implementation requirement.

### S1-R2-06 parent result

Canonical evidence: `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`.

The seven canonical subscription capabilities are classified against current `main`. Residuals remain owner-routed. The User Lifecycle package strengthens stable user-ID subscription projection and authenticated readback but does not transfer productive FINTECH/DATA capability ownership to OPS.

## 7. Priority execution queue

The queue is ordered by the current trust-root priority model: Security/Data Integrity before architecture/integration. Terminal work is removed from the executable queue but remains traceable below.

1. `OPS-02-SEC-06` — **parent inventory EVIDENCE_READY**; coordinate foreign child returns and CAPITAL-AI-SEC verification without absorbing foreign remediation.
2. `OPS-06-SEC-03` — **OPEN / HIGHEST EXECUTABLE** — Node control-plane convergence (`S1-R2-03`); current `.nvmrc` 24.18.0 still differs from required 24.20.0.
3. `OPS-02-SEC-05` — OPEN — Stripe redirect boundary (`S1-R2-05`).
4. `OPS-08-SEC-07` — OPEN / UNVERIFIED — recovery/RPO/RTO evidence (`S1-R2-07`).
5. `OPS-08-SEC-09` — WAITING_FOR_EVIDENCE — CSP promotion evidence (`S1-R2-09`).
6. `OPS-08-SEC-10` — WAITING_FOR_EVIDENCE — production billing-isolation evidence (`S1-R2-10`).
7. `OPS-07-A` — Release evidence contract correlation.
8. `OPS-18-A` — EventMesh/Traceability operational coverage.
9. `DR-03` — **QUEUED / BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE** — provider-adapter/execution integration after terminal GOV-03/DR-02B; no priority promotion over the active OPS gates above.
10. reliability/capacity and lower-priority operational evidence packages.

`OPS-04-SEC-04` is no longer an executable remediation item: PR #720 merged the fail-fast implementation. Independent Security/post-deploy recovery verification remains an external verification gate and must not be reported as `VERIFIED/CLOSED` by OPS.

No Security finding is marked VERIFIED by this roadmap.

## 8. DR-03 current-main correlation — 2026-09-05

**Current state:** `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE`.

The former Governance dependency is satisfied on current main:

- current `main@4e9dedd74aee1f9b3609037d1abb4fef0932a1b6` contains Human-merged PR #743;
- `ADR-0060` is `v1.1.0 ACCEPTED / ACTIVE`;
- `ESS-0019` is `v1.2.0 ACCEPTED`;
- repository architecture routes productive DR-03 provider-adapter/execution work to CAPITAL-AI-OPS after terminal DR-02B/GOV-03.

The subsequent merged PR #746 is confined to the CAPITAL-AI-COMP requirements inventory and introduces no competing OPS owner, execution authority or changed-file overlap. This removes the former Governance block but does not make DR-03 the highest OPS priority. `OPS-06-SEC-03` remains an unresolved P1/HIGH current-main gap and therefore precedes DR-03.

### DR-03 reuse/gap disposition

| Capability | Existing implementation | Gap | Owner | DR-03 action |
|---|---|---|---|---|
| provider profiles / canonical provider inventory | `src/platform/Security/providerProfile.ts` with ChatGPT/OpenAI, Claude/Anthropic and Grok/xAI profiles | no new registry required | CAPITAL-AI-OPS execution use; Security/Governance contracts remain authoritative | REUSE |
| provider-neutral identity/capability authorization | `src/platform/Security/agentIam.ts`, existing capability/grant controls | adapter invocation must remain behind these gates | existing Primary Owners; OPS consumes | REUSE |
| Supervisor provider-chain observation | `src/platform/Supervisor/agentProviderObservation.ts` / `observeAgentProviderChain()` | productive adapter execution evidence not yet attached | CAPITAL-AI-OPS / PVC-04 | EXTEND when DR-03 executes |
| request/orchestration boundary | ESS-0019 provider-neutral request → capability → policy → tool execution chain plus existing Supervisor execution paths | concrete productive provider-adapter contract needs bounded correlation/implementation | CAPITAL-AI-OPS / PVC-02 | EXTEND |
| audit/trace correlation | ESS-0019 OpenTelemetry/W3C Trace Context contract and existing traceability surfaces | provider-adapter parity/evidence must preserve correlation | CAPITAL-AI-OPS / PVC-18 | REUSE / EXTEND evidence only |
| provider adapters | provider profiles/connectors exist; no separate productive OpenAI/Anthropic/xAI adapter layer was found in current-main scan | minimal adapter boundary/parity implementation remains | CAPITAL-AI-OPS / PVC-02 | EXTEND; do not create second control plane |
| production mutation / deployment identity | existing Release/Production gates | DR-03 must not couple execution integration to deploy/provider mutation | CAPITAL-AI-OPS / PVC-07/PVC-08 plus Human gate | DO NOT IMPLEMENT in DR-03 |
| Governance / release / identity / registry authority | existing repository authorities | no gap belongs to DR-03 | foreign/current canonical owners | DO NOT IMPLEMENT |

When DR-03 becomes executable, its first implementation must be the smallest provider-neutral adapter step behind existing capability/policy/IAM/audit boundaries, with fail-closed provider errors and provider-parity allow/deny evidence. It must not enable remote skill loading, reconstruct M10, create a second Agent Control Plane or grant Production mutation.

## 9. Cross-project dependencies

- `CAPITAL-AI-GOV / PVC-05`: policy/Platform Director decisions and governance authority; GOV-03/DR-02B dependency for DR-03 is terminal on current main.
- `CAPITAL-AI-DOC / PVC-03`: Documentary/evidence stage.
- `CAPITAL-AI-SEC`: Security requirements/findings/tests/independent verification; no productive PVC ownership.
- `CAPITAL-AI-DATA / PVC-09`: R2-06 Newsfeed evidence-ingress child remediation.
- `CAPITAL-AI-DATA / PVC-10`: S1-R2-11 primary evidence identity/freshness ownership.
- `CAPITAL-AI-FINTECH / PVC-15`: R2-06 backtest/Monte-Carlo/full-AI/Buffett productive-capability child remediation.
- `CAPITAL-AI-FINTECH / PVC-16`: R2-06 canonical verified-screening alternate-route child remediation.
- `CAPITAL-AI-CLIENT / PVC-01`: child entitlement work only if a productive Client path is later identified.
- SEO/marketing surfaces may supply CSP/GA4 compatibility evidence but own no Production Operations stage; OPS does not absorb SEO/marketing authority.

## 10. Current-main OPS chat/work-item reconciliation

The following repository-backed OPS work items referenced by recent OPS execution chats are terminal on current main and must not remain active writers or executable roadmap items:

| Work item | Repository result | Current disposition |
|---|---|---|
| Alpha Vantage canonical secret/deployment contract | PR #642 merged | DONE_MAIN; Production secret/deploy mutation remains separate and is not implied |
| M10 Passkey runtime retirement | PR #691 merged; trust root declares M10 runtime retired/off | DONE_MAIN / do not reconstruct |
| Fatal Process Handling `OPS-04-SEC-04` | PR #720 merged | IMPLEMENTED_ON_MAIN; independent Security/post-deploy verification pending |
| R-Class PR build suppression / CI cost control | PR #721 merged | DONE_MAIN |
| Auth Lifecycle re-correlation | PR #722 merged; stale claim already released by User Lifecycle closeout | DONE_MAIN |
| User Lifecycle OPS closeout | PR #729 merged | DONE_MAIN for OPS repository/read-only-provider closeout; provider E2E unavailable evidence and Security verification remain explicit external/open gates |
| GOV-03 / DR-02B authority reconciliation | PR #743 merged under CAPITAL-AI-GOV | FOREIGN_DEPENDENCY_TERMINAL; enables DR-03 correlation but transfers no Governance ownership to OPS |

Four OPS claim files still said `active` despite their own merge/close release conditions: Alpha Vantage V2, Fatal Process Handling, R-Class No-PR-Build and User Lifecycle Closeout. This roadmap reconciliation terminalizes those stale coordination records in the bounded OPS branch. Work claims are coordination metadata only and do not create repository authority.

GA4/Consent production verification remains evidence-only: repository code provides the inert `ga-measurement-id` metadata/consent bridge contract, but browser Network/GA4 Realtime behavior is not proven by repository state alone. No completion claim is derived from chat-only/manual runtime observations.

## 11. Validation / Definition of Done

- [x] canonical OPS project path aligned to `docs/projects/operations/`;
- [x] `PVC-*` project namespace used explicitly;
- [x] PVC-02/04/06/07/08/18 uniquely assigned to CAPITAL-AI-OPS;
- [x] Development lifecycle authority preserved;
- [x] no second Version, Release, EventMesh, Traceability, Agent Control Plane or Production architecture;
- [x] Security PR #631 dependencies correlated to OPS-owned stages;
- [x] R2-11 remains DATA-owned unless a secondary OPS dependency is created;
- [x] Security return boundary defined;
- [x] `OPS-02-SEC-06` parent protected-capability inventory completed without foreign implementation;
- [x] `OPS-04-SEC-04` fail-fast implementation merged in PR #720 without claiming Security closure;
- [x] User Lifecycle harness/repository identity contract present on main;
- [x] User Lifecycle stable-user-ID projection confirmed read-only on connected Supabase provider by the merged closeout evidence;
- [x] stale merged Auth Lifecycle writer terminalized in PR #729;
- [x] DR-03 Governance dependency terminalized by PR #743 and DR-03 materialized in the OPS queue without priority promotion;
- [ ] `OPS-06-SEC-03` Node 24.20.0 control-plane convergence implemented and evidenced;
- [ ] `OPS-02-SEC-05` Stripe redirect boundary implemented/evidenced;
- [ ] recovery/RPO/RTO, CSP and billing-isolation OPS evidence completed as scoped above;
- [ ] historical Supabase migration baseline reconciled sufficiently for reproducible clean local application-schema replay;
- [ ] Supabase Local/Mailpit and applicable cross-user provider E2E executed in an isolated reproducible environment;
- [ ] Stripe sandbox/Test Clock lifecycle evidence executed with verified test-mode fixtures;
- [ ] CAPITAL-AI-SEC independent verification completed for applicable returned evidence;
- [ ] DR-03 implementation started only after higher-priority OPS gates permit it;
- [ ] exact final PR-head hosted validation completed for any future implementation PR;
- [ ] Human Owner merge completed separately.

## 12. PR / production boundary

This roadmap does not authorize PR merge, Release transition or Production/provider mutation. Current Authority controls apply. Human/CODEOWNER merge remains mandatory. Any future protected provider configuration or Production mutation requires its own current authorization.

## 13. User Lifecycle terminal closeout — current-main reconciliation

Canonical closeout package: `work-packages/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`; evidence: `evidence/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`.

PR #729 is Human-merged and the OPS closeout is terminal on current main. The evidence remains bounded:

- repository stable-user-ID subscription migration is implemented;
- connected Supabase read-only evidence confirmed `metadata.user_id -> auth.users.id -> public.subscriptions.user_id` at closeout time;
- checked-in migrations still do not prove full clean replay of the earlier hosted migration history;
- Supabase Local/Mailpit and Stripe sandbox/Test Clock provider E2E were `NOT_AVAILABLE` in the closeout execution surface;
- leaked-password protection change remains a separate protected provider-config action;
- Annual Pro price drift and productive entitlement child work remain with their actual owners;
- Security re-verification remains exclusively with CAPITAL-AI-SEC.

The User Lifecycle closeout does not close `OPS-02-SEC-05`, `OPS-06-SEC-03`, other general OPS Security backlog or foreign-owner work.
