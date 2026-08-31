# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Display name:** CAPITAL-AI Compliance  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Date:** 2026-08-31  
**Status:** ACTIVE — CANONICAL COMPLIANCE ASSESSMENT ROADMAP / NON-AUTHORIZING  
**Owner:** CAPITAL-AI Owner / Compliance  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Primary value-chain ownership:** none (`[]`)

## 1. Purpose

`CAPITAL-AI-COMP` is the central execution surface for **Compliance assessment**, not for foreign technical implementation. It maps applicable internal/external requirements across relevant CAPITAL-AI value-chain stages, assesses evidence, records findings and delegates remediation to the Primary Owner of the affected architecture/value-chain stage.

The roadmap is a coordination, assessment and traceability projection. It does not manufacture legal applicability, `AUTH-*`, `CTRL-*`, ADR, ESS, certification, merge/deployment authority or technical execution ownership.

## 2. Scope and non-goals

### Compliance-owned scope

- Applicability;
- Requirement Mapping;
- Control Mapping to existing authorities/controls;
- Compliance Assessment;
- Compliance Findings;
- Compliance Evidence;
- Regulatory Traceability;
- Legal Review Handoff;
- Remediation Handoff;
- Continuous Compliance change-impact/freshness assessment.

### Non-goals

- any primary value-chain execution ownership;
- technical remediation in Security, Development, Data, Scoring, Documentary, Release, Production, Operations, Frontend or other domains;
- a second Governance Control Plane or policy hierarchy;
- a second control catalog;
- a second ADR/ESS namespace;
- a second Security architecture/roadmap;
- a second Quality Management system;
- a parallel Enterprise Risk Management model;
- legal opinions or unsupported certification/compliance claims.

## 3. Authority

Compliance consumes current effective repository authority in this order:

1. applicable binding obligation after source-backed applicability determination and competent Legal/Human decision where required;
2. explicit Human/Owner decisions and effective Accepted ADRs within scope;
3. `/AGENTS.md`, current Governance Control Catalog and effective ESS/governance policies;
4. approved domain roadmaps/contracts/runbooks implementing higher authority;
5. implementation/runtime evidence;
6. non-authorizing inventories, assessments, reports and mappings.

Relevant controls include `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`, `CTRL-GOV-HIST-001`, `CTRL-SDLC-BRANCH-001`, `CTRL-SDLC-SYNC-001`, `CTRL-SDLC-PR-CREATE-001`, `CTRL-CI-HOSTED-001`, `CTRL-MERGE-HUMAN-001`, `CTRL-DEPLOY-AUTH-001`, `CTRL-SEC-SECRET-001`, `CTRL-SEC-LEASTPRIV-001`, `CTRL-AIMS-PDCA-001` and `CTRL-COMPLIANCE-CLAIM-001`.

External requirements are not repository Architecture Authority merely because they are listed or mapped by Compliance.

## 4. Compliance boundary

| Domain | Primary ownership | Compliance relationship |
|---|---|---|
| Governance | authority, controls, decision gates, supersession | consume/map only |
| Quality Management | quality control/test/improvement | consume quality evidence where relevant |
| Security | technical security design/hardening/testing | assess and hand off gaps |
| Development | code, SDLC, review/test/CI implementation | assess and hand off gaps |
| Data/Privacy implementation | data flows, lineage, retention mechanisms | assess requirements/evidence; legal scope separately gated |
| Scoring/Product/AI | model, scoring, decision-support implementation | assess transparency/traceability/AI obligations |
| Documentary/Evidence | documentary engine and evidence lifecycle implementation | consume provenance-bound evidence |
| Release/Production/Operations | release, deploy, monitoring, incident/continuity execution | assess authorization/evidence; never execute |
| Legal/Human Owner | legal applicability and competent risk acceptance | receives Legal Review handoffs |

## 5. Compliance value chain

```text
Requirement Source
→ COMP-01 Applicability
→ COMP-02 Requirements
→ COMP-03 Control Mapping
→ Primary Owner implementation (outside Compliance)
→ COMP-06 Evidence
→ COMP-04 Assessment
→ COMP-05 Findings
→ COMP-07 Remediation Handoff
→ Primary Owner remediation (target-project work)
→ Evidence return
→ COMP-04 Verification
→ COMP-08 Continuous Compliance
```

Evidence is provenance-bound; a roadmap checkbox cannot by itself establish compliance.

