# Cross-Roadmap Compliance Matrix

**Document ID:** `DOC-COMP-CROSS-ROADMAP-MATRIX-2026-08-31`  
**Role:** projection / traceability / non-authorizing  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

Allowed actions: `KEEP`, `REFERENCE`, `MOVE-EXECUTION`, `CONSOLIDATE`, `SUPERSEDE`, `CLOSE`, `GAP`, `LEGAL-REVIEW`.

`MOVE-EXECUTION` means Compliance execution for assessment/evidence coordination only. It never moves foreign technical implementation into `CAPITAL-AI-COMP`.

| Source Roadmap | Original task / concern | Compliance Classification | COMP WP | Primary Owner | VC | Requirement | Control / authority | Evidence | Action / Handoff |
|---|---|---|---|---|---|---|---|---|---|
| `docs/architecture/ROADMAP.md` | branch/PR/main correlation | COMP-CONSUMER | COMP-03 / 04 / 06 | Governance / Development | VC-02 | REQ-COMP-003..007 | SDLC controls | GitHub/main/CI/PR evidence | REFERENCE |
| same | deployment authority | COMP-CONSUMER | COMP-03 / 04 / 06 | Release / Operations | VC-07 / VC-08 | REQ-COMP-008/036 | `CTRL-DEPLOY-AUTH-001` | exact-SHA deployment evidence | REFERENCE |
| `ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | portfolio compliance ownership | COMP-OWNED | COMP-01 / 02 / 08 | Compliance | cross-cutting | project boundary | existing Control Plane | this project | CONSOLIDATE — add `CAPITAL-AI-COMP` as Compliance assessment SPOE |
| `GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | standards crosswalk and historical authority rules | COMP-CONSUMER | COMP-02 / 03 / 06 | Governance / Documentary | VC-02 / VC-03 | REQ-COMP-012/025..028 | `CTRL-GOV-HIST-001`, `CTRL-AIMS-PDCA-001` | registries/crosswalk | REFERENCE |
| `S1_SECURITY_HARDENING_ROADMAP.md` | least privilege / entitlement authority evidence | COMP-SHARED | COMP-03 / 04 / 05 / 06 / 07 | S1 Security | VC-01 | REQ-COMP-009 | Security controls | S1 evidence | REFERENCE; confirmed remediation gap → `[COMPLIANCE_HANDOFF -> S1 | VC-01]` |
| same | backup/restore and resilience evidence | COMP-SHARED | COMP-04 / 05 / 06 / 07 | S1 / Operations | VC-08 | REQ-COMP-032 | Security/Operations authority | restore drill evidence | GAP while evidence missing; `[COMPLIANCE_HANDOFF -> S1 | VC-08]` |
| `DSGVO_REMEDIATION_2026-08-19.md` | privacy processing/rights/retention | COMP-SHARED | COMP-01 / 02 / 03 / 04 / 06 | Privacy / Data / Development | VC-01 / VC-09 | REQ-COMP-013..016 | privacy ADRs | privacy code/docs | REFERENCE; foreign remediation remains Privacy/Data/Development work |
| same | vendor/transfer evidence completion | COMP-OWNED for assessment/evidence; implementation shared | COMP-01 / 02 / 04 / 05 / 06 / 07 | Privacy / Human Owner / Legal | VC-09 | REQ-COMP-017 | ADR-0086/0095 | vendor evidence | MOVE-EXECUTION for Compliance assessment; `[COMPLIANCE_HANDOFF -> PRIVACY-LEGAL | VC-09]` for missing owner/legal evidence |
| `SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | scoring provenance / decision-support boundaries | COMP-SHARED | COMP-03 / 04 / 06 / 07 | SC-MD-SPT-0001 | VC-13 / 14 / 16 / 17 | REQ-COMP-020/034 | scoring authority | scoring evidence | REFERENCE; technical remediation handed to SC-MD-SPT affected stage |
| `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | research-only vs live-execution boundary | COMP-SHARED | COMP-03 / 04 / 06 / 07 | FinTech Core Crypto | VC-15 / VC-17 | REQ-COMP-020/036 | ADR-0099/domain authority | fintech evidence | REFERENCE; `[COMPLIANCE_HANDOFF -> FINTECH-CORE-CRYPTO | VC-17]` when gap confirmed |
| `VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | evidence/traceability gaps across stages | COMP-SHARED | COMP-04 / 05 / 06 / 07 / 08 | VC-COV + mapped Primary Owner | VC-04..VC-18 | REQ-COMP-029/034 | domain authorities | coverage/evidence packs | REFERENCE; each remediation delegates to mapped stage owner |
| `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | record/evidence/event provenance | COMP-SHARED | COMP-03 / 04 / 06 / 07 | Documentary / EventMesh | VC-03 / VC-10 / VC-18 | REQ-COMP-033/035 | ESS-0010/0013 | Documentary/EventMesh evidence | REFERENCE; `[COMPLIANCE_HANDOFF -> DOC | VC-03]` or mapped VC when implementation gap confirmed |
| `SYSTEMADMIN_AGENT_ROADMAP.md` | protected external mutation evidence | COMP-CONSUMER | COMP-03 / 04 / 06 | Systemadmin / Governance / Operations | VC-08 | REQ-COMP-008/032/036 | current Systemadmin/Governance gates | provider/runtime evidence | REFERENCE — Compliance never performs protected mutation |
| `AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | IAM/security status assertions | COMP-CONSUMER | COMP-04 / 05 / 06 / 07 | Security / IAM owner | VC-01 | REQ-COMP-009/033 | IAM/Security authorities | current evidence required | GAP if stale/unverified; remediation handoff to Security/IAM owner |
| `SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | consent/provider/AI-output change impact | COMP-SHARED | COMP-01 / 02 / 03 / 04 / 06 / 08 | SEO-GM | VC-01 | REQ-COMP-013/019/030 | domain ADR/ESS | consent/provider/output evidence | REFERENCE; `[COMPLIANCE_HANDOFF -> SEO-GM | VC-01]` when technical gap confirmed |
| `MARKETING_AGENT_ROADMAP.md` | historical marketing tasks | COMP-CONSUMER | COMP-03 / 06 | SEO-GM is current owner | VC-01 | historical only | superseded by SEO-GM | history | SUPERSEDE — no parallel progress |
| `SEO_MANAGEMENT_ROADMAP.md` | historical SEO tasks | COMP-CONSUMER | COMP-03 / 06 | SEO-GM is current owner | VC-01 | historical only | superseded by SEO-GM | history | SUPERSEDE — no parallel progress |
| `FRONTEND_ROADMAP.md` | user-facing transparency/privacy changes | COMP-SHARED | COMP-01 / 02 / 03 / 04 / 06 / 08 | Frontend/Product | VC-01 | REQ-COMP-019/030 | frontend authority + existing contracts | UI/runtime evidence | REFERENCE; technical remediation remains Frontend/Product work |
| `VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md` | terminology/migration history | COMP-CONSUMER | COMP-03 / 06 | Vocabulary / Governance | VC-03 | REQ-COMP-035 | ESS-0017 | merged/current vocabulary evidence | CLOSE / historical reference |
| `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | historical AI-agent implementation | COMP-CONSUMER | COMP-03 / 06 | current ESS-0019 / Governance | VC-02 | historical controls | current ESS-0019/Control Plane | historical evidence | CLOSE / historical reference |
| `PDF_BRANDING_FINALIZATION_P1_P2_2026-08-19.md` | report presentation/accessibility | NOT-COMPLIANCE unless claim/evidence semantics change | — | PDF/Documentary owner | VC-03 | none by default | ADR-0091/0093 | PDF evidence | KEEP |

## Cross-project ownership rule

For every affected domain:

- **Primary Owner:** implements technical/organizational remediation and returns evidence.
- **Compliance:** maps requirement/control, evaluates evidence, records the finding, issues the `COMP-07` handoff and independently verifies returned evidence.
- **Legal/Human Owner:** resolves legal applicability or accepted-risk decisions where required.

No domain roadmap loses implementation ownership, and completed domain tasks are not reopened merely because Compliance ownership is consolidated.

## Handoff reference rule

Every handoff in `mappings/COMPLIANCE_HANDOFF_REGISTER.md` carries the exact target roadmap/reference. This central register satisfies the V2.1 roadmap-reference contract without modifying foreign technical roadmaps inside the Compliance PR solely to duplicate status text.
