# ADR / ESS Compliance Correlation Matrix

**Document ID:** `DOC-COMP-ADR-ESS-CORRELATION-2026-08-31`  
**Role:** inventory / correlation report / non-authorizing  
**Version:** 1.2.0  
**Date:** 2026-09-05  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main correlation:** `main@33d48e829af4b2fc82d4e561018092f3a5c318ff`  
**Status:** `COMP-03 EXECUTED — ADR/ESS MAPPING CURRENT; GOVERNANCE RETURN GAPS PRESERVED`

This matrix does not modify ADR/ESS lifecycle. It identifies Compliance-relevant relationships and gaps against the current registries. Any lifecycle remediation remains Governance/ADR/ESS-owner work, not Compliance execution.

| Artifact | Current registry / authority state | Compliance relevance | COMP-03 classification | Current finding / rationale | Owner / next gate |
|---|---|---|---|---|---|
| `ADR-0007-compliance-value-chain.md` | document declares `ACCEPTED`; current `docs/adr/registry.json` has **no migrated ADR-0007 record or stable authorityId** | legacy Compliance/Data/FinTech/audit/export decision text | **OPEN GOVERNANCE GAP — NOT USED AS CURRENT MAPPING AUTHORITY** | legacy text contains broad legal/certification claims and crosses current PVC ownership boundaries; historical ACCEPTED wording cannot self-authorize | `CAPITAL-AI-GOV / PVC-05`; fresh Governance work item must decide `clarify / migrate / supersede / archive`; COMP reassesses returned evidence |
| `ADR-0012-SecurityComplianceAuditor.md` | resolved implementation document / historical implementation evidence | native Compliance scanner/reporting implementation | **KEEP / EVIDENCE CONSUMER** | implementation/evidence source only; does not create Compliance authority hierarchy | COMP-06/08 may consume current evidence if still valid |
| `ADR-0017-audit-nachbesserungen-quota-supabase-stripe-compliance.md` | legacy accepted implementation decision / revalidation evidence exists | backend/persistence support for Compliance evidence | **KEEP / EVIDENCE CONSUMER** | technical evidence only, not current Authority by age/citation | target owner supplies fresh evidence when needed |
| ADR-0086 vendor privacy evidence governance | current registry `accepted-for-implementation`, stable authority `AUTH-ADR-VENDOR-PRIVACY-EVIDENCE-2026-08-19` | vendor/privacy evidence governance | **KEEP / CURRENT AUTHORITY** | valid current mapping source | COMP-01/03/04/06; missing contractual/legal evidence remains Human/Legal + actual provider owner |
| ADR-0092 privacy retention | current registry `accepted-for-implementation`, stable authority `AUTH-ADR-PRIVACY-RETENTION-2026-08-19` | retention/lifecycle | **KEEP / CURRENT AUTHORITY** | current domain authority; implementation remains Data/Operations owner-scoped | COMP-04/06; target remediation only if evidence confirms a gap |
| ADR-0095 privacy single source | current registry accepted, stable authority `AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19` | privacy source-of-truth boundary | **KEEP / CURRENT AUTHORITY** | prevents parallel privacy governance | COMP-03 references; no duplicate privacy policy/control plane |
| ADR-0096 Governance Control Plane | current registry accepted, stable authority `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19` | repository Authority/Control Plane | **KEEP / CONTROLLING BOUNDARY** | prevents Compliance from creating parallel governance | all COMP mappings subordinate |
| ADR-0097 Documentary maintenance loop | current registry accepted | records/evidence lifecycle sidecar | **KEEP / CONSUMER** | Documentary remains bounded evidence/document lifecycle provider | COMP-03/04/06; Documentary remediation stays `CAPITAL-AI-DOC / PVC-03` |
| ADR-0087 Canonical Scoring | accepted current scoring authority | canonical scoring / dispatcher / decision-boundary evidence | **KEEP / CONSUMER** | protects single scoring authority and supports factual AI/financial-decision boundaries | `CAPITAL-AI-FINTECH / PVC-13..17`; COMP consumes only for mapping/assessment |
| ADR-0099 FinTechCore Crypto Module | current registry accepted | research/live-execution and evidence boundaries | **KEEP / CONSUMER** | technical/domain authority remains outside Compliance | `CAPITAL-AI-FINTECH`; target remediation via COMP-07 only when confirmed |
| ESS-0005 Quality Center | ESS registry `published`; project surface now exists | Quality evidence producer | **KEEP / CONSUMER** | old “QM project template absent” observation is superseded on current main | consume QM evidence only; QM remains cross-cutting, no productive PVC |
| ESS-0006 Security & Compliance | ESS registry `published` v1.0.0; owner `Platform Director` | component specification for `src/platform/Security` and `src/platform/Compliance` | **KEEP BOUNDED / CLARIFICATION GAP** | body still contains stale paths/events/findings and a `ComplianceRequirementRegistry` concept that must not become a second normative requirement registry; current COMP-02 inventory is non-authorizing traceability, not that runtime/normative registry | `CAPITAL-AI-GOV / PVC-05`; reconcile **after ADR-0007 decision**; COMP uses only bounded component/evidence principles meanwhile |
| ESS-0010 Documentary Engine | ESS registry published | report/evidence producer | **KEEP / CONSUMER** | Documentary owns physical document/evidence implementation | `CAPITAL-AI-DOC / PVC-03`; COMP-06 consumes returned evidence |
| ESS-0011 Enterprise Traceability | ESS registry published/currently registered | traceability relationships | **KEEP / CONSUMER** | traceability transport/evidence does not create business/Compliance authority | `CAPITAL-AI-OPS / PVC-18` and `CAPITAL-AI-DATA / PVC-10` as applicable |
| ESS-0012 Documentation Governance | ESS registry published, documentation-only | document hygiene/evidence integrity | **KEEP / CONSUMER** | must not become global Compliance or merge authority | `CAPITAL-AI-DOC / PVC-03` + GOV policy boundary |
| ESS-0016 Provider Data Plane / Provenance / Freshness | active provider/data contract used by current architecture | provider provenance/freshness input | **KEEP / CONSUMER** | supports REQ-COMP-034 mapping without creating provider authority in COMP | `CAPITAL-AI-DATA / PVC-09..11` |
| ESS-0019 Universal AI Agent Control Plane | current authority `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` | AI capability/risk/audit boundaries | **KEEP / CURRENT CONSUMER AUTHORITY** | explicitly subordinate to AGENTS/current Control Plane | COMP-01/02/03/04/08 consumer; legal role remains separate Human/Legal determination |

## Current COMP-03 gap result

- **ADR lifecycle/semantic gaps:** `1` — `COMP-GAP-002 / ADR-0007`.
- **ESS clarification gaps:** `1` — `COMP-GAP-003 / ESS-0006`.
- **Current stable P0 Authority conflicts identified by COMP-03:** `0`.
- **New ADRs created by COMP:** `0`.
- **New ESS records created by COMP:** `0`.
- **New Controls/Authorities created by COMP:** `0`.

## Handoff boundary

1. ADR-0007 lifecycle/semantic remediation is **Governance-owned** under `PVC-05`; COMP does not edit `docs/adr/registry.json` or rewrite the ADR in this work item.
2. ESS-0006 clarification is **Governance/ESS-owner work** and is sequenced after the ADR-0007 decision by the current Governance Roadmap.
3. Compliance preserves the source evidence, requirement/control mapping, open finding and expected return evidence, then independently reassesses after owner return.
4. Historical `VC-*` handoff markers remain history/coordination metadata only; current ownership uses `PVC-*` mapping.

COMP-03 may therefore complete without waiting for foreign Governance implementation: the mapping correctly records the missing/ambiguous Authority as an owner-routed gap rather than silently inventing a replacement.