## 6. Regulatory / standards inventory

| Source | Treatment | Current disposition |
|---|---|---|
| GDPR / DSGVO | external requirement | `APPLICABLE` to repository-documented personal-data scope; individual legal interpretations remain bounded |
| EU AI Act | external requirement | `PARTIALLY_APPLICABLE` / role-and-use-case dependent; high-risk scope not inferred |
| DORA | external requirement | `REQUIRES_LEGAL_REVIEW` until entity/business scope is established |
| DDG / TDDDG / consumer obligations | external requirement | relevance documented; exact obligation set Legal Review gated |
| contractual/vendor obligations | external/internal requirement | applicable only for actual contracts/providers/use cases |
| ISO/IEC 27001 | benchmark/control source | dated internal SoA only; no certification claim |
| ISO/IEC 42001 | benchmark/control source | benchmark unless explicitly adopted as a bounded management-system target |
| NIST SSDF / SP 800-218A | benchmark/control source | secure-SDLC / AI-development assessment input |
| NIST AI RMF / GenAI profile | benchmark | AI-risk assessment input |
| OWASP / CIS | benchmark/control source | security/SDLC assessment input |

Detailed dispositions live in `inventory/APPLICABILITY_MATRIX.md`.

## 7. Value-chain coverage

Compliance has no primary VC ownership. `mappings/VALUE_CHAIN_COMPLIANCE_COVERAGE_MATRIX.md` maps requirements, Primary Owners, evidence and open gaps over these 18 stages:

1. `VC-01` Agent Client
2. `VC-02` Controlled Implementation
3. `VC-03` Documentary Engine
4. `VC-04` Supervisor
5. `VC-05` Platform Director
6. `VC-06` Version Management
7. `VC-07` Release Management
8. `VC-08` Production Operations
9. `VC-09` UAI / Data Ingestion
10. `VC-10` Evidence Management
11. `VC-11` Data Quality
12. `VC-12` Feature Engineering
13. `VC-13` Scoring Models
14. `VC-14` Scoring Orchestration
15. `VC-15` Domain Analysis
16. `VC-16` Canonical Scoring
17. `VC-17` Ranking / Decision Support
18. `VC-18` EventMesh / Traceability

When a finding requires foreign implementation, Compliance creates `[COMPLIANCE_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]` and stops local technical execution.

## 8. Workstreams

The V2.1 project model has exactly eight workstreams:

| WP | Workstream | Scope | State |
|---|---|---|---|
| `COMP-01` | Applicability | source/scope/jurisdiction/use-case applicability; Legal Review separation | ACTIVE |
| `COMP-02` | Requirements | source-backed requirements and versions | ACTIVE |
| `COMP-03` | Control Mapping | map to existing AUTH/CTRL/ADR/ESS/roadmap; no duplicate policy | ACTIVE |
| `COMP-04` | Assessment | evidence-based assessment and verification | ACTIVE |
| `COMP-05` | Findings | normalized findings, severity, lifecycle | ACTIVE |
| `COMP-06` | Evidence | provenance, completeness, staleness and sufficiency | ACTIVE |
| `COMP-07` | Remediation Handoff | Primary Owner assignment + target roadmap/VC marker | ACTIVE |
| `COMP-08` | Continuous Compliance | change impact, reassessment and monitoring | ACTIVE |

`COMP-09`…`COMP-16` are retired branch-draft labels and must not appear as current workstreams after migration. Their subject matter is absorbed into COMP-01…08.

Detailed DoD/dependencies are in `work-packages/COMPLIANCE_WORK_PACKAGES.md`.

## 9. Handoff model

Canonical marker:

