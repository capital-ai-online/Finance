# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.6.1`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-07`  
**Correlation baseline:** `main@0dd380ee7f78c5206ec24d507257f2a2347a1287`  
**Open PR baseline:** zero open PRs against current `main`; complementary OPS branch `agent/operations-recovery-rpo-evidence-20260907` is repository-local RPO measurement work with no changed-file overlap on this Roadmap and must resynchronize before any later PR gate  
**Primary project stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`

Canonical current-main Security backlog evidence: `evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md`.

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
3. An Accepted ADR is not silently overridden by a lower-precedence project roadmap. Unresolved authority divergence is fail-closed.
4. `package.json#version` remains the sole platform-version authority.
5. VersionManager remains read-only compatibility.
6. Release Version Gate remains the controlled platform-version transition mechanism.
7. Supervisor may observe, evaluate, escalate and execute only explicitly approved bounded recovery; it may not make protected decisions.
8. EventMesh creates no authority and its public-interface dependency direction remains intact.
9. Traceability remains non-deciding/non-authorizing.
10. Release does not imply Production deployment.
11. Production mutation requires separate current authorization.
12. Security verification remains independent under CAPITAL-AI-SEC.
13. Browser/local subscription projection is presentation state only and cannot grant a protected capability.
14. Pull Request merge remains Human/CODEOWNER-only.
15. Provider/model identity is metadata, never execution or governance authority; DR-03 must reuse ESS-0019 and existing IAM/capability/policy/audit boundaries.

## 4. Workstreams

| Workstream | PVC | Scope | Current state |
|---|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | current-main correlation, branch/claim lifecycle, bounded implementation, pre-PR evidence | ACTIVE — User Lifecycle closeout is merged/terminal; GOV-07 OPS owner return is `EVIDENCE_READY / HUMAN-MERGED` via PR #794; provider E2E, independent Security verification and foreign-owner returns remain explicit gates; `OPS-02-SEC-06` parent inventory evidence ready; `OPS-02-SEC-05` implementation is already on main/evidence-ready |
| `OPS-04` Supervisor | `PVC-04` | observation, evaluation, escalation, approved bounded recovery | IMPLEMENTED / VERIFICATION PENDING — fatal-process fail-fast implementation merged in PR #720; independent post-deploy/Security recovery evidence remains |
| `OPS-06` Version Management | `PVC-06` | toolchain/version identity and controlled transition coordination | P1 GAP / BLOCKED_BY_AUTHORITY_CONFLICT — roadmap requests Node 24.20.0 while Accepted ADR-0053 still selects 24.18.0; OPS mutation stops pending Governance/ADR resolution |
| `OPS-07` Release Management | `PVC-07` | Release candidate evidence, gate execution, rollback contract | PARTIAL |
| `OPS-08` Production Operations | `PVC-08` | readiness, health, post-deploy verification, incident/recovery, reliability/capacity | PARTIAL — Recovery/RPO/RTO repository harness is `IMPLEMENTED_ON_MAIN` via PR #776; deterministic measured-RPO evaluation is implemented on the complementary OPS evidence branch; actual scheduled operational evidence, restore evidence and independent Security verification remain open |
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

## 6. Security handoffs from CAPITAL-AI-SEC

