# CAPITAL-AI-SEC Security Inventory & Traceability Matrix

**Document ID:** `DOC-TRACE-CAPITAL-AI-SEC-2026-08-31`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `2.1.1`  
**Status:** `CURRENT-STATE CROSS-CUTTING TRACEABILITY / NON-AUTHORIZING`  
**Date:** `2026-08-31`  
**Baseline:** `main@8e0e4a541da24ce2e28988e31c9a8bb7e5711a25`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01..PVC-18`  
**Technical coverage:** applicable existing `VC-*` stages, separately namespaced

## 1. Traceability rule

CAPITAL-AI-SEC owns Security requirements, findings, Security test expectations and verification. Productive implementation stays with the affected Primary Project Owner unless the implementation is inherently reusable Security infrastructure inside `src/platform/Security`.

Current-main project routing is governed by `docs/projects/PROJECT_VALUE_CHAIN.md` and `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

A refreshed cross-project Security item must contain:

`target_project + project_namespace:PVC + project_stage:PVC-NN + threat_or_control + severity + evidence + required_remediation + verification_gate + status + roadmap_reference + SECURITY_HANDOFF marker`.

If an existing technical stage is relevant, add `technical_namespace` and `technical_stage` separately. An unqualified `VC-*` marker is not sufficient to prove current project ownership.

Unknown ownership is fail-closed and remains `UNROUTED/BLOCKED` or `PVC_ENRICHMENT_REQUIRED`.

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
| PVC-09 UAI / Data Ingestion | CAPITAL-AI-DATA | external input validation, provenance, credentials | SEC-01,03,04,08 | requirements + verification only |
| PVC-10 Evidence Management | CAPITAL-AI-DATA | exact identity, freshness, evidence integrity | SEC-04,06,10 | requirements + verification only |
| PVC-11 Data Quality | CAPITAL-AI-DATA | fail-closed DQ, no synthetic success | SEC-04,08,10 | requirements + verification only |
| PVC-12 Feature Engineering | CAPITAL-AI-FINTECH | feature/input integrity and provenance | SEC-01,04,08 | requirements + verification only |
| PVC-13 Scoring Models | CAPITAL-AI-FINTECH | model/registry integrity, least privilege | SEC-04,07,08 | requirements + verification only |
| PVC-14 Scoring Orchestration | CAPITAL-AI-FINTECH | dispatcher/tool integrity and no bypass | SEC-03,07,08 | requirements + verification only |
| PVC-15 Domain Analysis / Executor | CAPITAL-AI-FINTECH | provider/tool/domain execution boundary | SEC-01,03,07,08 | requirements + verification only |
| PVC-16 Canonical Scoring | CAPITAL-AI-FINTECH | result integrity and lineage | SEC-04,08,10 | requirements + verification only |
| PVC-17 Ranking / Decision Support | CAPITAL-AI-FINTECH | protected decision-input integrity | SEC-03,04,08,10 | requirements + verification only |
| PVC-18 EventMesh / Traceability | CAPITAL-AI-OPS | event/evidence integrity; EventMesh is not authority | SEC-06,07,10 | requirements + verification only |
| `src/platform/Security` | none | reusable IAM/Security helpers and Security-specific adapters | SEC-02..10 as applicable | inherently Security-owned component code only |

No row grants CAPITAL-AI-SEC primary PVC ownership.

## 3. Technical `VC-*` security coverage

Existing technical financial value-chain stages remain governed by their own architecture (`SC-MD-SPT-0001` and related authority). Security continues to verify relevant controls such as:

- identity/entitlement and capability authorization;
- provider and external-input validation;
- data integrity/provenance and DQ fail-closed behavior;
- scoring/dispatcher/result integrity;
- API/browser safe rendering and CSP;
- exact evidence identity and staleness handling.

Technical `VC-*` identifiers are never used as project-routing authority without explicit `project_namespace: PVC` / `project_stage: PVC-*` metadata.

## 4. Active Security finding re-correlation

The finding identities below remain valid. Their pre-sync handoff labels are retained only for historical traceability until current `PVC-*` project routing is explicitly enriched.