```text
[COMPLIANCE_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

Every active handoff must contain:

- source requirement;
- applicability;
- affected Primary Owner project;
- affected VC stage;
- existing authority/control mapping;
- evidence/evidence gap;
- assessment/finding;
- required remediation outcome (not implementation design unless needed to define the compliance result);
- target roadmap reference;
- Legal Review flag;
- handoff status.

`execute_foreign_work = false`. Technical remediation is performed in the target project's work item/branch/PR. `CAPITAL-AI-COMP` consumes returned evidence and reassesses independently.

## 10. Finding model

Required fields:

```text
requirement
applicability
affected_project
affected_vc_stage
evidence
assessment
required_remediation
legal_review_required
status
```

Finding IDs/severity are traceability metadata in addition to, not instead of, these fields.

Lifecycle:

```text
DISCOVERED
→ TRIAGED
→ APPLICABILITY_CONFIRMED
→ GAP_CONFIRMED
→ REMEDIATION_ASSIGNED
→ IMPLEMENTED
→ EVIDENCE_READY
→ VERIFIED
→ CLOSED
```

Alternate terminal states: `NOT_APPLICABLE`, `ACCEPTED_RISK`, `LEGAL_REVIEW`, `DEFERRED`, `SUPERSEDED`.

Severity is `P0 CRITICAL`, `P1 HIGH`, `P2 MEDIUM`, `P3 LOW` and must be evidence/scope-derived.

## 11. Evidence model

Preferred evidence order:

1. runtime/provider evidence bound to identity/time/scope;
2. code/configuration/database policy state;
3. independent hosted CI on the exact candidate head;
4. registry/control evidence;
5. signed/approved documentation;
6. roadmap claims.

Evidence records identify provenance, baseline/date, responsible domain, requirement/control relationship and limitations. Historical evidence remains history, not automatic current proof.

Assessment statuses:

`COMPLIANT`, `PARTIALLY_COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, `NOT_ASSESSED`, `EVIDENCE_MISSING`.

`COMPLIANT` is used only when sufficient current scoped evidence exists.

## 12. Traceability

Required chain:

```text
Requirement Source
↔ Applicability
↔ Existing AUTH / CTRL
↔ ADR / ESS
↔ Primary Owner Roadmap / VC Stage
↔ Implementation
↔ Evidence
↔ Compliance Assessment
↔ Finding
↔ Handoff
↔ Remediation Evidence
↔ Verification
```

`mappings/REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md`, `mappings/COMPLIANCE_HANDOFF_REGISTER.md` and `traceability/COMPLIANCE_TRACEABILITY_MATRIX.md` are non-authorizing projections of this chain.

## 13. Continuous Compliance

New or changed features, AI models, data sources, providers, markets, countries, user types, processing purposes, deployment models or external integrations trigger:

```text
Change
→ COMP-08 impact review
→ COMP-01 applicability reassessment
→ COMP-02 requirement delta
→ COMP-03 control impact
→ COMP-06 evidence impact
→ COMP-04 reassessment
→ COMP-05 finding if required
→ COMP-07 handoff if foreign remediation is required
```

Continuous Compliance does not create a second runtime orchestrator. Existing repository/runtime/evidence capabilities are reused.

## 14. Risks and controls

| Risk | Response |
|---|---|
| Compliance drift | COMP-08 change-impact/freshness review |
| false applicability/legal conclusion | `UNKNOWN` / `REQUIRES_LEGAL_REVIEW` fail closed |
| duplicate policy hierarchy | COMP-03 maps only to existing authority/control sources |
| foreign technical execution | COMP-07 handoff; target-project PR required |
| stale/missing evidence | COMP-06 keeps gap explicit; no positive claim |
| certification overclaim | `CTRL-COMPLIANCE-CLAIM-001` |
| historical ADR/ESS resurrection | current registries + `CTRL-GOV-HIST-001` |
| project/QM structural divergence | `COMP-GAP-001`; no invented QM template |

## 15. Exit criteria

The consolidation is complete when:

- requirements are source-backed and mapped;
- applicability states are explicit and Legal Review items are separated;
- Primary Owner projects and relevant VC stages are explicit for implementation-dependent requirements/findings;
- existing Controls/Authorities are reused rather than duplicated;
- evidence gaps remain explicit;
- assessments use the defined statuses and no unsupported compliance/certification claim is introduced;
- active findings use the required field set;
- every required foreign remediation has a `COMP-07` handoff with target roadmap reference;
- no foreign technical execution exists in this branch;
- no second Governance, Security, QM, Risk or technical architecture has been introduced;
- `CAPITAL-AI-COMP` is integrated into the Master Roadmap as Compliance assessment Single Point of Execution;
- Registry impact is assessed without treating roadmap/assessment/evidence as Authority/Control;
- final current-main synchronization, open-PR correlation and low-cost validation pass before PR-creation approval is requested.

## 16. PR boundary

This consolidation remains a `CAPITAL-AI-COMP` documentation/assessment scope. Technical remediation identified by it uses the target project's PR. PR creation requires explicit Human/Owner approval for the exact final main/head snapshot; merge remains Human/CODEOWNER-only.
