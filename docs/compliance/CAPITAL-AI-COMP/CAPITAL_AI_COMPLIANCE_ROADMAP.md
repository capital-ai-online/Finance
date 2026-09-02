# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.2.0  
**Date:** 2026-09-02  
**Status:** ACTIVE — CANONICAL COMPLIANCE ASSESSMENT ROADMAP / NON-AUTHORIZING  
**Primary Project Value Chain ownership:** none (`[]`)

## Purpose

`CAPITAL-AI-COMP` assesses applicability, requirements, evidence and compliance findings. It does not own productive PVC stages and does not implement foreign technical remediation.

Human-readable routing is:

```text
Requirement / Finding
→ affected PVC / Primary Owner
→ target project Roadmap
→ applicable ADR / ESS
→ owner implementation / tests / evidence
→ independent Compliance reassessment
```

Machine-readable findings and handoff records support traceability only; they do not create a second project-routing architecture.

## Compliance-owned workstreams

| WP | Workstream | State |
|---|---|---|
| `COMP-01` | Applicability | ACTIVE |
| `COMP-02` | Requirements | ACTIVE |
| `COMP-03` | Control Mapping | ACTIVE |
| `COMP-04` | Assessment / Verification | ACTIVE |
| `COMP-05` | Findings | ACTIVE |
| `COMP-06` | Evidence | ACTIVE |
| `COMP-07` | Remediation assignment to Primary Owner | ACTIVE |
| `COMP-08` | Continuous Compliance | ACTIVE |

## Authority boundary

Compliance consumes:

1. applicable binding obligations after competent applicability determination;
2. explicit Human/Owner decisions and effective accepted ADRs;
3. `/AGENTS.md`, Governance controls and active ESS;
4. the affected project Roadmap;
5. implementation/runtime evidence.

External standards and regulations do not become repository architecture authority merely because they are mapped here.

## Evidence model

Preferred evidence order:

1. runtime/provider evidence bound to identity/time/scope;
2. code/configuration/database policy state;
3. independent hosted CI on the exact **PR head SHA**;
4. registry/control evidence;
5. approved documentation;
6. roadmap claims.

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Candidate-Head lifecycle wording is retired from current assessment instructions.

Historical evidence remains history and is not automatic current proof.

Assessment statuses:

`COMPLIANT`, `PARTIALLY_COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, `NOT_ASSESSED`, `EVIDENCE_MISSING`.

`COMPLIANT` is used only when sufficient current scoped evidence exists.

## Finding lifecycle

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

Technical remediation is performed by the Primary Owner identified through the Project Value Chain and target project Roadmap. Compliance consumes returned evidence and reassesses independently.

## Traceability

```text
Requirement Source
↔ Applicability
↔ existing AUTH / CTRL
↔ applicable ADR / ESS
↔ affected PVC / Primary Owner
↔ target project Roadmap
↔ Implementation
↔ Evidence
↔ Compliance Assessment
↔ Finding / Verification
```

Existing matrices/registers under this Compliance project remain non-authorizing projections.

## Regulatory / standards treatment

- GDPR / DSGVO: applicability based on actual personal-data scope; bounded legal interpretation.
- EU AI Act: role/use-case dependent; high-risk scope is not inferred.
- DORA: requires legal/entity-scope review where applicability is uncertain.
- ISO/IEC 27001, ISO/IEC 42001, NIST SSDF/800-218A, NIST AI RMF, OWASP/CIS: benchmark/control-source input unless separately adopted by authority.

No certification or complete legal-compliance claim is created by engineering alignment alone.

## Continuous Compliance

Material changes to features, AI models, data sources, providers, markets, countries, user types, processing purposes, deployment models or external integrations trigger reassessment through COMP-08.

Continuous Compliance reuses repository/runtime/evidence capabilities and does not create a second runtime orchestrator.

## Exit criteria

Compliance work is complete for a finding only when:

- applicability is explicit;
- affected PVC / Primary Owner is identified;
- applicable ADR/ESS/control references are known where relevant;
- evidence gaps remain explicit;
- foreign technical remediation is performed by its owner;
- independent Compliance reassessment is complete;
- no unsupported certification/legal claim is introduced.

PR creation for Compliance-owned repository changes still requires the current Human/Owner gate bound to `main SHA` + `branch head SHA`; merge remains Human/CODEOWNER-only.