| Security finding | Project stage | OPS responsibility | Security gate | Current OPS disposition |
|---|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `PVC-06` | converge approved Node identity in target-owned config/control-plane | independent Security identity verification | **BLOCKED_BY_AUTHORITY_CONFLICT** — `.nvmrc` is 24.18.0; Accepted ADR-0053 selects 24.18.0; later 24.20.0 supersession remains proposed |
| `S1-R2-04` fatal process handling | `PVC-04` + evidence from `PVC-08` | fail-fast implementation/recovery evidence | negative child-process + runtime recovery verification | **IMPLEMENTED_ON_MAIN via PR #720 / SECURITY + POST-DEPLOY VERIFICATION PENDING** |
| `S1-R2-05` Stripe redirect boundary | `PVC-02` | server-owned redirect policy in affected implementation | open-redirect DENY verification | **IMPLEMENTED_ON_MAIN / EVIDENCE_READY / SECURITY VERIFICATION PENDING** |
| `S1-R2-06` entitlement authority | `PVC-02` | parent protected-capability inventory and server-enforcement coordination | escalation/forgery/missing-auth/stale-entitlement/alternate-path DENY verification | **PARENT INVENTORY EVIDENCE READY / CHILD REMEDIATION REFERRED / SECURITY VERIFICATION PENDING** |
| `S1-R2-07` recovery / RPO / RTO | `PVC-08` | approved recovery objectives, recurring off-site backup, isolated measured restore | Security verifies measured/integrity evidence | **REPOSITORY HARNESS IMPLEMENTED_ON_MAIN via PR #776 / RPO EVALUATOR IMPLEMENTED_BRANCH / OPERATIONAL_EVIDENCE_PENDING / SECURITY_UNVERIFIED** |
| `S1-R2-09` strict CSP promotion | `PVC-08` | no strict promotion until compatibility evidence is accepted | Security verifies promotion evidence | WAITING_FOR_EVIDENCE |
| `S1-R2-10` demo billing isolation | `PVC-08` | production bundle/runtime reachability evidence | Security verifies DEV simulation unreachable | WAITING_FOR_EVIDENCE |

`S1-R2-11` remains primary `CAPITAL-AI-DATA / PVC-10`. OPS accepts only a later secondary code/tooling dependency if DATA/Security identifies an OPS-owned implementation requirement.

### S1-R2-05 current-main result

Current main contains `server/middleware/stripeReturnUrlGuard.ts`, mounts it before `stripeRouter`, and contains focused positive/negative tests. The implementation rejects attacker-controlled origins, look-alike hosts, non-HTTPS Production destinations, credential-bearing URLs, unsafe schemes, malformed and relative-only inputs, while reusing the existing canonical origin policy rather than introducing a second allowlist.

OPS may therefore report `IMPLEMENTED_ON_MAIN / EVIDENCE_READY`; only CAPITAL-AI-SEC may independently report Security `VERIFIED/CLOSED`.

### S1-R2-06 parent result

Canonical evidence: `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`.

The seven canonical subscription capabilities are classified against current `main`. Residuals remain owner-routed. The User Lifecycle package strengthens stable user-ID subscription projection and authenticated readback but does not transfer productive FINTECH/DATA capability ownership to OPS.

### S1-R2-03 authority result

Current `.nvmrc` remains `24.18.0`. OPS/Security roadmap material requests Node `24.20.0`, and a deterministic transformer plus proposed write-boundary supersession exist. However, `docs/adr/ADR-0053-node24-lts-git255-toolchain.md` remains Accepted and explicitly chooses `24.18.0` for Production, CI and local development. No accepted superseding ADR was found in current-main correlation.

The Node package is therefore **non-executable** until CAPITAL-AI-GOV resolves the authority/supersession. OPS does not alter foreign Governance/ADR authority in this work package.

### S1-R2-07 recovery evidence result

Human-merged PR #776 provides the existing recurring encrypted off-site backup path, isolated Supabase restore drill, integrity comparison and measured database-restore duration. The complementary branch `agent/operations-recovery-rpo-evidence-20260907` reuses that architecture and adds only a deterministic evaluator for successful scheduled backup intervals against the database RPO target.

That branch does not itself prove actual scheduled RPO, restore success or full-service RTO. `S1-R2-07` therefore remains `OPEN / OPERATIONAL_EVIDENCE_PENDING / SECURITY_UNVERIFIED` until real evidence and independent CAPITAL-AI-SEC verification exist.

## 7. Priority execution queue

The queue is ordered by the current trust-root priority model: Security/Data Integrity before architecture/integration. Terminal implementation work is removed from the executable queue while external verification remains traceable.

