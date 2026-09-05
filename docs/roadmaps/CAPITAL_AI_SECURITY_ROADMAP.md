# CAPITAL-AI Security Roadmap

**Document ID:** `DOC-ROADMAP-CAPITAL-AI-SEC-2026-08-31`  
**Project ID:** `CAPITAL-AI-SEC`  
**Version:** `2.2.0`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY / NON-AUTHORIZING`  
**Date:** `2026-09-05`  
**Repository baseline:** `main@4e9dedd74aee1f9b3609037d1abb4fef0932a1b6`  
**Role:** `CROSS_CUTTING_SECURITY`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01` through `PVC-18` as Security overlay  
**Owner:** `CAPITAL-AI-SEC` for Security requirements/findings/testing/verification only  
**Security component:** `src/platform/Security`  
**Component specification:** ESS-0006 — Security & Compliance  
**Existing hardening program:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

> CAPITAL-AI-SEC owns Security requirements, threat analysis, Security testing, finding lifecycle and independent verification. It owns no productive `PVC-*` stage and does not convert a Security requirement into implementation ownership of another project.

## 1. Current authority and routing model

Current work resolves in this order:

1. `/AGENTS.md` from current `main`;
2. `docs/projects/README.md`;
3. `docs/projects/PROJECT_VALUE_CHAIN.md`;
4. `docs/projects/security/ROADMAP.md`;
5. applicable accepted/current ADR and ESS;
6. current implementation, tests and evidence.

Post-PVC policy overlays withdrawn by current `/AGENTS.md` are historical/non-authorizing. In particular, the former Cross-Project Handoff Contract is not a current routing authority and must not override the canonical project/PVC mapping.

Current PVC routing remains:

| PVC | Primary productive owner | Security role |
|---|---|---|
| PVC-01 | CAPITAL-AI-CLIENT | requirements + independent verification |
| PVC-02 | CAPITAL-AI-OPS | requirements + independent verification |
| PVC-03 | CAPITAL-AI-DOC | requirements + independent verification |
| PVC-04 | CAPITAL-AI-OPS | requirements + independent verification |
| PVC-05 | CAPITAL-AI-GOV | consume current authority; verify Security properties |
| PVC-06 | CAPITAL-AI-OPS | requirements + independent verification |
| PVC-07 | CAPITAL-AI-OPS | requirements + independent verification |
| PVC-08 | CAPITAL-AI-OPS | requirements + independent verification |
| PVC-09 | CAPITAL-AI-DATA | requirements + independent verification |
| PVC-10 | CAPITAL-AI-DATA | requirements + independent verification |
| PVC-11 | CAPITAL-AI-DATA | requirements + independent verification |
| PVC-12..17 | CAPITAL-AI-FINTECH | requirements + independent verification |
| PVC-18 | CAPITAL-AI-OPS | requirements + independent verification |

No row grants CAPITAL-AI-SEC productive PVC ownership.

## 2. Security workstreams

| ID | Workstream | Security responsibility |
|---|---|---|
| `SEC-01` | Threat Modeling | assets, threats, attack surfaces, trust boundaries, owner/PVC mapping |
| `SEC-02` | Identity & Access | AuthN/AuthZ/MFA/AAL/session/least-privilege requirements and verification |
| `SEC-03` | Application/API Security | input/output/API/browser/capability/redirect requirements and verification |
| `SEC-04` | Data & Secrets | confidentiality, integrity, RLS/grants, provenance and credential boundaries |
| `SEC-05` | Infrastructure | runtime/container/network/process/recovery Security requirements and verification |
| `SEC-06` | Supply Chain | dependency/build/artifact/provenance/release-integrity assurance |
| `SEC-07` | AI / Agent Security | prompt/tool/agent authority and untrusted-content boundaries |
| `SEC-08` | Security Testing | positive/negative/regression/configuration Security tests |
| `SEC-09` | Findings | finding state, owner routing, remediation requirement, residual-risk record |
| `SEC-10` | Verification | independent exact-identity/runtime/provider verification and closure |

These IDs are coordination labels only and create no Authority.

## 3. Current-main completed / implemented Security work

The following states are evidenced on current `main`; chat completion claims were not used without repository corroboration.

