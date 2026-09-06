# CAPITAL-AI Security Roadmap

**Document ID:** `DOC-ROADMAP-CAPITAL-AI-SEC-2026-08-31`  
**Project ID:** `CAPITAL-AI-SEC`  
**Version:** `2.2.3`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY / NON-AUTHORIZING`  
**Date:** `2026-09-06`  
**Repository baseline:** `main@eaa5fe228ff0d61d8116932665406c75b0bbf8e7`  
**Role:** `CROSS_CUTTING_SECURITY`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01` through `PVC-18` as Security overlay  
**Owner:** `CAPITAL-AI-SEC` for Security requirements/findings/testing/verification only  
**Security component:** `src/platform/Security`  
**Component specification:** ESS-0006 v1.1.0 — Security & Compliance  
**Existing hardening program:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

> CAPITAL-AI-SEC owns Security requirements, threat analysis, Security testing, finding lifecycle and independent verification. It owns no productive `PVC-*` stage and does not convert a Security requirement into implementation ownership of another project.

## 1. Current authority and routing model

Current work resolves from `/AGENTS.md` on current `main`, then canonical project/PVC mapping, the Security project roadmap, applicable current ADR/ESS, and finally code/tests/evidence. Post-PVC policy overlays withdrawn by current `/AGENTS.md` are historical/non-authorizing. The former Cross-Project Handoff Contract is therefore not a current routing authority.

Current `ESS-0006` v1.1.0 revalidates the bounded component model: Security requirements/testing/independent verification remain with `CAPITAL-AI-SEC`; productive remediation remains with the affected Primary Owner unless the implementation is inherently reusable Security infrastructure within `src/platform/Security`.

Productive ownership remains:

| PVC | Primary productive owner | Security role |
|---|---|---|
| PVC-01 | CAPITAL-AI-CLIENT | requirements + verification |
| PVC-02 | CAPITAL-AI-OPS | requirements + verification |
| PVC-03 | CAPITAL-AI-DOC | requirements + verification |
| PVC-04 | CAPITAL-AI-OPS | requirements + verification |
| PVC-05 | CAPITAL-AI-GOV | consume current authority; verify Security properties |
| PVC-06 | CAPITAL-AI-OPS | requirements + verification |
| PVC-07 | CAPITAL-AI-OPS | requirements + verification |
| PVC-08 | CAPITAL-AI-OPS | requirements + verification |
| PVC-09..11 | CAPITAL-AI-DATA | requirements + verification |
| PVC-12..17 | CAPITAL-AI-FINTECH | requirements + verification |
| PVC-18 | CAPITAL-AI-OPS | requirements + verification |

No row grants CAPITAL-AI-SEC productive PVC ownership.

## 2. Security workstreams

| ID | Workstream | Security responsibility |
|---|---|---|
| `SEC-01` | Threat Modeling | threats, surfaces, trust boundaries, owner/PVC correlation |
| `SEC-02` | Identity & Access | AuthN/AuthZ/MFA/AAL/session/least-privilege requirements and verification |
| `SEC-03` | Application/API Security | API/browser/capability/input/output/redirect requirements and verification |
| `SEC-04` | Data & Secrets | confidentiality, integrity, RLS/grants, provenance, credentials |
| `SEC-05` | Infrastructure | runtime/container/network/process/recovery assurance |
| `SEC-06` | Supply Chain | dependency/build/artifact/provenance/release-integrity assurance |
| `SEC-07` | AI / Agent Security | prompt/tool/agent authority and untrusted-content boundaries |
| `SEC-08` | Security Testing | positive/negative/regression/configuration Security tests |
| `SEC-09` | Findings | triage, owner routing, remediation requirement, residual-risk record |
| `SEC-10` | Verification | independent exact-identity/runtime/provider verification and closure |

These IDs are coordination labels only.

## 3. Chat-to-main consolidation result

The available project-chat work was treated only as a search index. Completion state below is derived from current repository evidence.