1. `OPS-02-SEC-06` — **parent inventory EVIDENCE_READY**; coordinate foreign child returns and CAPITAL-AI-SEC verification without absorbing foreign remediation.
2. `OPS-06-SEC-03` — **P1/HIGH / BLOCKED_BY_AUTHORITY_CONFLICT** — Node convergence cannot execute until Governance/ADR authority resolves 24.18.0 vs 24.20.0.
3. `OPS-02-SEC-05` — **IMPLEMENTED_ON_MAIN / EVIDENCE_READY** — no further OPS remediation is planned; return for independent CAPITAL-AI-SEC verification.
4. `OPS-08-SEC-07` — **REPOSITORY IMPLEMENTATION PRESENT / OPERATIONAL EVIDENCE ACTIVE / SECURITY UNVERIFIED** — resynchronize the complementary RPO measurement branch, complete hosted validation, then collect real scheduled-backup/restore evidence without claiming Security closure.
5. `OPS-08-SEC-09` — WAITING_FOR_EVIDENCE — CSP promotion evidence.
6. `OPS-08-SEC-10` — WAITING_FOR_EVIDENCE — production billing-isolation evidence.
7. `OPS-07-A` — Release evidence contract correlation.
8. `OPS-18-A` — EventMesh/Traceability operational coverage.
9. `DR-03` — **QUEUED / BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE** — provider-adapter/execution integration after terminal GOV-03/DR-02B and after higher-priority executable OPS Security work permits priority promotion.
10. reliability/capacity and lower-priority operational evidence packages.

`OPS-04-SEC-04` and `OPS-02-SEC-05` are no longer executable remediation items. Independent Security/post-deploy verification remains external and must not be reported as `VERIFIED/CLOSED` by OPS.

No Security finding is marked VERIFIED by this roadmap.

## 8. DR-03 current-main correlation — 2026-09-07

**Current state:** `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE`.

The former Governance dependency is satisfied on current main:

- current `main@0dd380ee7f78c5206ec24d507257f2a2347a1287` includes terminal GOV-03/DR-02B work, Governance current-state reconciliation via Human-merged PR #796 and Documentary D8 roadmap synchronization via Human-merged PR #798;
- `ADR-0060` is `v1.1.0 ACCEPTED / ACTIVE`;
- `ESS-0019` is `v1.2.0 ACCEPTED`;
- repository architecture routes productive DR-03 provider-adapter/execution work to CAPITAL-AI-OPS after terminal DR-02B/GOV-03.

This does not make DR-03 the highest OPS priority. The Node P1 gap remains authority-blocked, and `OPS-08-SEC-07` measured operational evidence remains an executable Security/data-integrity gate that precedes DR-03.

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

- `CAPITAL-AI-GOV / PVC-05`: policy/Platform Director decisions and governance authority; Node 24.18.0/24.20.0 authority reconciliation is an explicit blocking dependency for `OPS-06-SEC-03`; GOV-03/DR-02B dependency for DR-03 is terminal.
- `CAPITAL-AI-DOC / PVC-03`: Documentary/evidence stage; D8 roadmap synchronization is current-main terminal via Human-merged PR #798.
- `CAPITAL-AI-SEC`: Security requirements/findings/tests/independent verification; no productive PVC ownership.
- `CAPITAL-AI-DATA / PVC-09`: R2-06 Newsfeed evidence-ingress child remediation.
- `CAPITAL-AI-DATA / PVC-10`: S1-R2-11 primary evidence identity/freshness ownership.
- `CAPITAL-AI-FINTECH / PVC-15`: R2-06 backtest/Monte-Carlo/full-AI/Buffett productive-capability child remediation.
- `CAPITAL-AI-FINTECH / PVC-16`: R2-06 canonical verified-screening alternate-route child remediation.
- `CAPITAL-AI-CLIENT / PVC-01`: child entitlement work only if a productive Client path is later identified.
- SEO/marketing surfaces may supply CSP/GA4 compatibility evidence but own no Production Operations stage; OPS does not absorb SEO/marketing authority.

## 10. Current-main OPS chat/work-item reconciliation

The following repository-backed OPS work items referenced by recent OPS execution chats are terminal, implementation-complete on current main or explicitly bounded as active evidence work and must not be misrepresented as fresh implementation gaps:

| Work item | Repository result | Current disposition |
|---|---|---|
| Alpha Vantage canonical secret/deployment contract | PR #642 merged | DONE_MAIN; Production secret/deploy mutation remains separate and is not implied |
| M10 Passkey runtime retirement | PR #691 merged; trust root declares M10 runtime retired/off | DONE_MAIN / do not reconstruct |
| Fatal Process Handling `OPS-04-SEC-04` | PR #720 merged | IMPLEMENTED_ON_MAIN; independent Security/post-deploy verification pending |
| R-Class PR build suppression / CI cost control | PR #721 merged | DONE_MAIN |
| Auth Lifecycle re-correlation | PR #722 merged; stale claim already released by User Lifecycle closeout | DONE_MAIN |
| User Lifecycle OPS closeout | PR #729 merged | DONE_MAIN for OPS repository/read-only-provider closeout; provider E2E unavailable evidence and Security verification remain explicit external/open gates |
| GOV-03 / DR-02B authority reconciliation | PR #743 merged under CAPITAL-AI-GOV | FOREIGN_DEPENDENCY_TERMINAL; enables DR-03 correlation but transfers no Governance ownership to OPS |
| Stripe Redirect Boundary `OPS-02-SEC-05` | `stripeReturnUrlGuard`, route composition and focused negative tests exist on main; implementation commit `bcefb1b2cdf2ecc56becfa7c5c8fcd6db8cbc43f` | IMPLEMENTED_ON_MAIN / EVIDENCE_READY; Security verification pending |
| DR-03 roadmap re-correlation metadata | PR #747 Human-merged; historical branch absent | DONE_MAIN; stale coordination claim terminalized |
| Recovery/RPO/RTO repository harness `OPS-08-SEC-07` | PR #776 Human-merged | IMPLEMENTED_ON_MAIN; actual scheduled RPO, isolated restore evidence/full-service RTO scope and independent Security verification remain open |
| GOV-07 User-Lifecycle Evidence Return | PR #794 Human-merged | EVIDENCE_READY; broader GOV-07 remains PARTIAL pending provider E2E, independent Security verification and remaining owner returns |
| Governance current-state reconciliation | PR #796 Human-merged | FOREIGN_DEPENDENCY_TERMINAL; OPS consumes the current projection without Governance ownership transfer |
| Documentary D8 roadmap synchronization | PR #798 Human-merged | FOREIGN_DEPENDENCY_TERMINAL; no OPS ownership transfer |
| RPO measurement evaluator | `agent/operations-recovery-rpo-evidence-20260907` | IMPLEMENTED_BRANCH / OPERATIONAL_EVIDENCE_PENDING / SECURITY_UNVERIFIED; no Roadmap changed-file overlap; must resync against current main before PR approval |

The stale `agent/operations-node-toolchain-24-20-20260906` branch is not an active implementation writer: it contained no Node convergence change when correlated. The older `agent/operations-qs-cve-20260905` branch is divergent dependency work with no changed-file overlap with this bounded OPS documentation package. Historical Roadmap/GOV-07 branches are non-authorizing coordination history and do not supersede current main.

GA4/Consent production verification remains evidence-only: repository code provides the inert `ga-measurement-id` metadata/consent bridge contract, but browser Network/GA4 Realtime behavior is not proven by repository state alone. No completion claim is derived from chat-only/manual runtime observations.

## 11. Validation / Definition of Done

