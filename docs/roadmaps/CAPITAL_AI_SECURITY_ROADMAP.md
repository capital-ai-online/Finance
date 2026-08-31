# CAPITAL-AI Security Roadmap

**Document ID:** `DOC-ROADMAP-CAPITAL-AI-SEC-2026-08-31`  
**Project ID:** `CAPITAL-AI-SEC`  
**Version:** `2.1.1`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY / NON-AUTHORIZING`  
**Date:** `2026-08-31`  
**Repository baseline:** `main@8e0e4a541da24ce2e28988e31c9a8bb7e5711a25`  
**Role:** `CROSS_CUTTING_SECURITY`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01` through `PVC-18`  
**Technical Security coverage:** existing technical `VC-*` stages where applicable; namespace remains separate from `PVC-*`  
**Owner:** CAPITAL-AI Owner  
**Security component:** `src/platform/Security`  
**Component specification:** ESS-0006 — Security & Compliance  
**Existing hardening program:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`  
**Trust root:** `AGENTS.md`

> CAPITAL-AI-SEC owns Security requirements, threat analysis, Security testing, findings and verification. It owns no productive `PVC-*` stage and does not silently convert a Security requirement into implementation ownership of another project.

## 1. Purpose

CAPITAL-AI-SEC is the cross-cutting protection and verification domain for CAPITAL-AI. It provides homogeneous Security requirements across the organizational Project Value Chain (`PVC-01..PVC-18`) and across applicable technical value-chain stages, detects and tracks Security findings, and independently verifies remediation.

It does **not** become a second Governance Control Plane, EventMesh, data pipeline, scoring architecture, production authority or hidden domain owner.

The current repository project model is defined by:

- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

`PVC-*` is the organizational project-routing namespace. Existing technical `VC-*` identifiers under `SC-MD-SPT-0001` remain separate and must not be silently interpreted as project ownership.

## 2. Security-owned scope

CAPITAL-AI-SEC owns only the cross-cutting Security functions below:

- Threat Modeling;
- Security Architecture Requirements;
- IAM Security requirements and verification;
- Application/API Security requirements and verification;
- Secrets Security;
- Data Security requirements and verification;
- Supply Chain Security requirements and verification;
- AI / Agent Security requirements and verification;
- Security Testing and negative-test design;
- Security Findings lifecycle;
- Security Verification.

`src/platform/Security` remains the existing technical Security component for inherently Security-owned reusable implementation such as identity verification helpers, Security middleware/utilities and Security-specific adapters. It is not a destination for unrelated domain remediation code.

## 3. Explicit non-ownership

CAPITAL-AI-SEC has no primary ownership of `PVC-01..PVC-18`.

Security may block a protected operation or a release/security gate when required evidence or a required control is missing. Blocking does not transfer implementation ownership.

Prohibited:

- second Governance Control Plane;
- second EventMesh;
- second data pipeline;
- second scoring architecture;
- autonomous Production mutation;
- self-accepted risk;
- Security requirement used as hidden domain ownership;
- moving foreign remediation code into `src/platform/Security` merely because the cause is Security-related;
- duplicating domain-local authorization, scoring, provider, data or runtime architecture inside Security.

## 4. Authority and reuse

CAPITAL-AI-SEC reuses the effective repository authority chain:

1. `AGENTS.md`;
2. Governance Authority Registry and Control Catalog;
3. applicable ADR/ESS/IAM/REM/Runbook authorities;
4. ESS-0006 for the existing Security/Compliance component;
5. current project-routing contracts under `docs/projects/**`;
6. existing Security decisions and S1 finding identities;
7. this roadmap only for non-authorizing Security coordination and verification.

No new ADR, ESS, `AUTH-*` or `CTRL-*` identity is allocated by this synchronization.

Existing controls, middleware, tests, Security evidence and S1 findings are reused before new architecture is proposed.

## 5. Cross-project handoff contract

CAPITAL-AI-SEC retains the compatibility marker required by the Security work model:

`[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

Under the current-main project-routing contract, every new or refreshed Security handoff must additionally carry:

- `project_namespace: PVC`;
- `project_stage: PVC-<NN>`;
- `target_project`;
- `task`;
- `reason`;
- `dependency`;
- `required_evidence`;
- `verification_gate`;
- `status`.

Where an existing technical financial stage is relevant, record it separately as:

- `technical_namespace`;
- `technical_stage`.

The compatibility marker's `VC-<NN>` must not be treated as a `PVC-*` identity or as a technical `SC-MD-SPT-0001` stage without those explicit namespace fields.

Security-specific finding fields remain:

- `affected_project`;
- `affected_vc_stage` for legacy/technical traceability where retained;
- `threat_or_control`;
- `severity`;
- `evidence`;
- `required_remediation`;
- `verification_gate`;
- `status`;
- target-project roadmap reference.

Rules:

- `execute_foreign_work: false`;
- foreign domain implementation remains target-project work;
- remediation PR belongs to the target project when implementation is primarily target-project code;
- HIGH/CRITICAL protected changes retain applicable Human/Owner gates;
- Security can require, test, reject and verify but cannot silently assume foreign implementation ownership;
- unclear project/PVC ownership is fail-closed and remains `UNROUTED/BLOCKED` until resolved.

## 6. Workstreams

| ID | Workstream | Security responsibility |
|---|---|---|
| SEC-01 | Threat Modeling | threats, attack surfaces, trust boundaries, affected project/stage mapping |
| SEC-02 | Identity & Access | AuthN/AuthZ/MFA/AAL/least-privilege requirements and verification |
| SEC-03 | Application/API Security | input/output/API/browser/capability security requirements and verification |
| SEC-04 | Data & Secrets | confidentiality, integrity, RLS/grants, secrets and credential boundaries |
| SEC-05 | Infrastructure | runtime/container/network/process/recovery Security requirements |
| SEC-06 | Supply Chain | dependency/build/artifact/provenance/release-integrity verification |
| SEC-07 | AI/Agent Security | prompt/tool/agent authority and untrusted-content boundaries |
| SEC-08 | Security Testing | positive/negative/regression/configuration Security tests |
| SEC-09 | Security Findings | triage, routing, remediation tracking, residual risk |
| SEC-10 | Verification | exact-candidate/runtime evidence, stale-evidence and closure verification |

SEC IDs are roadmap labels only and create no authority.

## 7. Project Value Chain coverage model

Security overlays every organizational stage while primary ownership remains external:

| Project stage | Primary Project Owner | Security focus |
|---|---|---|
| PVC-01 Agent Client | CAPITAL-AI-CLIENT | untrusted request/context, client-side authority boundaries |
| PVC-02 Controlled Implementation | CAPITAL-AI-OPS | controlled mutation, least privilege, secure implementation gates |
| PVC-03 Documentary Engine | CAPITAL-AI-DOC | untrusted content, evidence integrity, mutation separation |
| PVC-04 Supervisor | CAPITAL-AI-OPS | fail-fast, health/recovery, supervisory integrity |
| PVC-05 Platform Director | CAPITAL-AI-GOV | authority resolution, protected-action gates, no self-authorization |
| PVC-06 Version Management | CAPITAL-AI-OPS | toolchain/version integrity, exact identity |
| PVC-07 Release Management | CAPITAL-AI-OPS | release integrity, attestation, unverified-promotion denial |
| PVC-08 Production Operations | CAPITAL-AI-OPS | runtime hardening, production permissions, recovery evidence |
| PVC-09 UAI / Data Ingestion | CAPITAL-AI-DATA | external-input validation, provenance, credential boundaries |
| PVC-10 Evidence Management | CAPITAL-AI-DATA | evidence integrity, freshness, exact candidate/runtime identity |
| PVC-11 Data Quality | CAPITAL-AI-DATA | fail-closed DQ, no synthetic success |
| PVC-12 Feature Engineering | CAPITAL-AI-FINTECH | feature/input integrity and provenance |
| PVC-13 Scoring Models | CAPITAL-AI-FINTECH | model/registry integrity and least privilege |
| PVC-14 Scoring Orchestration | CAPITAL-AI-FINTECH | dispatcher/tool integrity and no bypass |
| PVC-15 Domain Analysis / Executor | CAPITAL-AI-FINTECH | provider/tool/domain execution boundary |
| PVC-16 Canonical Scoring | CAPITAL-AI-FINTECH | result integrity and lineage |
| PVC-17 Ranking / Decision Support | CAPITAL-AI-FINTECH | protected decision-input integrity |
| PVC-18 EventMesh / Traceability | CAPITAL-AI-OPS | event/evidence integrity; no EventMesh authorization |

This table is Security coverage, not ownership.

## 8. Technical value-chain coverage

Security also checks applicable technical `VC-*` stages under their existing technical authority, including identity/entitlement, provider/data integrity, scoring/ranking, API/browser and evidence boundaries. Those identifiers remain governed by their technical architecture and do not become project-routing identities through this roadmap.

## 9. Current finding re-correlation after main synchronization

The S1 finding identities remain valid and are not reopened merely because `main` advanced. However, the earlier branch-local handoff records used legacy target labels (`DC-SA`, `DEVELOPMENT`, `SC-MD-SPT`, `SEO-GM`, `GOV`) together with unqualified `VC-*` markers.

Current `main` now requires explicit `PVC-*` project routing. Therefore those handoff records are **not silently promoted** to current project-routing mappings. They remain finding evidence while project-routing enrichment is pending.

Status after synchronization:

- S1-R2-03/04/05/06/07/09/10/11: finding identities retained; `project_namespace/project_stage/target_project` must be re-correlated before PR readiness;
- MFA/AAL authority-lifecycle drift: Governance ownership remains conceptually applicable, but current `CAPITAL-AI-GOV` / `PVC-05` routing must be recorded explicitly before closure;
- S1-R2-00 containment remains merged historical/current implementation evidence and is not reopened.

No foreign implementation is executed by CAPITAL-AI-SEC while this routing enrichment is pending.

## 10. Finding lifecycle

```text
DISCOVERED → TRIAGED → CONFIRMED → ROUTED/ASSIGNED
→ target-project REMEDIATING → IMPLEMENTED → EVIDENCE_READY
→ Security VERIFIED → CLOSED
```

Alternative states: `FALSE_POSITIVE`, `ACCEPTED_RISK`, `DEFERRED`, `SUPERSEDED`.

`ACCEPTED_RISK` requires the applicable Human/Owner authority. Security cannot self-accept risk and an implementing agent cannot self-verify its own remediation solely from implementation.

## 11. Security testing and evidence

Security verification uses the strongest applicable evidence:

1. runtime Security evidence;
2. provider/security configuration readback;
3. negative Security tests;
4. hosted CI Security checks;
5. code implementation;
6. scan result;
7. approved policy/control;
8. roadmap status.

Missing or stale evidence never silently becomes PASS.

## 12. S1 and existing Security architecture

S1 remains the existing bounded hardening/findings program and retains all S1-R2 identities. CAPITAL-AI-SEC does not duplicate it. V2 changes the relationship from centralized remediation execution to cross-cutting requirement/routing/verification.

Existing VERIFIED/HISTORICAL Security work remains closed unless new evidence demonstrates regression.

The repository Governance Control Plane, IAM authorities, Secrets mechanisms, EventMesh, scoring/data architecture, Release and Production authorities remain separate and unchanged.

## 13. Definition of Done

CAPITAL-AI-SEC V2 is complete when:

- every active Security finding has an affected Primary Project Owner plus explicit `PVC-*` project routing;
- technical `VC-*` stages are separately namespaced where relevant;
- cross-project Security dependencies are explicit;
- no `PVC-01..PVC-18` stage is claimed as Security primary ownership;
- target-project roadmap references exist for every foreign implementation handoff;
- Security requirements and verification gates are traceable;
- no duplicate Security authority or duplicated domain implementation is introduced;
- critical ambiguity fails closed;
- no unresolved P0 Security conflict exists;
- exact-candidate/runtime verification evidence is traceable for VERIFIED claims.

## 14. PR boundary

Security consolidation/documentation changes use project prefix `CAPITAL-AI-SEC` and remain one-project scope.

A remediation PR that mainly changes foreign-domain implementation belongs to that target project, not to CAPITAL-AI-SEC.

PR creation requires a separate explicit Owner approval after final `main`/open-PR correlation and after reporting exact `main` and candidate SHAs. Merge remains Human/CODEOWNER-only. Direct `main` edits are prohibited.