| Work item | Repository-backed result | Disposition |
|---|---|---|
| Security project/PVC consolidation | canonical `docs/projects/security/` surface exists; SEC project claims are released | `DONE_MAIN` |
| Adversarial Web/Mobile Security Assessment | `.ai/skills/CAPITAL-AI-Security-Assessment.md`, schema and validator are present; PR #706 merged | `IMPLEMENTED_MAIN` |
| Security Assessment CI binding | `package.json#test:raw` executes `scripts/security/validateSecurityAssessment.test.mjs`; PR #711 merged | `DONE_MAIN` |
| Owner Device Authorization Stage-C | initial FAIL evidence is followed by independent PASS re-verification evidence on main | `COMPLETE / HISTORICAL SECURITY EVIDENCE` |
| User Lifecycle Security integration | `docs/evidence/security/GOV_CHAT_042_LIFECYCLE_SECURITY_2026-09-02.md` and `tests/unit/userLifecycleSecurityContract.test.ts` are present; PR #725 merged | `IMPLEMENTED_MAIN / RESIDUALS OPEN` |
| Fatal-process productive remediation | OPS PR #720 merged fail-fast/readiness/non-zero-exit implementation and tests | `IMPLEMENTED_ON_MAIN / SECURITY VERIFICATION PENDING` |
| Entitlement parent inventory | OPS inventory of seven protected/subscription capabilities is present | `EVIDENCE_READY / CHILD REMEDIATION + SEC VERIFICATION PENDING` |
| User Lifecycle subscription identity provider correlation | OPS closeout evidence records deployed stable user-ID projection and RLS readback | `OPS_PROVIDER_EVIDENCE_READY / SECURITY REVERIFICATION REQUIRED` |

Historical Owner Device / WebAuthn evidence does not reactivate the retired M10 productive runtime or any withdrawn cutover/handoff overlay.

## 4. Security-owned execution queue

These are the highest-priority tasks CAPITAL-AI-SEC itself may execute without taking over foreign productive implementation.

### 4.1 `SEC-ASSESS-ALIGN` — Security Assessment current-main alignment

**State:** `OPEN — SECURITY OWNED`.

Current-main gap:

- `.ai/skills/CAPITAL-AI-Security-Assessment.md` still depends on `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`, which is no longer current routing authority;
- the skill lists NIST SP 800-115 as a standards baseline although current `/AGENTS.md` withdrew NIST from the repository Governance baseline.

Required Security change:

- remove the withdrawn routing dependency from the current contract;
- distinguish advisory assessment methodology from repository Authority;
- retain OWASP testing methodology only as non-authorizing external guidance unless current repository authority says otherwise;
- preserve authorization, non-destructive default, evidence, PVC owner mapping, `NOT_TESTED != PASS` and independent-verification rules.

Exit gate: skill/schema/validator references agree with current `/AGENTS.md` and project mapping; no current Security capability relies on withdrawn authority.

### 4.2 `SEC-VERIFY-ULS-001` — User Lifecycle subscription-identity re-verification

**State:** `READY FOR INDEPENDENT SECURITY REVIEW`.

OPS has returned read-only provider evidence that the deployed subscription identity contract uses:

`metadata.user_id -> auth.users.id -> public.subscriptions.user_id`.

Security must independently correlate the exact returned provider evidence with the repository contract and determine only the bounded identity-projection finding state. This must not convert unavailable Supabase Local/Mailpit, cross-user provider E2E, Stripe Sandbox/Test Clock or payment/redelivery scenarios into PASS.

### 4.3 `SEC-VERIFY-R2-04` — Fatal-process remediation verification

**State:** `READY / PARTIAL EVIDENCE AVAILABLE`.

OPS PR #720 is merged and establishes the productive fail-fast contract. Security must verify the merged negative behavior and, for any production/recovery closure claim, require applicable post-deploy supervisor/restart evidence. Productive implementation is not reopened under SEC.

### 4.4 `SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle clarity

**State:** `OPEN / CLARIFY`.

Current Governance evidence explicitly left ESS-0020 proposed rather than unilaterally changing its lifecycle because the Security/Auth scope is not disposable by a foreign project owner. M5A implementation/evidence and normative lifecycle status remain distinct facts.

Security action is limited to correlation and verification. Any promotion, retirement or accepted-risk decision requires the applicable current authority/Human gate.

## 5. Foreign-owner remediation and evidence return queue

Security tracks these items but does not implement the productive remediation unless an implementation is inherently reusable Security infrastructure.

