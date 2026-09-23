# CAPITAL-AI-SEC Security Inventory & Traceability Matrix

**Document ID:** `DOC-TRACE-CAPITAL-AI-SEC-2026-08-31`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `2.1.3`  
**Status:** `CURRENT-STATE CROSS-CUTTING TRACEABILITY / NON-AUTHORIZING`  
**Date:** `2026-09-20`  
**Baseline:** `main@02c9bdb4bd3820da3ad7e1e06d86722c2a2eb891`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01..PVC-18`  
**Technical coverage:** applicable existing `VC-*` stages, separately namespaced

## 1. Traceability rule

CAPITAL-AI-SEC owns Security requirements, findings, Security test expectations and verification. Productive implementation stays with the affected Primary Project Owner unless the implementation is inherently reusable Security infrastructure inside `src/platform/Security`.

Current-main project routing is governed by `docs/projects/PROJECT_VALUE_CHAIN.md` and `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

A refreshed cross-project Security item contains:

`target_project + project_namespace:PVC + project_stage:PVC-NN + threat_or_control + severity + evidence + required_remediation + verification_gate + status + roadmap_reference + SECURITY_HANDOFF marker + CROSS_PROJECT_HANDOFF marker`.

If an existing technical stage is relevant, add `technical_namespace` and `technical_stage` separately. An unqualified `VC-*` marker is not sufficient to prove project ownership.

Unknown ownership remains fail-closed as `UNROUTED/BLOCKED`.

## 2. Canonical Project Value Chain Security coverage

| Project stage | Primary Project Owner | Security controls checked | SEC streams | Security ownership |
|---|---|---|---|---|
| PVC-01 Agent Client | CAPITAL-AI-CLIENT | untrusted client context, client-side authority boundaries | SEC-01,02,03,07,08,10 | requirements + verification only |
| PVC-02 Controlled Implementation | CAPITAL-AI-OPS | controlled repository mutation, least privilege, secure change gates | SEC-03,05,06,07,08,10 | requirements + verification only |
| PVC-03 Documentary Engine | CAPITAL-AI-DOC | untrusted content, evidence integrity, no mutation-authority expansion | SEC-04,07,08,10 | requirements + verification only |
| PVC-04 Supervisor | CAPITAL-AI-OPS | fail-fast, health/recovery, supervisory integrity | SEC-05,08,10 | requirements + verification only |
| PVC-05 Platform Director | CAPITAL-AI-GOV | authority resolution, Owner gates, no self-authorization | SEC-02,07,09,10 | Security consumes authority; Governance owns it |
| PVC-06 Version Management | CAPITAL-AI-OPS | toolchain/version identity and integrity | SEC-05,06,08,10 | requirements + verification only |
| PVC-07 Release Management | CAPITAL-AI-OPS | provenance, attestation, unverified promotion denial | SEC-06,08,10 | requirements + verification only |
| PVC-08 Production Operations | CAPITAL-AI-OPS | runtime hardening, protected permissions, recovery | SEC-05,08,09,10 | requirements + verification only |
| PVC-09 UAI / Data Ingestion | CAPITAL-AI-FINTECH | external input validation, provenance, credentials | SEC-01,03,04,08 | requirements + verification only |
| PVC-10 Evidence Management | CAPITAL-AI-FINTECH | exact identity, freshness, evidence integrity | SEC-04,06,10 | requirements + verification only |
| PVC-11 Data Quality | CAPITAL-AI-FINTECH | fail-closed DQ, no synthetic success | SEC-04,08,10 | requirements + verification only |
| PVC-12 Feature Engineering | CAPITAL-AI-FINTECH | feature/input integrity and provenance | SEC-01,04,08 | requirements + verification only |
| PVC-13 Scoring Models | CAPITAL-AI-FINTECH | model/registry integrity, least privilege | SEC-04,07,08 | requirements + verification only |
| PVC-14 Scoring Orchestration | CAPITAL-AI-FINTECH | dispatcher/tool integrity and no bypass | SEC-03,07,08 | requirements + verification only |
| PVC-15 Domain Analysis / Executor | CAPITAL-AI-FINTECH | provider/tool/domain execution boundary | SEC-01,03,07,08 | requirements + verification only |
| PVC-16 Canonical Scoring | CAPITAL-AI-FINTECH | result integrity and lineage | SEC-04,08,10 | requirements + verification only |
| PVC-17 Ranking / Decision Support | CAPITAL-AI-FINTECH | protected decision-input integrity | SEC-03,04,08,10 | requirements + verification only |
| PVC-18 EventMesh / Traceability | CAPITAL-AI-OPS | event/evidence integrity; EventMesh is not authority | SEC-06,07,10 | requirements + verification only |
| `src/platform/Security` | none | reusable IAM/Security helpers and Security-specific adapters | SEC-02..10 as applicable | inherently Security-owned component code only |

