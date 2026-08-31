# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.0.0  
**Date:** 2026-08-31  
**Status:** ACTIVE — CANONICAL COMPLIANCE EXECUTION ROADMAP / NON-AUTHORIZING  
**Owner:** CAPITAL-AI Owner / Compliance  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## 1. Purpose

Create one Compliance Single Point of Execution for CAPITAL-AI. This roadmap centralizes compliance assessment and tracking while preserving existing Governance, Security, Quality, Data, Development, Release and Operations ownership.

The roadmap is a coordination and traceability projection. It does not manufacture legal applicability, `AUTH-*`, `CTRL-*`, ADR, ESS, certification or merge/deployment authority.

## 2. Scope and non-goals

### In scope

- compliance scope and applicability;
- external/internal requirement inventory;
- requirement-to-authority/control mapping;
- evidence requirements and verification;
- compliance assessment and gaps;
- cross-roadmap compliance ownership;
- standards crosswalks;
- change-impact and continuous monitoring model;
- reporting and remediation traceability.

### Non-goals

- a second Governance Control Plane;
- a second control catalog;
- a second ADR/ESS namespace;
- a second Security architecture/roadmap;
- a second Quality Management system;
- a parallel Enterprise Risk Management model;
- legal opinions or unsupported certification/compliance claims;
- technical remediation inside fachdomain components unless separately authorized.

## 3. Authority

Compliance consumes current effective repository authority in this order:

1. explicit Human/Owner decisions and binding external obligations after applicability determination;
2. `/AGENTS.md`;
3. `docs/governance/authority-registry.json` and `control-catalog.json`;
4. accepted/current ADR/ESS/domain contracts resolved by their registries;
5. current policies/runbooks for their bounded scope;
6. implementation/runtime evidence;
7. non-authorizing roadmaps, inventories, reports and mappings.

Relevant current controls include `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`, `CTRL-GOV-HIST-001`, `CTRL-SDLC-BRANCH-001`, `CTRL-SDLC-SYNC-001`, `CTRL-SDLC-PR-CREATE-001`, `CTRL-CI-HOSTED-001`, `CTRL-MERGE-HUMAN-001`, `CTRL-DEPLOY-AUTH-001`, `CTRL-SEC-SECRET-001`, `CTRL-SEC-LEASTPRIV-001`, `CTRL-AIMS-PDCA-001` and `CTRL-COMPLIANCE-CLAIM-001`.

External requirements are never treated as repository Architecture Authority merely because they are listed here.

## 4. Compliance boundary

| Domain | Compliance relationship |
|---|---|
| Governance | consumes Authority, Controls and decision gates; never redefines them |
| Quality Management | consumes quality evidence where a compliance requirement depends on it; does not own quality gates |
| Security | maps requirements/controls and assesses evidence; Security owns design, hardening and verification |
| Risk | references the existing risk model/evidence where available; does not create parallel ERM |
| Development | defines/assesses SDLC evidence expectations; Development implements code/review/test controls |
| Data | maps privacy/data obligations; Data owns provenance, lineage, quality and retention implementations |
| Scoring | assesses decision-support/transparency/traceability evidence; scoring authority remains in scoring ADR/roadmap |
| Release/Production | assesses authorization, CI, deployment, rollback and runtime evidence; does not deploy |
| Operations | assesses monitoring/incident/continuity evidence; Operations owns procedures/execution |
| Legal/Human Owner | resolves legal applicability and accepted risk where repository evidence is insufficient |

## 5. Compliance value chain

```text
External / Internal Requirement
→ Applicability
→ Authority Mapping
→ Control Mapping
→ Domain Implementation
→ Evidence Collection
→ Compliance Assessment
→ Gap
→ Remediation
→ Verification
→ Reporting
→ Continuous Monitoring
```

Evidence is provenance-bound; a roadmap checkbox cannot by itself establish compliance.

## 6. Regulatory / standards inventory

Current repository-supported candidates:

| Source | Treatment | Initial disposition |
|---|---|---|
| GDPR / DSGVO | external requirement | APPLICABLE to repository-documented personal-data/controller scope; legal interpretation remains bounded |
| EU AI Act | external requirement | PARTIALLY_APPLICABLE / role-and-use-case dependent; high-risk applicability not inferred |
| DORA | external requirement | UNKNOWN / REQUIRES_LEGAL_REVIEW until entity scope is established |
| DDG / TDDDG / consumer obligations | external requirement | repository evidence exists; precise applicability remains scoped/legal-reviewed |
| contractual/vendor obligations | external/internal requirement | applicable only where an actual contract/provider/use exists |
| ISO/IEC 27001 | benchmark/control source | no certification claim; dated internal SoA evidence only |
| ISO/IEC 42001 | benchmark/control source | benchmark unless Owner adopts a bounded management-system target |
| NIST SSDF / SP 800-218A | benchmark/control source | Secure-SDLC crosswalk input |
| NIST AI RMF / GenAI profile | benchmark | AI-risk crosswalk input |
| OWASP / CIS | benchmark/control source | security/SDLC assessment input |

The detailed applicability decisions live in `inventory/APPLICABILITY_MATRIX.md`.

## 7. Compliance coverage matrix

All portfolio domains are covered through `mappings/VALUE_CHAIN_COMPLIANCE_COVERAGE_MATRIX.md`, including the 18-stage CAPITAL-AI value-chain projection: Agent Client, Controlled Implementation, Documentary Engine, Supervisor, Platform Director, Version Management, Release Management, Production Operations, UAI/Data Ingestion, Evidence Management, Data Quality, Feature Engineering, Scoring Models, Scoring Orchestration, Domain Analysis, Canonical Scoring, Ranking/Decision Support and EventMesh/Traceability.

The coverage matrix identifies requirements, existing controls/evidence, domain owner, compliance owner and open gaps without transferring implementation ownership.

## 8. Compliance work packages

The repository inventory resolves the following execution streams:

| WP | Workstream | Primary classification | Initial state |
|---|---|---|---|
| COMP-01 | Compliance Scope & Applicability | COMP-OWNED | ACTIVE |
| COMP-02 | Regulatory Requirements | COMP-OWNED | ACTIVE |
| COMP-03 | AI Compliance | COMP-SHARED | ACTIVE |
| COMP-04 | Data Protection & Privacy Compliance | COMP-SHARED | ACTIVE |
| COMP-05 | Security Compliance | COMP-SHARED | ACTIVE |
| COMP-06 | Secure SDLC Compliance | COMP-SHARED | ACTIVE |
| COMP-07 | Operational Compliance | COMP-SHARED | PLANNED |
| COMP-08 | Release & Production Compliance | COMP-SHARED | ACTIVE |
| COMP-09 | Documentation & Record Keeping | COMP-SHARED | ACTIVE |
| COMP-10 | Evidence & Auditability | COMP-OWNED | ACTIVE |
| COMP-11 | Standards Crosswalk | COMP-OWNED | ACTIVE |
| COMP-12 | Control Effectiveness Mapping | COMP-OWNED | ACTIVE |
| COMP-13 | Compliance Gap Management | COMP-OWNED | ACTIVE |
| COMP-14 | Compliance Reporting | COMP-OWNED | PLANNED |
| COMP-15 | Continuous Compliance Monitoring | COMP-SHARED | PLANNED |
| COMP-16 | Compliance Lifecycle & Change Impact | COMP-OWNED | ACTIVE |

Detailed DoD, dependencies and evidence are in `work-packages/COMPLIANCE_WORK_PACKAGES.md`.

## 9. Evidence model

Preferred evidence order:

1. runtime/provider evidence bound to identity/time/scope;
2. code/configuration and database policy state;
3. independent hosted CI on the exact candidate head;
4. registry/control evidence;
5. signed/approved documentation;
6. roadmap claims.

