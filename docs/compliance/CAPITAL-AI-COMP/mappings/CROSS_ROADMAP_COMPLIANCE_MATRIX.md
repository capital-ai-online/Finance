# Cross-Roadmap Compliance Matrix

**Document ID:** `DOC-COMP-CROSS-ROADMAP-MATRIX-2026-08-31`  
**Role:** projection / traceability / non-authorizing  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

Allowed actions: `KEEP`, `REFERENCE`, `MOVE-EXECUTION`, `CONSOLIDATE`, `SUPERSEDE`, `CLOSE`, `GAP`, `LEGAL-REVIEW`.

| Source Roadmap | Original task / concern | Compliance Classification | COMP WP | Requirement | Control / authority | Evidence | Action |
|---|---|---|---|---|---|---|---|
| `docs/architecture/ROADMAP.md` | branch/PR/main correlation | COMP-CONSUMER | COMP-06 | REQ-COMP-003..007 | SDLC controls | GitHub/main/CI/PR evidence | REFERENCE |
| same | deployment authority | COMP-CONSUMER | COMP-08 | REQ-COMP-008/036 | `CTRL-DEPLOY-AUTH-001` | exact-SHA deployment evidence | REFERENCE |
| `ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | portfolio compliance ownership | COMP-OWNED | COMP-01/14 | project governance | existing Control Plane | this project | CONSOLIDATE |
| `GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | standards crosswalk and historical authority rules | COMP-CONSUMER | COMP-09/11 | REQ-COMP-012/025..028 | `CTRL-GOV-HIST-001`, `CTRL-AIMS-PDCA-001` | registries/crosswalk | REFERENCE |
| `S1_SECURITY_HARDENING_ROADMAP.md` | least privilege / entitlement authority evidence | COMP-SHARED | COMP-05 | REQ-COMP-009 | Security controls | S1 evidence | REFERENCE |
| same | backup/restore and resilience evidence | COMP-SHARED | COMP-07 | REQ-COMP-032 | Security/Operations authority | restore drill evidence | REFERENCE |
| `DSGVO_REMEDIATION_2026-08-19.md` | privacy processing/rights/retention | COMP-SHARED | COMP-04 | REQ-COMP-013..016 | privacy ADRs | privacy code/docs | REFERENCE |
| same | vendor/transfer evidence completion | COMP-OWNED | COMP-04/13 | REQ-COMP-017 | ADR-0086/0095 | vendor evidence | MOVE-EXECUTION |
| `SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | scoring provenance / decision-support boundaries | COMP-SHARED | COMP-03/10 | REQ-COMP-020/034 | scoring authority | scoring evidence | REFERENCE |
| `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | research-only vs live execution boundary | COMP-SHARED | COMP-03/08 | REQ-COMP-020/036 | ADR-0099/domain authority | fintech evidence | REFERENCE |
| `VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | evidence/traceability gaps across stages | COMP-SHARED | COMP-10/16 | REQ-COMP-029/034 | domain authorities | coverage/evidence packs | REFERENCE |
| `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | record/evidence/event provenance | COMP-SHARED | COMP-09/10 | REQ-COMP-033/035 | ESS-0010/0013 | Documentary/EventMesh evidence | REFERENCE |
| `SYSTEMADMIN_AGENT_ROADMAP.md` | protected external mutation evidence | COMP-CONSUMER | COMP-07/08 | REQ-COMP-008/032/036 | current Systemadmin/Governance gates | provider/runtime evidence | REFERENCE |
| `AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | IAM/security status assertions | COMP-CONSUMER | COMP-05/10 | REQ-COMP-009/033 | current IAM/Security authorities | current evidence required | GAP |
| `SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | consent/provider/AI-output change impact | COMP-SHARED | COMP-03/04/16 | REQ-COMP-013/019/030 | domain ADR/ESS | consent/provider/output evidence | REFERENCE |
| `MARKETING_AGENT_ROADMAP.md` | historical marketing tasks | COMP-CONSUMER | COMP-16 | historical only | superseded by SEO-GM | history | SUPERSEDE |
| `SEO_MANAGEMENT_ROADMAP.md` | historical SEO tasks | COMP-CONSUMER | COMP-16 | historical only | superseded by SEO-GM | history | SUPERSEDE |
| `FRONTEND_ROADMAP.md` | user-facing transparency/privacy changes | COMP-SHARED | COMP-03/04/16 | REQ-COMP-019/030 | frontend authority + existing contracts | UI/runtime evidence | REFERENCE |
| `VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md` | terminology/migration history | COMP-CONSUMER | COMP-09 | REQ-COMP-035 | ESS-0017 | merged/current vocabulary evidence | CLOSE |
| `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | historical AI-agent implementation | COMP-CONSUMER | COMP-03/06 | historical controls | current ESS-0019/Control Plane | historical evidence | CLOSE |
| `PDF_BRANDING_FINALIZATION_P1_P2_2026-08-19.md` | report presentation/accessibility | NOT-COMPLIANCE | — | none unless compliance claim/evidence is changed | ADR-0091/0093 | PDF evidence | KEEP |

## Ownership rule for Fachroadmaps

When a Fachroadmap references this matrix, the intended wording is:

> **Local Domain Responsibility:** implement the technical/organizational control and provide evidence.  
> **Compliance Responsibility:** `CAPITAL-AI-COMP` maps the requirement, assesses evidence and manages any compliance finding.

No domain roadmap loses its implementation ownership, and completed domain tasks are not reopened.
