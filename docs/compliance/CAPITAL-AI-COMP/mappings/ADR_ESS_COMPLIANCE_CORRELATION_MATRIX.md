# ADR / ESS Compliance Correlation Matrix

**Document ID:** `DOC-COMP-ADR-ESS-CORRELATION-2026-08-31`  
**Role:** inventory / correlation report / non-authorizing  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

This matrix does not modify ADR/ESS lifecycle. It identifies compliance-relevant relationships and gaps against the current registries.

| Artifact | Registry state / authority | Compliance relevance | Classification | Finding / rationale | Action in CAPITAL-AI-COMP |
|---|---|---|---|---|---|
| `ADR-0007-compliance-value-chain.md` | present in legacy `adr_history.json` as ACCEPTED; **not migrated into current `docs/adr/registry.json`** | historical Compliance value-chain decision | **CLARIFY / MIGRATE-GAP** | text mixes technical product architecture with legal assertions such as “rechtssicher”/regulator references and an automated certification export; current Control Plane requires scoped evidence and no unsupported claims | do not treat as current standalone compliance authority; preserve traceability and require Governance/Owner decision before any future ADR lifecycle migration |
| `ADR-0012-SecurityComplianceAuditor.md` | resolved implementation document | native Compliance scanner/reporting implementation | **KEEP** | explicitly says internal scanner/ISO mappings are not legal certification | reuse runtime/evidence; no duplicate auditor |
| `ADR-0017-audit-nachbesserungen-quota-supabase-stripe-compliance.md` | legacy accepted implementation decision / revalidation evidence exists | backend/persistence implementation support for ADR-0012 | **KEEP / CONSUMER** | technical implementation evidence, not compliance authority hierarchy | reference as implementation evidence |
| ADR-0086 vendor privacy evidence governance | current registry `accepted-for-implementation`, stable authority `AUTH-ADR-VENDOR-PRIVACY-EVIDENCE-2026-08-19` | vendor/privacy evidence governance | **KEEP** | current stable authority; open evidence can be assessed centrally | COMP-04/10 consumes it |
| ADR-0092 privacy retention | current registry `accepted-for-implementation`, stable authority `AUTH-ADR-PRIVACY-RETENTION-2026-08-19` | retention/lifecycle | **KEEP** | current domain authority; implementation remains Privacy/Data-owned | COMP-04/10 mapping |
| ADR-0095 privacy single source | current registry accepted, stable authority `AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19` | privacy source-of-truth boundary | **KEEP** | prevents parallel privacy governance | Compliance references it; no parallel privacy policy |
| ADR-0096 Governance Control Plane | current registry accepted, stable authority `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19` | repository Authority/Control Plane | **KEEP** | primary boundary preventing Compliance from creating parallel governance | all COMP artifacts subordinate |
| ADR-0097 Documentary maintenance loop | current registry accepted | records/evidence lifecycle sidecar | **KEEP / CONSUMER** | Documentary remains read-only/bounded; useful evidence provider | COMP-09/10 consumer |
| ADR-0099 FinTechCore Crypto Module | current registry accepted | bounded research/live-execution and risk/compliance evidence relationships | **KEEP / CONSUMER** | technical/domain authority remains outside Compliance | COMP-03/08/10 consumer |
| ESS-0005 Quality Center | ESS registry `published`, implementation status partial | Quality Management boundary/evidence producer | **KEEP** | Quality Center exists as component, but no canonical `CAPITAL-AI-QM` project tree exists on baseline | do not create second QM; track missing project-template reference as COMP-GAP-001 |
| ESS-0006 Security & Compliance | ESS registry `published` v1.0.0 | component specification for `src/platform/Security` and `src/platform/Compliance` | **CLARIFY** | current registry path is valid, but document body contains historical paths/open findings/events and a `ComplianceRequirementRegistry` concept that must not become a second normative registry without Governance decision | reuse component boundary and evidence principle; do not copy stale implementation claims or create new normative registry |
| ESS-0010 Documentary Engine | ESS registry published | physical report/evidence producer | **KEEP / CONSUMER** | ComplianceReporter output is documentary concern | COMP-09/10 consumes evidence |
| ESS-0011 Enterprise Traceability | ESS registry published/currently registered in Governance current-state | traceability relationships | **KEEP / CONSUMER** | partial runtime implementation does not block using document/evidence links | COMP traceability references, not replacement |
| ESS-0012 Documentation Governance | ESS registry published, explicitly `documentation-only` | document hygiene/evidence integrity | **KEEP** | must not become global compliance or merge authority | COMP-09 consumer |
| ESS-0019 Universal AI Agent Control Plane | current authority `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` | AI capability/risk/audit boundaries | **KEEP** | explicitly subordinate to AGENTS/current Control Plane | COMP-03/16 consumer |

## Conflicts / gaps

### ADR conflict count

- **1 lifecycle/semantic gap:** ADR-0007 is legacy ACCEPTED but absent from the canonical migrated ADR registry and contains over-broad legal/certification semantics by current standards.
- **0 new ADRs created.** This package records the gap rather than manufacturing a superseding decision.

### ESS conflict count

- **1 clarification gap:** ESS-0006 is current/published but contains stale implementation details and an older combined Security/Compliance framing. The current component separation in code and current Governance controls constrain how it may be interpreted.
- **0 ESS namespace changes.**

### Authority conflict count

- **0 unresolved P0 authority conflicts found in the current stable Governance registries.**
- Historical/legacy ambiguity is handled fail-closed through current registries and `CTRL-GOV-HIST-001`.

## Required future Governance actions, only if separately authorized

1. Decide whether ADR-0007 should be formally migrated, superseded, clarified or archived in the stable ADR registry; no decision is made here.
2. If ESS-0006 is materially updated later, preserve the component-specification boundary and remove stale paths/events/findings without creating a new Compliance authority plane.