| Finding / residual | Primary productive owner | Current-main state | Security verification gate |
|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | CAPITAL-AI-OPS / PVC-06 | `OPEN / PARTIAL`; `.nvmrc` remains `24.18.0`, Docker/current hardening target is `24.20.0` | exact toolchain/control-plane identity after OPS convergence |
| `S1-R2-04` fatal process handling | CAPITAL-AI-OPS / PVC-04; runtime evidence PVC-08 | `IMPLEMENTED_ON_MAIN` via PR #720 | negative fail-fast + applicable post-deploy/supervisor recovery evidence |
| `S1-R2-05` Stripe redirect boundary | CAPITAL-AI-OPS / PVC-02 | `OPEN` | canonical-origin/open-redirect DENY tests on remediated path |
| `S1-R2-06` entitlement authority | OPS parent inventory; actual FINTECH/DATA child owner per capability | `PARENT EVIDENCE_READY / CHILD REMEDIATION OPEN` | per-capability forged/missing/stale/alternate-route DENY evidence |
| `S1-R2-07` recovery / RPO / RTO | CAPITAL-AI-OPS / PVC-08 | `OPEN / UNVERIFIED` | measured restore, integrity and actual RPO/RTO evidence |
| `S1-R2-09` strict CSP promotion | CAPITAL-AI-OPS / PVC-08 | `WAITING_FOR_EVIDENCE` | accepted compatibility/violation window and protected path verification |
| `S1-R2-10` demo billing isolation | CAPITAL-AI-OPS / PVC-08 | `WAITING_FOR_EVIDENCE` | production bundle/runtime reachability proof bound to deployed identity |
| `S1-R2-11` evidence identity/freshness | CAPITAL-AI-DATA / PVC-10 | `OPEN — DATA Security evidence work` | current/stale/wrong-identity behavior with immutable identity/freshness evidence |
| User Lifecycle provider E2E | CAPITAL-AI-OPS / PVC-08 plus applicable provider/runtime owner | `NOT_AVAILABLE` for isolated Supabase/Stripe scenarios | reproducible provider E2E; `NOT_AVAILABLE` remains non-PASS |
| leaked-password protection | CAPITAL-AI-OPS / PVC-08 provider config | `OPEN DEFENSE-IN-DEPTH` | separately authorized config decision/change plus readback/evidence |

### 5.1 `S1-R2-06` child routing after parent inventory

The current parent inventory identifies:

| Capability | Current classification | Productive remediation owner |
|---|---|---|
| `verified_screening` | partial server enforcement / alternate-path gap | CAPITAL-AI-FINTECH / PVC-16 |
| `backtest` | no paid entitlement enforcement | CAPITAL-AI-FINTECH / PVC-15 |
| `monte_carlo` | client-local alternate-path gap | CAPITAL-AI-FINTECH / PVC-15 |
| `full_ai_analysis` | unbound productive capability / fail-closed verification gap | CAPITAL-AI-FINTECH / PVC-15 |
| `realtime_ai_newsfeed` | product-contract vs runtime gap | CAPITAL-AI-DATA / PVC-09 |
| `buffett_value_check` | server authority present / client integration gap | CAPITAL-AI-FINTECH / PVC-15 |
| `pdf_compliance_export` | server enforced / evidence present | no new productive remediation identified by parent inventory |

Security verifies returned owner evidence and does not absorb these child implementations.

## 6. User Lifecycle Security residuals

The merged GOV-CHAT-042 Security evidence and later OPS closeout together resolve some repository/provider facts but do not close the complete lifecycle.

| Security area | Current state |
|---|---|
| Authentication repository contract | `PASS` at repository-contract level; broader provider abuse controls not fully executed |
| Session / revocation | `OPEN`; provider/JWT residual window and stale-tab/provider E2E remain |
| MFA/AAL server boundary | canonical server AAL2/step-up controls present; application-wide endpoint coverage is not inferred from frontend gating |
| Subscription identity projection | OPS provider evidence ready; independent SEC re-verification pending |
| Authorization / paid capabilities | `OPEN` through `S1-R2-06` child gaps |
| Supabase Local/Mailpit + cross-user provider E2E | `NOT_AVAILABLE` |
| Stripe Sandbox/Test Clock + payment failure/redelivery | `NOT_AVAILABLE` |
| leaked-password protection | provider warning remains; separate protected config action if changed |

No blanket `VERIFIED/CLOSED` claim is valid for the complete user lifecycle at this baseline.

## 7. Security Assessment capability state