- [x] canonical OPS project path aligned to `docs/projects/operations/`;
- [x] `PVC-*` project namespace used explicitly;
- [x] PVC-02/04/06/07/08/18 uniquely assigned to CAPITAL-AI-OPS;
- [x] Development lifecycle authority preserved;
- [x] no second Version, Release, EventMesh, Traceability, Agent Control Plane or Production architecture;
- [x] Security dependencies correlated to OPS-owned stages;
- [x] R2-11 remains DATA-owned unless a secondary OPS dependency is created;
- [x] Security return boundary defined;
- [x] `OPS-02-SEC-06` parent protected-capability inventory completed without foreign implementation;
- [x] `OPS-04-SEC-04` fail-fast implementation merged in PR #720 without claiming Security closure;
- [x] `OPS-02-SEC-05` current-main implementation and focused negative-test evidence correlated without claiming Security closure;
- [x] `OPS-06-SEC-03` 24.18.0/24.20.0 Accepted-ADR conflict identified and fail-closed at Governance ownership boundary;
- [x] User Lifecycle harness/repository identity contract present on main;
- [x] User Lifecycle stable-user-ID projection confirmed read-only on connected Supabase provider by the merged closeout evidence;
- [x] GOV-07 OPS Owner-Evidence Human-merged via PR #794 and retained as `EVIDENCE_READY` without claiming provider E2E or Security closure;
- [x] client `userId`, e-mail, localStorage state and client tier remain explicitly non-authoritative for paid subscription projection;
- [x] stale merged Auth Lifecycle writer terminalized in PR #729;
- [x] stale DR-03 roadmap claim terminalized after confirming Human-merged PR #747 and absent historical branch;
- [x] DR-03 Governance dependency terminalized and DR-03 retained in the queue without priority promotion;
- [x] `OPS-08-SEC-07` repository recovery/RPO/RTO harness implemented on main via PR #776 without claiming operational or Security closure;
- [ ] CAPITAL-AI-GOV resolves the Node baseline authority/supersession before OPS Node mutation;
- [ ] `OPS-06-SEC-03` Node control-plane convergence implemented/evidenced only after that authority resolution;
- [ ] `OPS-08-SEC-07` complementary RPO measurement branch resynchronized and independently hosted-validated;
- [ ] at least two successful scheduled backup evidence artifacts and corresponding read-only workflow-run metadata establish measured RPO;
- [ ] isolated restore integrity/DB-RTO evidence completed; full-service RTO remains separately scoped or measured;
- [ ] CSP and billing-isolation OPS evidence completed as scoped above;
- [ ] historical Supabase migration baseline reconciled sufficiently for reproducible clean local application-schema replay;
- [ ] Supabase Local/Mailpit and applicable cross-user provider E2E executed in an isolated reproducible environment;
- [ ] Stripe sandbox/Test Clock lifecycle evidence executed with verified test-mode fixtures;
- [ ] CAPITAL-AI-SEC independent verification completed for applicable returned evidence;
- [ ] DR-03 implementation started only after higher-priority OPS gates permit it;
- [ ] exact final branch-state validation/correlation completed before PR approval request;
- [ ] hosted validation completed after PR creation as applicable;
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

The User Lifecycle closeout itself did not close `OPS-02-SEC-05`; the separate current-main re-correlation establishes that its implementation is already present/evidence-ready. It does not close `OPS-06-SEC-03`, `OPS-08-SEC-07`, other general OPS Security backlog or foreign-owner work.

## 14. GOV-07 User-Lifecycle Evidence Return — current-main reconciliation

**Bounded work item:** `GOV-07 User-Lifecycle Evidence Return`  
**Canonical evidence:** `evidence/GOV_07_USER_LIFECYCLE_EVIDENCE_RETURN_2026-09-06.md`  
**OPS status:** `EVIDENCE_READY / HUMAN-MERGED via PR #794`  
**Governance interpretation:** GOV-07 remains `PARTIAL / OWNER RETURNS PENDING` until the remaining foreign-owner and independent-verification gates return.

Current-main and connected-provider evidence preserve the stable subscription identity invariant:

```text
Stripe subscription metadata.user_id
→ validated auth.users.id
→ public.subscriptions.user_id
```

The server subscription readback remains bound to the verified Bearer-token principal through `resolveVerifiedIdentity(req)` and `getSubscription(identity.userId)`. Client-supplied `userId`, request/browser e-mail, localStorage state, cached client tier and checkout redirect/query state do not select the paid subscription subject or grant protected capability authority.

Provider evidence remains deliberately split by evidence class:

- connected Supabase deployed projection function: `PASS` by read-only function-definition correlation;
- connected Supabase own-row RLS policy: `PASS` by read-only policy correlation;
- connected Supabase migration presence: `PASS` (`20260905103413 user_lifecycle_subscription_identity_authority`);
- Supabase Local/Mailpit provider E2E: `NOT_AVAILABLE` in the evidence return;
- isolated Supabase cross-user replay: `NOT_AVAILABLE`;
- Stripe sandbox/Test Clock lifecycle: `NOT_AVAILABLE`;
- exact-branch Stripe provider redelivery E2E: `NOT_AVAILABLE`;
- repository source/test contracts: correlated and reusable, but not substituted for provider E2E.

PR #794 is now current-main evidence, so no branch/PR-creation gate remains for this OPS return. Residual gates remain explicit: clean historical Supabase baseline replay, isolated provider E2E, Stripe test-mode lifecycle evidence, the current Supabase leaked-password-protection provider warning, CAPITAL-AI-SEC independent verification, and the outstanding foreign-owner/Human-Legal returns. No foreign project or Production/provider mutation is authorized by this work item.
