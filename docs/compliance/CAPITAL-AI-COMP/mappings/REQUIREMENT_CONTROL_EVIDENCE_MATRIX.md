# Requirement → Control → Evidence Matrix

**Document ID:** `DOC-COMP-REQ-CTRL-EVIDENCE-2026-08-31`  
**Role:** projection / assessment mapping / non-authorizing  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

`COMPLIANT` is intentionally avoided where final/current evidence has not been independently verified. A documented control without current execution evidence is not enough.

| Req | Existing AUTH / CTRL / ADR / ESS | Implementation owner | Primary evidence | Assessment | Evidence gap / note |
|---|---|---|---|---|---|
| REQ-COMP-001 | `AUTH-GOV-AGENT-TRUST-ROOT`, `CTRL-GOV-TRUST-001` | Governance | AGENTS + authority/control registries | PARTIALLY_COMPLIANT | final snapshot revalidation pending |
| REQ-COMP-002 | `CTRL-COMPLIANCE-CLAIM-001` | all domains | current claim rule + privacy regression evidence | PARTIALLY_COMPLIANT | legacy claim scan remains useful |
| REQ-COMP-003 | `CTRL-SDLC-BRANCH-001` | Development | branch `feat/capital-ai-comp-consolidation` from baseline | PARTIALLY_COMPLIANT | branch exists; final diff validation pending |
| REQ-COMP-004 | `CTRL-SDLC-SYNC-001` | Development/Governance | main/open-PR final correlation | NOT_ASSESSED | must execute at final gate |
| REQ-COMP-005 | `CTRL-SDLC-PR-CREATE-001` | Human Owner/Governance | exact-snapshot approval record | EVIDENCE_MISSING | intentionally not requested yet |
| REQ-COMP-006 | `CTRL-CI-HOSTED-001` | GitHub/Development | hosted final-head CI | EVIDENCE_MISSING | post-PR evidence only |
| REQ-COMP-007 | `CTRL-MERGE-HUMAN-001` | Human/CODEOWNER | merge record | NOT_ASSESSED | merge out of scope |
| REQ-COMP-008 | `CTRL-DEPLOY-AUTH-001` | Release/Operations | CI/deploy exact-SHA evidence | NOT_ASSESSED | no deployment in this package |
| REQ-COMP-009 | `CTRL-SEC-LEASTPRIV-001`, S1 authorities | Security | S1-R2 evidence, code/tests | PARTIALLY_COMPLIANT | open Security findings remain domain-owned |
| REQ-COMP-010 | `CTRL-SEC-SECRET-001` | Security/Development | repository/code scanning and secret-handling controls | PARTIALLY_COMPLIANT | continuous control, no new secret evidence here |
| REQ-COMP-011 | `AUTH-GOV-DOCUMENT-LIFECYCLE`, `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001` | Documentary/Governance | canonical paths + document registry | PARTIALLY_COMPLIANT | final registry/hygiene check pending |
| REQ-COMP-012 | `AUTH-GOV-SUPERSESSION-POLICY`, `CTRL-GOV-HIST-001` | Governance | ADR/ESS registries + archive | PARTIALLY_COMPLIANT | ADR-0007 legacy and ESS-0006 stale content tracked |
| REQ-COMP-013 | privacy ADRs / data controls | Privacy/Data | processing registry, code/config, retention/privacy evidence | PARTIALLY_COMPLIANT | current production/legal basis revalidation |
| REQ-COMP-014 | ADR-0095 / Documentary controls | Privacy/Documentary | privacy notice/processing records | PARTIALLY_COMPLIANT | current completeness assessment pending |
| REQ-COMP-015 | privacy authorities | Privacy/Development | privacy request/export API + DB evidence | PARTIALLY_COMPLIANT | runtime freshness not established in this branch |
| REQ-COMP-016 | `AUTH-ADR-PRIVACY-RETENTION-2026-08-19` | Privacy/Data | retention migrations/functions + privacy docs | PARTIALLY_COMPLIANT | operational execution evidence needs refresh |
| REQ-COMP-017 | ADR-0086 + ADR-0095 | Privacy/Owner/Legal | `docs/compliance/vendor-evidence/**` | EVIDENCE_MISSING | incomplete vendor role/DPA/SCC/TIA/region evidence |
| REQ-COMP-018 | ESS-0019 + AI inventory | AI/Product | `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md` | NOT_ASSESSED | legal role/use-case classification incomplete |
| REQ-COMP-019 | ESS-0019 + content-transparency contract | AI/Frontend/Documentary | output contracts, UI/runtime/audit evidence | PARTIALLY_COMPLIANT | all affected output paths not verified here |
| REQ-COMP-020 | AGENTS + scoring/domain authorities | AI/Scoring/Product | human gates, scoring/execution boundaries | NOT_ASSESSED | legal obligation depends on use case |
| REQ-COMP-021 | `AI_LITERACY_CONTROL.md` | Human Owner/Operations | human training/acknowledgement records | EVIDENCE_MISSING | specification is not human evidence |
| REQ-COMP-022 | external DORA requirement only | Legal/Human Owner | entity/business/regulatory-status evidence | NOT_ASSESSED | LEGAL_REVIEW; no new internal authority |
| REQ-COMP-023 | existing legal remediation docs | Legal/Product | user/market/contract evidence | NOT_ASSESSED | LEGAL_REVIEW |
| REQ-COMP-024 | ISO27001 SoA + Security controls | Security/Compliance | dated SoA + scanners | NOT_APPLICABLE | benchmark only; SoA is not certification/current proof |
| REQ-COMP-025 | `CTRL-AIMS-PDCA-001` | Governance/Compliance | `STANDARDS_CROSSWALK.md` | NOT_APPLICABLE | benchmark only |
| REQ-COMP-026 | SDLC controls + `CTRL-AIMS-PDCA-001` | Development/Security | branch/review/CI/dependency evidence | NOT_APPLICABLE | SSDF control source only |
| REQ-COMP-027 | `CTRL-AIMS-PDCA-001` | AI/Compliance | AI inventory/risk mappings | NOT_APPLICABLE | AI RMF benchmark only |
| REQ-COMP-028 | Security/SDLC controls | Security/Development | hardening/scanner/test evidence | NOT_APPLICABLE | OWASP/CIS benchmark only |
| REQ-COMP-029 | ESS-0006 principle + `CTRL-COMPLIANCE-CLAIM-001` | Compliance | runtime/code/CI/registry/doc evidence chain | PARTIALLY_COMPLIANT | evidence completeness varies by requirement |
| REQ-COMP-030 | AI inventory change triggers + COMP roadmap | Compliance + domain owners | feature/model/provider/data change records | NOT_ASSESSED | no central automated impact trigger yet |
| REQ-COMP-031 | contract/vendor artifacts | Legal/Owner | contract evidence inventory | NOT_ASSESSED | complete contract universe unknown |
| REQ-COMP-032 | S1/Operations authorities | Operations/Security | backup/restore/incident evidence | EVIDENCE_MISSING | S1 R2-07 explicitly open/unverified |
| REQ-COMP-033 | ESS-0006 + Traceability/Telemetry/domain controls | Security/Traceability/Compliance | audit logs, compliance runs, system evidence | PARTIALLY_COMPLIANT | end-to-end event coverage assessment needed |
| REQ-COMP-034 | data/scoring authorities | Data/Scoring | provider provenance, quality and scoring evidence | NOT_ASSESSED | 18-stage coverage assessment not complete |
| REQ-COMP-035 | `CTRL-GOV-DOC-001`, Documentary authorities | Documentary/all domains | document registry, archive, evidence directories | PARTIALLY_COMPLIANT | legacy/stale record reconciliation ongoing |
| REQ-COMP-036 | `CTRL-DEPLOY-AUTH-001` + DevelopmentChain | Release/Operations | release/rollback/runbook/deploy identity evidence | NOT_ASSESSED | future-release exact evidence required |

## Evidence interpretation

- `PARTIALLY_COMPLIANT` means relevant implementation/control evidence exists but the complete scoped requirement has not been fully verified on the current assessment baseline.
- `EVIDENCE_MISSING` means a material required evidence class is absent or not established in this snapshot.
- `NOT_ASSESSED` is deliberately used where applicability or current-state verification is incomplete.
- `NOT_APPLICABLE` for standards means *not a binding CAPITAL-AI requirement source*; the standard may still be used as a benchmark/control source.