The adversarial assessment capability itself is implemented and retained. Its operating invariants remain:

- active assessment requires explicit authorization for exact target/scope/test class;
- default assessment posture is non-destructive and assessment-only;
- third-party/unowned targets, destructive exploitation, credential theft, uncontrolled persistence, denial-of-service and protected production money/IAM mutation are not implicitly authorized;
- evidence minimizes secrets/PII and binds observations to exact target/version/snapshot;
- `NOT_TESTED != PASS`;
- productive remediation remains with the current Primary Owner;
- `ACCEPTED_RISK` requires Human/Owner authority;
- `VERIFIED` requires independently identifiable re-test evidence.

`SEC-ASSESS-ALIGN` updates current references; it does not delete the assessment capability.

## 8. Finding and verification lifecycle

Current Security lifecycle:

```text
DISCOVERED
-> TRIAGED
-> CONFIRMED
-> OWNER/PVC IDENTIFIED
-> target owner REMEDIATING
-> IMPLEMENTED
-> EVIDENCE_READY
-> independent Security VERIFIED
-> CLOSED
```

Alternative states include `FALSE_POSITIVE`, `ACCEPTED_RISK`, `DEFERRED`, `SUPERSEDED` and explicit evidence states such as `NOT_AVAILABLE` where applicable.

Rules:

- `EVIDENCE_READY` is not `VERIFIED`;
- missing/stale/wrong-identity evidence is never PASS;
- implementing owners do not self-close independent Security findings;
- Security cannot self-accept risk;
- roadmaps and policy text are weaker than actual applicable runtime/provider/negative-test evidence.

Evidence precedence for verification:

1. runtime/provider Security observation bound to exact identity;
2. provider/security configuration readback;
3. negative/reproduction tests;
4. hosted CI bound to exact PR head;
5. implementation/code review;
6. scanner/static analysis;
7. approved policy/control;
8. roadmap status.

## 9. Historical / secondary Security surfaces

The dated `2026-08-31` Work Packages and Traceability Matrix remain useful detailed history/evidence:

- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`.

They predate current-main routing and several later merged remediations/evidence returns. Where their status or routing language conflicts with current `/AGENTS.md`, canonical project mapping, `docs/projects/security/ROADMAP.md` or this roadmap, the current-main sources win. Full normalization of those secondary documents is a separate Security documentation-maintenance item and must not be used to reopen closed implementation solely because historical text is stale.

## 10. Parallel work / correlation boundary

At this branch baseline, open PR #747 is CAPITAL-AI-OPS roadmap/work-claim reconciliation. Its changed files are confined to OPS work claims plus:

- `docs/projects/operations/ROADMAP.md`;
- `docs/projects/operations/WORK_PACKAGES.md`.

There is no changed-file overlap with the Security roadmap branch. There is semantic overlap around S1 status projection. Therefore PR #747 is context only until merged; no current Security state in this roadmap depends solely on its unmerged assertions.

Final PR readiness requires re-reading current `main`, open PRs/writers and changed-file/semantic overlap. A changed `main` SHA invalidates any prior exact-snapshot PR approval and requires resync/re-correlation/revalidation/reapproval.

## 11. Definition of Done for current Security backlog

CAPITAL-AI-SEC is current when:

- current Security capability/docs no longer depend on withdrawn routing/authority sources;
- every active Security finding has current owner/PVC correlation or is explicitly blocked on unresolved ownership;
- Security-owned verification is performed only on returned evidence appropriate to the claim;
- foreign productive remediation remains with the actual Primary Owner;
- no stale/missing/`NOT_AVAILABLE` evidence is converted to PASS;
- no productive PVC stage is claimed by Security;
- no second Governance/IAM/Data/Scoring/EventMesh/Release/Production authority is introduced;
- historical Owner Device/M10 evidence remains historical unless a new current authority explicitly reopens it;
- exact current identity is recorded for every `VERIFIED/CLOSED` claim.

## 12. PR / merge / production boundary

Security roadmap/documentation changes remain CAPITAL-AI-SEC scope.

A remediation PR whose primary change is foreign productive implementation belongs to that target project. Security remains requirement/test/verification owner.

PR creation requires separate explicit Human/Owner approval for the exact current main and branch-head snapshot after final correlation. Merge remains Human/CODEOWNER-only. Roadmap status, CI success or Security evidence does not itself authorize Release, Production or protected provider mutation.