No row grants CAPITAL-AI-SEC primary PVC ownership.

## 3. Technical `VC-*` Security coverage

Existing technical financial value-chain stages remain governed by their own architecture (`SC-MD-SPT-0001` and related authority). Security continues to verify relevant controls such as identity/entitlement and capability authorization, provider/external-input validation, data integrity/provenance, scoring/dispatcher/result integrity, API/browser safe rendering and exact evidence identity.

Technical `VC-*` identifiers are never used as project-routing authority without explicit `project_namespace: PVC` / `project_stage: PVC-*` metadata.

## 4. Final Security finding routing matrix

The pre-sync labels are retained as historical source references only. Current routing uses canonical Primary Project Owners from `PROJECT_VALUE_CHAIN.md`.

| Finding | Historical source label | Current project stage | Current Primary Owner | Security role | External state |
|---|---|---|---|---|---|
| S1-R2-03 | DC-SA / VC-05 | `PVC-06` Version Management | `CAPITAL-AI-OPS` | Node/toolchain Security requirement + verification | REFERRED_NOT_EXECUTED |
| S1-R2-04 | DC-SA / VC-05 | `PVC-04` Supervisor | `CAPITAL-AI-OPS` | fail-fast/supervisor Security requirement + negative verification | REFERRED_NOT_EXECUTED |
| S1-R2-05 | DEVELOPMENT / VC-03 | `PVC-02` Controlled Implementation | `CAPITAL-AI-OPS` | redirect/canonical-origin requirement + open-redirect verification | REFERRED_NOT_EXECUTED |
| S1-R2-06 | SC-MD-SPT / VC-03 | `PVC-02` Controlled Implementation | `CAPITAL-AI-OPS` | parent entitlement inventory requirement + server-authority verification | REFERRED_NOT_EXECUTED / ACTIVE |
| S1-R2-07 | DC-SA / VC-05 | `PVC-08` Production Operations | `CAPITAL-AI-OPS` | recovery Security requirement + measured verification | REFERRED_NOT_EXECUTED |
| S1-R2-09 | SEO-GM / VC-18 | `PVC-08` Production Operations | `CAPITAL-AI-OPS` | CSP promotion gate + compatibility verification | WAITING_FOR_EVIDENCE |
| S1-R2-10 | DEVELOPMENT / VC-03 | `PVC-08` Production Operations | `CAPITAL-AI-OPS` | production reachability verification | WAITING_FOR_EVIDENCE |
| S1-R2-11 | DC-SA / VC-17 | `PVC-10` Evidence Management | `CAPITAL-AI-FINTECH` | evidence identity/freshness requirement + verification | WAITING_FOR_EVIDENCE |
| MFA/AAL lifecycle drift | GOV / VC-02 | `PVC-05` Platform Director | `CAPITAL-AI-GOV` | identify lifecycle mismatch + verify Governance reconciliation | REFERRED_NOT_EXECUTED / CLARIFY |

## 5. Detailed current handoffs

