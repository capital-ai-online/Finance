# Value-Chain Compliance Coverage Matrix

**Document ID:** `DOC-COMP-VC-COVERAGE-2026-08-31`  
**Role:** assessment mapping / non-authorizing  
**Version:** 1.0.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Primary value-chain ownership by Compliance:** `[]`

Compliance maps requirements and evidence across the value chain. It never becomes the technical Primary Owner of a stage.

| VC | Stage | Primary Owner / current technical authority | Compliance-relevant requirement groups | Existing evidence/control sources | Assessment posture | Open Compliance action |
|---|---|---|---|---|---|---|
| VC-01 | Agent Client | Development / Frontend / Security depending concern | REQ-COMP-002, 009, 015, 019, 021, 023 | AGENTS, Frontend authority, S1 evidence, privacy APIs, transparency material | PARTIALLY_COMPLIANT / mixed evidence | assess current UI/auth/privacy/transparency evidence; hand off technical gaps |
| VC-02 | Controlled Implementation | Development / Governance | REQ-COMP-001, 003..007, 010..012, 024..028 | AGENTS, Control Catalog, ADR/ESS registries, GitHub branch/PR/CI evidence, standards crosswalk | PARTIALLY_COMPLIANT; final candidate gates pending | final snapshot assessment; no duplicate SDLC/Governance controls |
| VC-03 | Documentary Engine | Documentary | REQ-COMP-011, 012, 035 | ESS-0010/0012, document registry, lifecycle policy, Documentary evidence | PARTIALLY_COMPLIANT | verify document identity/lifecycle/evidence references; technical gap → DOC handoff |
| VC-04 | Supervisor | Supervisor / VC-COV mapped owner | REQ-COMP-029, 033 | ESS-0002, VC-COV inventory/evidence | NOT_ASSESSED | assess finding/escalation evidence only; implementation stays target owner |
| VC-05 | Platform Director | Platform Director / VC-COV mapped owner | REQ-COMP-001, 029, 033 | ESS-0003, Governance controls, VC-COV evidence | NOT_ASSESSED | verify decision/authority traceability without adding autonomous authority |
| VC-06 | Version Management | Release/Governance current version control plane | REQ-COMP-011, 012, 033, 036 | `package.json#version`, Release version services, ADR-0096, VC-COV | PARTIALLY_COMPLIANT | assess current authority/evidence; historical ESS-0004 remains non-authorizing |
| VC-07 | Release Management | Release | REQ-COMP-006..008, 036 | DevelopmentChain controls, release runbooks, CI/deploy evidence | NOT_ASSESSED for future release | consume exact-SHA release evidence; no release execution by Compliance |
| VC-08 | Production Operations | Operations / Release / Security | REQ-COMP-008, 022, 032, 036 | deployment control, S1 roadmap/evidence, operations handoffs/runbooks | EVIDENCE_MISSING for measured restore; legal scope unresolved for DORA | S1 resilience handoff + Legal Review for DORA entity scope |
| VC-09 | UAI / Data Ingestion | Data / provider-data-plane owners | REQ-COMP-013, 014, 016, 017, 031, 034 | privacy processing/vendor evidence, data/provider provenance controls | PARTIALLY_COMPLIANT; vendor evidence incomplete | complete evidence assessment; hand off data/vendor/legal gaps |
| VC-10 | Evidence Management | Documentary / Traceability / source-domain owners | REQ-COMP-014, 029, 033, 035 | `docs/evidence/**`, compliance runs, registries, Documentary/Traceability sources | PARTIALLY_COMPLIANT | COMP-06 provenance/freshness/sufficiency assessment |
| VC-11 | Data Quality | Data Quality / VC-COV mapped owner | REQ-COMP-013, 029, 034 | DQ controls, VC-COV package, scoring/data evidence | NOT_ASSESSED end-to-end | assess evidence completeness; technical remediation stays Data Quality |
| VC-12 | Feature Engineering | Data / Scoring feature owners | REQ-COMP-029, 034 | feature/scoring contracts and evidence | NOT_ASSESSED end-to-end | map provenance/integrity evidence; no feature implementation |
| VC-13 | Scoring Models | SC-MD-SPT-0001 / model owners | REQ-COMP-018..020, 027, 034 | scoring ADRs, model registry/evidence, AI inventory | NOT_ASSESSED for complete legal AI scope | map AI/traceability requirements; technical gap to SC-MD-SPT |
| VC-14 | Scoring Orchestration | SC-MD-SPT-0001 | REQ-COMP-020, 029, 034 | ScoringDispatcher/orchestration evidence and authorities | NOT_ASSESSED end-to-end | verify bounded authority and evidence chain |
| VC-15 | Domain Analysis | domain-analysis owners incl. FinTech modules | REQ-COMP-018..020, 029, 034 | domain roadmaps/ADRs/evidence | NOT_ASSESSED by every domain | assess material AI/decision-support use cases; target-domain handoff on gap |
| VC-16 | Canonical Scoring | SC-MD-SPT-0001 | REQ-COMP-020, 029, 034 | ADR-0087 and scoring evidence | PARTIALLY_COMPLIANT as engineering boundary; legal scope separate | assess provenance/human-boundary evidence |
| VC-17 | Ranking / Decision Support | SC-MD-SPT / Product / affected AI domain | REQ-COMP-018..020, 027, 030, 034 | ranking/scoring authority, AI inventory, transparency contracts | PARTIALLY_APPLICABLE; NOT_ASSESSED across all use cases | AI Act applicability/assessment; Legal Review on triggered high-risk questions |
| VC-18 | EventMesh / Traceability | EventMesh / Traceability | REQ-COMP-029, 033, 035 | ESS-0011/0013, event/traceability evidence, VC-COV | PARTIALLY_COMPLIANT / coverage assessment incomplete | assess audit/event traceability; technical gap to EventMesh/Traceability owner |

## Coverage rule

For every row, Compliance may set applicability, map controls, assess evidence, record a finding and verify returned evidence. It may not implement the stage. A confirmed technical or organizational remediation outside Compliance creates:

```text
[COMPLIANCE_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

The corresponding target roadmap/reference is recorded in `COMPLIANCE_HANDOFF_REGISTER.md`.