Evidence must identify provenance, date/baseline, responsible domain, requirement/control relationship and limitations. Historical evidence remains valid as history but cannot prove current state without revalidation.

## 10. Traceability

Required chain:

```text
Requirement
↔ AUTH
↔ CTRL
↔ ADR
↔ ESS
↔ Roadmap
↔ Work Package
↔ Implementation
↔ Evidence
↔ Assessment
```

`mappings/REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md` and `traceability/COMPLIANCE_TRACEABILITY_MATRIX.md` are the canonical non-authorizing projections for this chain. Requirement IDs are project-local identifiers and never replace `AUTH-*` or `CTRL-*` identities.

## 11. Gap management

Lifecycle:

```text
DISCOVERED → TRIAGED → APPLICABILITY_CONFIRMED → GAP_CONFIRMED
→ REMEDIATION_ASSIGNED → IMPLEMENTED → EVIDENCE_READY → VERIFIED → CLOSED
```

Alternate terminal states: `NOT_APPLICABLE`, `ACCEPTED_RISK`, `LEGAL_REVIEW`, `DEFERRED`, `SUPERSEDED`.

Severity:

- P0 CRITICAL: actual critical legal/control/authority/evidence failure with demonstrated scope;
- P1 HIGH: material gap requiring prioritized remediation/decision;
- P2 MEDIUM: significant but bounded evidence/process/control gap;
- P3 LOW: hygiene, metadata or deferred optimization gap.

No severity is derived solely from a regulation or standard name.

## 12. Risks

| Risk | Response |
|---|---|
| Compliance drift from changing product/provider/jurisdiction scope | COMP-16 change-impact assessment |
| false applicability/legal conclusion | fail closed to `UNKNOWN` or `REQUIRES_LEGAL_REVIEW` |
| duplicate authority/control hierarchy | map only to existing registries; Governance owns changes |
| stale evidence | baseline/date/provenance required; revalidate before `COMPLIANT` |
| certification overclaim | enforce `CTRL-COMPLIANCE-CLAIM-001` |
| historical ADR/ESS resurrected by citation | use current registries and `CTRL-GOV-HIST-001` |
| project/QM structural divergence | track `COMP-GAP-001`; reconcile only to future Human-merged canonical QM model |
| technical implementation copied into Compliance | keep COMP-SHARED domain ownership explicit |

## 13. Reporting

Compliance reporting provides:

- applicability status;
- requirement coverage;
- control/evidence coverage;
- findings by severity/lifecycle;
- evidence completeness/staleness;
- legal/Owner decisions required;
- remediation WP status;
- change-impact alerts.

Reports are assessments/evidence projections, never certification.

## 14. Exit criteria

The consolidation work package is complete when:

- all discovered current/historical roadmaps are inventoried or explicitly `UNKNOWN` with a reason;
- compliance-relevant work is classified `COMP-OWNED`, `COMP-SHARED`, `COMP-CONSUMER` or `NOT-COMPLIANCE`;
- existing compliance artifacts are inventoried and reused where appropriate;
- external requirements are separated from applicability and internal authority;
- no legal applicability is asserted without repository evidence or Human/Legal decision;
- no second Governance, QM, Security or ERM structure is created;
- `CAPITAL-AI-COMP` exists as the compliance execution index;
- requirement/control/evidence and cross-roadmap mappings exist;
- findings are prioritized and ADR/ESS conflicts/gaps documented;
- the Master Roadmap references `CAPITAL-AI-COMP` as Compliance Single Point of Execution;
- Registry impact is explicitly assessed;
- unsupported certification/compliance claims are not introduced;
- no unresolved evidence-backed P0 compliance conflict remains in this consolidation snapshot;
- final current-main synchronization, open-PR overlap check and exact candidate validation are complete before PR-creation approval is requested.

## Current next action

Execution proceeds through the work packages and matrices in this project. Fachroadmaps retain local implementation/evidence responsibility and refer compliance assessment to `CAPITAL-AI-COMP`; completed domain work is not reopened merely because ownership is consolidated.