### SEC-FIND-S1-R2-03 — Node control-plane convergence

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-06]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-06]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-06`
- **target_project / affected_project:** `CAPITAL-AI-OPS`
- **task:** converge `.nvmrc`, package engine policy and control-plane Node references on the approved Node 24.20.0 identity without creating a second toolchain authority.
- **reason / threat_or_control:** inconsistent Node identities can invalidate hardening, build and runtime verification assumptions.
- **severity:** `P1 / HIGH program priority`
- **evidence:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` S1-R2-03; current Docker runtime already uses Node 24.20.0.
- **dependency:** `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`; existing Version/DevelopmentChain controls.
- **required_remediation:** target-owned version/control-plane convergence.
- **required_evidence:** exact-candidate toolchain/version checks and hosted CI; runtime identity evidence where claimed.
- **verification_gate:** Security verifies consistent approved Node identity against the exact candidate/runtime claim.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md` (target canonical OPS roadmap; creation remains OPS-owned).
- **status:** `REFERRED_NOT_EXECUTED`.

### SEC-FIND-S1-R2-04 — Fatal process handling

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-04]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-04]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-04`
- **target_project / affected_project:** `CAPITAL-AI-OPS`
- **task:** make fatal uncaught errors fail readiness, stop new work, perform bounded safe cleanup, exit non-zero and rely on the approved supervisor.
- **reason / threat_or_control:** an unhealthy process must not continue serving protected work after fatal failure.
- **severity:** `P1 / HIGH program priority`
- **evidence:** S1-R2-04.
- **dependency:** `PVC-08` Production Operations supplies post-deploy supervisor-recovery evidence.
- **required_remediation:** target-owned runtime/supervisor handling.
- **required_evidence:** negative child-process evidence plus runtime supervisor recovery evidence for any production claim.
- **verification_gate:** Security verifies fail-fast behavior and evidence identity.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md`; source `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`.
- **status:** `REFERRED_NOT_EXECUTED`.

### SEC-FIND-S1-R2-05 — Stripe redirect boundary

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **target_project / affected_project:** `CAPITAL-AI-OPS`
- **task:** replace client-controlled absolute Checkout redirects with server-owned canonical origin/destination policy in the affected application implementation.
- **reason / threat_or_control:** untrusted redirect input can create an open-redirect boundary.
- **severity:** `P1 / HIGH program priority`
- **evidence:** S1-R2-05.
- **dependency:** existing DevelopmentChain/application implementation.
- **required_remediation:** target-owned server redirect policy.
- **required_evidence:** open-redirect negative tests plus exact-candidate API tests.
- **verification_gate:** Security validates reject/allow boundaries without implementing foreign application code.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md`; source `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`.
- **status:** `REFERRED_NOT_EXECUTED`.

### SEC-FIND-S1-R2-06 — Entitlement authority

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **target_project / affected_project:** `CAPITAL-AI-OPS` for the parent controlled-implementation inventory and server-enforcement coordination.
- **task:** inventory premium/protected capabilities and ensure every protected grant resolves verified principal plus authoritative server/provider entitlement state.
- **reason / threat_or_control:** browser/local subscription projection must never grant a protected paid capability.
- **severity:** `P1 / HIGH program priority`
- **evidence:** `docs/evidence/security/S1_R2_00_ENTITLEMENT_AUTHORITY_TRACE_2026-08-30.md`; PR #624 containment remains merged evidence.
- **dependency:** `CAPITAL-AI-CLIENT / PVC-01` and capability-specific Primary Owners are child handoff targets when their productive code is identified; technical SC-MD-SPT authority remains separate where a financial capability is involved.
- **required_remediation:** OPS-owned parent inventory; each discovered foreign productive remediation is routed to its actual Primary Owner rather than absorbed by Security or OPS by default.
- **required_evidence:** browser-tier escalation, forged identity, missing bearer, stale entitlement and alternate-path DENY evidence for each protected boundary.
- **verification_gate:** Security independently verifies each returned capability boundary.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md`; Security source `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`.
- **status:** `REFERRED_NOT_EXECUTED / ACTIVE`.

### SEC-FIND-S1-R2-07 — Recovery / RPO / RTO

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-08`
- **target_project / affected_project:** `CAPITAL-AI-OPS`
- **task:** establish approved recovery objectives, recurring encrypted off-site backup and isolated measured restore.
- **reason / threat_or_control:** unverified recovery capability and unmeasured RPO/RTO create resilience and integrity risk.
- **severity:** `P1 / HIGH program priority`
- **evidence:** S1-R2-07 and current recovery/runbook state.
- **dependency:** current Operations handoff/runbooks.
- **required_remediation:** target-owned production recovery implementation and exercises.
- **required_evidence:** measured actual RPO/RTO plus integrity-validated restore evidence.
- **verification_gate:** Security verifies returned evidence; a runbook alone is not PASS.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md`.
- **status:** `REFERRED_NOT_EXECUTED`.

### SEC-FIND-S1-R2-09 — Strict CSP promotion

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-08`
- **target_project / affected_project:** `CAPITAL-AI-OPS`
- **task:** promote CSP from report-only to strict only after the protected compatibility/violation evidence satisfies ADR-0040.
- **reason / threat_or_control:** premature strict CSP can break availability; report-only must not be mislabeled enforced strict policy.
- **severity:** `P2 / MEDIUM`
- **evidence:** ADR-0040, S1-R2-09, report-only state.
- **dependency:** `CAPITAL-AI-SEO` / SEO-GM supplies browser/marketing compatibility evidence but owns no productive PVC stage.
- **required_remediation:** no promotion until evidence passes; production promotion is OPS-owned.
- **required_evidence:** accepted violation/compatibility window and protected Stripe/Supabase/Consent/LEGACY_CHALLENGE_PROVIDER path verification.
- **verification_gate:** Security verifies promotion evidence before any strict-state claim.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md`; source context `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`.
- **status:** `WAITING_FOR_EVIDENCE`.

### SEC-FIND-S1-R2-10 — Demo billing isolation post-deploy proof

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-08`
- **target_project / affected_project:** `CAPITAL-AI-OPS`
- **task:** provide production bundle/runtime evidence proving DEV billing simulation is unreachable.
- **reason / threat_or_control:** production must not reach simulated-success billing logic.
- **severity:** `P2 / MEDIUM`
- **evidence:** merged S1 tail implementation.
- **dependency:** if runtime proof fails, a new implementation handoff is created for `CAPITAL-AI-OPS / PVC-02` or the actual affected Primary Owner.
- **required_remediation:** none unless verification fails.
- **required_evidence:** production bundle/runtime reachability proof bound to current deployed identity.
- **verification_gate:** Security verifies exact runtime identity and reachability evidence.
- **roadmap_reference:** `docs/projects/operations/ROADMAP.md`; source `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`.
- **status:** `WAITING_FOR_EVIDENCE`.