| Finding | Pre-sync handoff | Finding state after main sync | Required current-main routing action |
|---|---|---|---|
| S1-R2-03 | `[SECURITY_HANDOFF -> DC-SA | VC-05]` | OPEN / FINDING RETAINED | resolve current target project and PVC stage; likely Operations-owned lifecycle, do not assume silently |
| S1-R2-04 | `[SECURITY_HANDOFF -> DC-SA | VC-05]` | OPEN / FINDING RETAINED | resolve current Operations/Supervisor routing and record explicit PVC stage |
| S1-R2-05 | `[SECURITY_HANDOFF -> DEVELOPMENT | VC-03]` | OPEN / FINDING RETAINED | replace DevelopmentChain-as-project assumption with current Primary Project Owner; retain technical stage separately if applicable |
| S1-R2-06 | `[SECURITY_HANDOFF -> SC-MD-SPT | VC-03]` | ACTIVE / FINDING RETAINED | preserve SC-MD-SPT technical authority while separately resolving current project owner/PVC stage |
| S1-R2-07 | `[SECURITY_HANDOFF -> DC-SA | VC-05]` | OPEN / FINDING RETAINED | resolve current Operations/Production routing and explicit PVC stage |
| S1-R2-09 | `[SECURITY_HANDOFF -> SEO-GM | VC-18]` | PARTIAL / FINDING RETAINED | resolve target cross-cutting project plus affected current PVC stage without assigning PVC ownership to SEO |
| S1-R2-10 | `[SECURITY_HANDOFF -> DEVELOPMENT | VC-03]` | VERIFY PENDING / FINDING RETAINED | resolve current project owner plus production/evidence stage; keep technical stage separate |
| S1-R2-11 | `[SECURITY_HANDOFF -> DC-SA | VC-17]` | VERIFY PENDING / FINDING RETAINED | resolve current Evidence/Operations project routing and explicit PVC stage |
| MFA/AAL lifecycle drift | `[SECURITY_HANDOFF -> GOV | VC-02]` | CLARIFY / FINDING RETAINED | record `target_project: CAPITAL-AI-GOV`; correlate applicable PVC stage explicitly before closure |

Until enriched, these records are `PVC_ENRICHMENT_REQUIRED`, not current project-routing PASS.

## 5. Detailed finding evidence retained

### S1-R2-03 — Node control-plane convergence
- **threat/control:** inconsistent Node runtime/control-plane identity can invalidate hardening and verification assumptions.
- **severity:** P1 / HIGH program priority.
- **evidence:** S1-R2-03 plus current repository/runtime toolchain evidence.
- **verification gate:** exact-candidate policy/toolchain checks + hosted CI; runtime identity evidence where claimed.

### S1-R2-04 — fatal process handling
- **threat/control:** uncaught fatal error must not keep an unhealthy process serving work.
- **severity:** P1 / HIGH program priority.
- **verification gate:** negative child-process evidence + supervisor recovery evidence where runtime claim is made.

### S1-R2-05 — Stripe redirect boundary
- **threat/control:** client-controlled absolute Checkout redirect/open-redirect boundary.
- **severity:** P1 / HIGH program priority.
- **verification gate:** open-redirect negative tests + exact-candidate API tests.

### S1-R2-06 — entitlement authority
- **threat/control:** browser/client subscription projection must not grant a protected paid capability.
- **severity:** P1 / HIGH program priority.
- **evidence:** `docs/evidence/security/S1_R2_00_ENTITLEMENT_AUTHORITY_TRACE_2026-08-30.md`; PR #624 containment remains merged history/current implementation evidence.
- **verification gate:** browser-tier escalation, forged identity, missing bearer, stale entitlement and alternate client-path DENY evidence.

### S1-R2-07 — recovery/RPO/RTO
- **threat/control:** unverified recovery capability/RPO/RTO.
- **severity:** P1 / HIGH program priority.
- **verification gate:** measured actual RPO/RTO + integrity-validated restore evidence.

### S1-R2-09 — strict CSP promotion
- **threat/control:** strict CSP promotion without compatibility evidence can fail availability; report-only must not be mislabeled strict.
- **severity:** P2 / MEDIUM.
- **verification gate:** compatibility/violation evidence plus affected protected path verification.

### S1-R2-10 — demo billing isolation
- **threat/control:** production must not reach DEV billing simulation.
- **severity:** P2 / MEDIUM.
- **verification gate:** production bundle/runtime reachability evidence.

### S1-R2-11 — evidence identity/staleness
- **threat/control:** stale or wrong-identity evidence must not authorize current state.
- **severity:** P2 / MEDIUM.
- **verification gate:** trusted refresh/reconciliation behavior on current identities without candidate self-authorization.

### MFA/AAL authority lifecycle drift
- **threat/control:** implementation/evidence state and normative ESS/ADR lifecycle text must not be conflated.
- **severity:** P2 / CLARITY-INTEGRITY.
- **verification gate:** registry/document lifecycle consistency under current Governance validation.
- **boundary:** Security must not self-promote Governance/ADR/ESS authority.

## 6. Closed / retained findings

Synchronization does not reopen closed or historically verified Security work without regression evidence. This includes earlier LLM documentation self-authorization, custom local session trust, app-local access-token persistence, XFF authority, duplicated Security middleware, social-media SSRF/DNS-rebinding and previously remediated CSP `unsafe-eval` findings.

S1-R2-00 containment remains merged by PR #624; the broader S1-R2-06 capability inventory remains a distinct active finding.

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

## 9. Current synchronization invariants

- Security branch includes current `main@8e0e4a541da24ce2e28988e31c9a8bb7e5711a25`;
- no Security-owned foreign PVC execution;
- `PVC-*` and technical `VC-*` namespaces are separated;
- active finding identities are retained without silently inventing new project ownership;
- project-routing enrichment remains explicit work before renewed PR readiness;
- critical ambiguity fails closed;
- no duplicate Security authority;
- no duplicated domain implementation;
- no Security PR may absorb target-project productive remediation merely to keep one Security backlog.