| Work item | Current-main / branch result |
|---|---|
| Security project/PVC consolidation | `DONE_MAIN`; PR #749 merged |
| Adversarial Web/Mobile Security Assessment skill/schema/validator | `IMPLEMENTED_MAIN` |
| Assessment validator in repository raw-test chain | `DONE_MAIN` |
| Assessment current-authority alignment | `IMPLEMENTED_BRANCH / VALIDATION + PR PENDING` on `agent/security-assess-align-20260905` |
| Owner Device Authorization Stage-C | initial FAIL followed by independent PASS re-verification; `COMPLETE / HISTORICAL` |
| User Lifecycle Security integration / GOV-CHAT-042 | `IMPLEMENTED_MAIN / RESIDUALS OPEN` |
| Fatal Process Handling / S1-R2-04 | productive remediation `IMPLEMENTED_ON_MAIN`; Security/post-deploy verification still open |
| Entitlement parent inventory / S1-R2-06 | `EVIDENCE_READY`; child remediation + Security verification remain |
| User Lifecycle stable subscription identity | OPS provider evidence ready; independent Security re-verification remains |
| OPS roadmap re-correlation PR #747 | merged; corroborates OPS-owned S1 status without transferring closure authority to OPS |

Historical Owner Device/WebAuthn evidence does not reactivate retired M10 runtime or withdrawn cutover/handoff overlays.

## 4. Security-owned priority queue

### 4.1 `SEC-ASSESS-ALIGN` — current-main alignment of the Security Assessment capability

**State:** `IMPLEMENTED_BRANCH / VALIDATION + PR PENDING`.

Branch `agent/security-assess-align-20260905` updates `.ai/skills/CAPITAL-AI-Security-Assessment.md` from v1.0.0 to v1.0.1 and adds regression coverage in `scripts/security/validateSecurityAssessment.test.mjs`.

Implemented result:

- removed the withdrawn Cross-Project Handoff Contract dependency;
- current routing references `/AGENTS.md`, `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` for repository/project ownership navigation;
- removed NIST SP 800-115 from the capability baseline, consistent with current `/AGENTS.md`;
- retained OWASP WSTG/MASVS/MASTG/ASVS only as explicitly `ADVISORY_NON_AUTHORIZING` assessment methodologies;
- foreign productive findings remain `REFERRED_NOT_EXECUTED` and route directly to the current Primary Owner without a withdrawn post-PVC overlay;
- authorization, safe testing defaults, exact evidence, owner/PVC routing, `NOT_TESTED != PASS`, Human risk acceptance and independent verification remain intact;
- focused regression coverage fails if the withdrawn handoff contract or NIST SP 800-115 reappears in the skill and asserts the current project mappings/advisory methodology marker;
- current `ESS-0006` v1.1.0 was re-correlated and is semantically compatible with the assessment contract.

Remaining exit gate: exact-head applicable validation where available, explicit Human/Owner PR-creation approval for the exact current main/head/title snapshot, hosted checks, then Human/CODEOWNER merge. The prior local isolated runner could not clone the repository because DNS resolution for `github.com` was unavailable; that execution remains `NOT RUN`, not PASS.

### 4.2 `SEC-VERIFY-ULS-001` — subscription-identity evidence return

**State:** `READY FOR INDEPENDENT SECURITY REVIEW`.

OPS returned read-only provider evidence for:

`metadata.user_id -> auth.users.id -> public.subscriptions.user_id`.

Security may independently close only the bounded identity-projection aspect if evidence is sufficient. Supabase Local/Mailpit, cross-user provider E2E, Stripe Sandbox/Test Clock and payment/redelivery scenarios remain `NOT_AVAILABLE` and cannot inherit PASS.

### 4.3 `SEC-VERIFY-R2-04` — fatal-process verification

**State:** `READY / PARTIAL EVIDENCE AVAILABLE`.

PR #720 merged the fail-fast/readiness/non-zero-exit implementation and tests. Security verification must distinguish repository negative behavior from post-deploy supervisor/restart evidence. Production/recovery closure requires evidence appropriate to that exact claim.

### 4.4 `SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle clarity

**State:** `OPEN / CLARIFY`.

ESS-0020 remains proposed. Current Governance evidence intentionally did not unilaterally alter this foreign Security/Auth lifecycle state. M5A implementation evidence and normative lifecycle status remain separate facts. Any promotion/retirement/accepted-risk state requires applicable current authority/Human action.