### SEC-FIND-S1-R2-11 — Evidence identity and stale-state automation

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-10]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-10]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-10`
- **target_project / affected_project:** `CAPITAL-AI-FINTECH`
- **task:** own the evidence identity/freshness semantics and return evidence that `CURRENT`, `STALE`, `CURRENT_AFTER_REFRESH` and `STALE_RETRY_REQUIRED` behave on current immutable identities without candidate self-authorization.
- **reason / threat_or_control:** stale or wrong-identity evidence must not authorize current state.
- **severity:** `P2 / MEDIUM`
- **evidence:** S1-R2-11; `scripts/pr/updatePrProductionBaseline.mjs` current implementation is relevant tooling evidence.
- **dependency:** `CAPITAL-AI-OPS` owns recurring DevelopmentChain/PR/trace tooling integration; any future tooling-code remediation is a secondary OPS handoff under the applicable `PVC-02`/`PVC-18` stage, not implicit FINTECH implementation ownership.
- **required_remediation:** evidence-semantic correction only if verification exposes a gap; tooling corrections remain target-owned by OPS.
- **required_evidence:** current immutable baseline/head identities and trusted refresh/retry observations.
- **verification_gate:** Security verifies evidence freshness/current-identity behavior without treating evidence as authority.
- **roadmap_reference:** `docs/projects/fintech/ROADMAP.md` (canonical FINTECH roadmap for PVC-09..17).
- **status:** `WAITING_FOR_EVIDENCE`.

### SEC-FIND-AUTH-LIFECYCLE-01 — MFA/AAL lifecycle drift

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-GOV | VC-05]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project / affected_project:** `CAPITAL-AI-GOV`
- **task:** reconcile M5A VERIFIED implementation/evidence with ESS-0020, ADR-0064 and registry lifecycle state under the current Governance authority model.
- **reason / threat_or_control:** implementation evidence and normative lifecycle state must not be conflated.
- **severity:** `P2 / CLARITY-INTEGRITY`
- **evidence:** `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md`, ESS-0020, ADR-0064, current registries.
- **dependency:** Human/Owner authority where required by Governance lifecycle rules.
- **required_remediation:** Governance-owned clarification/update only; Security must not self-promote any normative artifact.
- **required_evidence:** registry/document lifecycle consistency on current main.
- **verification_gate:** Security verifies consistency after Governance returns evidence.
- **roadmap_reference:** `docs/projects/governance/ROADMAP.md`.
- **status:** `REFERRED_NOT_EXECUTED / CLARIFY`.

## 6. Closed / retained findings

Correlation does not reopen closed or historically verified Security work without regression evidence. S1-R2-00 containment remains merged by PR #624; the broader S1-R2-06 capability inventory remains a distinct active finding.

## 7. Control reuse matrix

| Security area | Canonical/reused source | Duplicate architecture prohibited |
|---|---|---|
| Governance / protected mutation | `AGENTS.md`, Governance registries/policies | yes — no Security governance plane |
| Project routing | `docs/projects/**`, especially PVC + handoff contract | yes — no Security project chain |
| IAM / identity | existing `src/platform/Security` IAM/native MFA + applicable ADR/ESS | yes — no parallel IAM |
| Secrets | existing environment/secret mechanisms and controls | yes — no Security-local secret store |
| Event/trace | existing EventMesh/Traceability | yes — no Security bus |
| Data/scoring | SC-MD-SPT / ADR-0087 / existing data & scoring chain | yes — no Security data/scoring path |
| Release/supply chain | Development/Release workflows and controls | yes — no Security release path |
| Production | existing Owner/Operations/Release authority | yes — no autonomous Security production mutation |

## 8. Verification evidence model

`runtime evidence > provider/security config > negative tests > hosted CI > code > scanner > approved control > roadmap status`.

`VERIFIED` requires evidence appropriate to the exact claim and current candidate/runtime identity. `STALE`, `MISSING` or ambiguous evidence cannot be converted to PASS.

## 9. Correlation invariants

- no Security-owned foreign PVC execution;
- all currently open Security handoffs have an explicit Primary Project Owner and `PVC-*` stage;
- project `PVC-*` and technical `VC-*` namespaces remain separate;
- cross-project dependencies are explicit for R2-06, R2-09 and R2-11;
- target roadmap paths that do not yet exist are handoff destinations and remain target-project work;
- critical ambiguity fails closed;
- no duplicate Security authority;
- no duplicated domain implementation;
- no Security PR may absorb target-project productive remediation merely to keep one Security backlog.

## 9. SEC-WEB-HARDENING-01 traceability

**Materialization baseline:** main@e86955225887bb7f34036c175ad1da89b8aec14d  
**Detailed package:** docs/projects/security/evidence/SEC_WEB_HARDENING_01_PUBLIC_WEBSITE_SECURE_DEPLOYMENT.md  
**Status:** MATERIALIZED / IMPLEMENTATION_NOT_STARTED

| Finding group | Threat/control | Primary target | Security role | Current state |
|---|---|---|---|---|
| SEC-WEB-F01/F13-F17/F23 | dependency/build/OCI/registry/signature/provenance/secret exposure | CAPITAL-AI-OPS / PVC-02, PVC-07, PVC-08; COMP overlay | SEC-04/06/08/10 requirements + verification | OWNER_ROUTED / VERIFICATION_OPEN |
| SEC-WEB-F02-F04/F06/F09/F11-F12/F26 | browser isolation, CSP, safe DOM, runtime headers | CAPITAL-AI-FE + CAPITAL-AI-OPS / PVC-08 runtime delivery | SEC-03/08/10 | OWNER_ROUTED / VERIFICATION_OPEN |
| SEC-WEB-F05/F07-F08/F21-F22/F24-F25 | public API, input, method/CORS, abuse/cost, safe errors, telemetry | CAPITAL-AI-OPS / PVC-02/18 plus affected domain owner | SEC-03/04/08/09/10 | OWNER_ROUTED / VERIFICATION_OPEN |
| SEC-WEB-F10 | OAuth/session/authentication boundary | CAPITAL-AI-CLIENT / PVC-01 + FE/OPS affected surfaces | SEC-02/03/08/10 | OWNER_ROUTED / P0 VERIFICATION_OPEN |
| SEC-WEB-F18-F20/F27-F28 | liveness/readiness, rollback, scaling rate limit, DAST, DNS/TLS | CAPITAL-AI-OPS / PVC-04/07/08 | SEC-05/08/10 | OWNER_ROUTED / VERIFICATION_OPEN |
| SEC-WEB-F29 | review/CODEOWNER provider enforcement decision | CAPITAL-AI-GOV / PVC-05 | Security requirement input; Governance mutation authority | OWNER_DECISION_REQUIRED |
| SEC-WEB-F30 | consolidated website-security verification suite | owner-correct implementation + CAPITAL-AI-SEC verification + QM assurance | SEC-08/10 | PLANNED |

Traceability invariant: documentation materialization is not remediation evidence. Each finding must return exact candidate/runtime/provider evidence before Security can mark it VERIFIED; QM assurance remains independent where required.