## 5. Foreign-owner Security return queue

| Finding / residual | Productive owner | Current-main state | Security gate |
|---|---|---|---|
| `S1-R2-03` Node convergence | OPS / PVC-06 | `OPEN / HIGHEST EXECUTABLE OPS P1`; `.nvmrc` `24.18.0`, required target `24.20.0` | exact toolchain/control-plane identity after OPS remediation |
| `S1-R2-04` fatal process | OPS / PVC-04 + PVC-08 evidence | `IMPLEMENTED_ON_MAIN`; verification pending | negative fail-fast + applicable post-deploy supervisor/restart evidence |
| `S1-R2-05` Stripe redirect | OPS / PVC-02 | `OPEN` | canonical-origin/open-redirect DENY evidence |
| `S1-R2-06` entitlement authority | OPS parent; FINTECH/DATA children | parent `EVIDENCE_READY`; child remediation open | per-capability forged/missing/stale/alternate-route DENY evidence |
| `S1-R2-07` recovery/RPO/RTO | OPS / PVC-08 | `OPEN / UNVERIFIED` | measured restore, integrity, actual RPO/RTO |
| `S1-R2-09` strict CSP | OPS / PVC-08 | `WAITING_FOR_EVIDENCE` | compatibility/violation window + protected-path verification |
| `S1-R2-10` demo billing isolation | OPS / PVC-08 | `WAITING_FOR_EVIDENCE` | production reachability proof bound to deployed identity |
| `S1-R2-11` evidence identity/freshness | DATA / PVC-10 | `OPEN — SECURITY EVIDENCE WORK` | current/stale/wrong-identity evidence semantics |
| User Lifecycle provider E2E | OPS / PVC-08 + applicable provider owner | `NOT_AVAILABLE` for isolated Supabase/Stripe scenarios | reproducible provider evidence |
| leaked-password protection | OPS / PVC-08 provider config | `OPEN DEFENSE-IN-DEPTH` | separately authorized config action and readback |

### 5.1 S1-R2-06 child map

| Capability | Current classification | Productive remediation owner |
|---|---|---|
| `verified_screening` | partial server enforcement / alternate route | FINTECH / PVC-16 |
| `backtest` | no paid entitlement enforcement | FINTECH / PVC-15 |
| `monte_carlo` | client-local alternate route | FINTECH / PVC-15 |
| `full_ai_analysis` | unbound productive capability / fail-closed gap | FINTECH / PVC-15 |
| `realtime_ai_newsfeed` | product-contract/runtime gap | DATA / PVC-09 |
| `buffett_value_check` | server authority present / client integration gap | FINTECH / PVC-15 |
| `pdf_compliance_export` | server enforced / evidence present | no new productive remediation identified by parent inventory |

Security verifies returned evidence; it does not absorb these implementations.

## 6. User Lifecycle Security state

| Area | Current Security state |
|---|---|
| Authentication repository contract | `PASS` at repository-contract level; provider abuse controls not comprehensively exercised |
| Session/revocation | `OPEN`; provider JWT residual window and provider/browser E2E remain |
| MFA/AAL server boundary | canonical controls exist; application-wide endpoint coverage is not inferred from frontend gating |
| Subscription identity projection | OPS provider evidence ready; SEC re-verification pending |
| Protected capabilities | `OPEN` through S1-R2-06 child findings |
| Supabase Local/Mailpit + cross-user provider E2E | `NOT_AVAILABLE` |
| Stripe Sandbox/Test Clock + payment failure/redelivery | `NOT_AVAILABLE` |
| leaked-password protection | warning remains; separate protected config action if changed |

No blanket Security `VERIFIED/CLOSED` result exists for the complete user lifecycle at this baseline.

## 7. Security Assessment capability contract

The adversarial assessment capability remains implemented and the branch alignment preserves these invariants:

- active assessment requires explicit authorization for exact target/scope/test class;
- default posture is non-destructive assessment-only;
- unowned targets, destructive exploitation, credential theft, uncontrolled persistence, denial-of-service and protected production money/IAM mutation are not implicitly authorized;
- evidence minimizes secrets/PII and binds observation to target/version/snapshot;
- `NOT_TESTED != PASS`;
- productive remediation remains with the Primary Owner;
- `ACCEPTED_RISK` requires Human/Owner authority;
- `VERIFIED` requires independently identifiable re-test evidence;
- current project/PVC routing comes from the canonical mapping, not withdrawn post-PVC overlays;
- external assessment methodologies are advisory/non-authorizing and cannot create repository Authority or mandatory remediation by themselves.

After Human merge of `SEC-ASSESS-ALIGN`, the stale authority/methodology-reference gap is closed at the contract level; no separate productive capability is introduced.

## 8. Finding and verification lifecycle

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

Rules:

- `EVIDENCE_READY != VERIFIED`;
- missing, stale, wrong-identity or `NOT_AVAILABLE` evidence is not PASS;
- implementing projects do not self-close independent Security findings;
- Security cannot self-accept risk;
- roadmap status alone is not evidence of runtime/provider security.

Evidence precedence:

1. exact runtime/provider observation;
2. provider/security configuration readback;
3. negative/reproduction tests;
4. hosted CI bound to exact PR head;
5. implementation/code;
6. scanner/static analysis;
7. current policy/control;
8. roadmap text.

## 9. Historical / secondary surfaces

These dated documents remain audit/history and detailed reference but predate current routing and later merged returns:

- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`.

Where their status/routing language conflicts with current `/AGENTS.md`, canonical project mapping, `docs/projects/security/ROADMAP.md` or this roadmap, current-main sources win. Full normalization is a separate Security documentation-maintenance item and must not reopen already implemented work merely because historical text is stale.

## 10. Current correlation boundary

This work is based on `main@eaa5fe228ff0d61d8116932665406c75b0bbf8e7`. The current trust root is `/AGENTS.md` v2.7.1 and the applicable component specification is `ESS-0006` v1.1.0.

PR #765 is closed and unmerged after its approved PR-creation snapshot was invalidated by concurrent main movement. It is historical and not a merge candidate. The only open PR at this revalidation snapshot is PR #763 (`CAPITAL-AI-FE`), which changes only `src/components/Dashboard.tsx` and `tests/unit/dashboardConsumerCutover.test.ts`; it has no changed-file, semantic, namespace, authority or Primary-Owner overlap with this SEC work.

The scoped branch `agent/security-assess-align-20260905` has exact merge-base current main and changes only:

- `.ai/skills/CAPITAL-AI-Security-Assessment.md`;
- `scripts/security/validateSecurityAssessment.test.mjs`;
- `docs/projects/security/ROADMAP.md`;
- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`.

No foreign project, productive runtime, provider, IAM, billing, deployment or external integration surface is modified.

## 11. Definition of Done for current Security backlog

CAPITAL-AI-SEC is current when:

- current Security capabilities/docs no longer depend on withdrawn authority/routing sources;
- every active finding has current owner/PVC mapping or is explicitly unresolved/blocked;
- returned evidence is independently verified only to the scope it proves;
- foreign productive remediation remains with the actual Primary Owner;
- no stale/missing/`NOT_AVAILABLE` evidence becomes PASS;
- Security claims no productive PVC;
- no second Governance/IAM/Data/Scoring/EventMesh/Release/Production authority is created;
- historical M10/Owner Device evidence remains historical unless new current authority explicitly reopens it;
- every `VERIFIED/CLOSED` claim records exact applicable identity/evidence.

For `SEC-ASSESS-ALIGN`, implementation is complete on the scoped branch; remaining gates are exact-head validation/correlation, explicit PR-creation approval, hosted checks and Human/CODEOWNER merge.

## 12. PR / merge / production boundary

Security roadmap/documentation and Security-owned assessment-contract/test changes remain CAPITAL-AI-SEC scope. Foreign productive remediation belongs to the target project.

PR creation requires separate explicit Human/Owner approval for the exact current-main, branch-head, scope and title snapshot after final correlation. Merge remains Human/CODEOWNER-only. CI, roadmap status or Security evidence does not itself authorize Release, Production or protected provider mutation.