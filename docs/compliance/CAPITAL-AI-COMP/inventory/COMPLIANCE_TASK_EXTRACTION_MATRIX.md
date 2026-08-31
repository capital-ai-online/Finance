# Compliance Task Extraction Matrix

**Document ID:** `DOC-COMP-TASK-EXTRACTION-2026-08-31`  
**Role:** inventory / non-authorizing  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

Only tasks with traceable repository sources are included. Completed work is not reopened. The `COMP WP` column uses only the eight V2.1 workstreams. A handoff delegates remediation; it does not authorize Compliance to execute the target work.

| Source | Original task / finding | Classification | COMP WP | Primary Owner | VC | Evidence / requirement | Action / handoff |
|---|---|---|---|---|---|---|---|
| `DSGVO_REMEDIATION_2026-08-19.md` | controller identity / public privacy consistency | COMP-CONSUMER | COMP-04 / COMP-06 | Privacy / Legal | VC-01 | privacy/legal docs; accountability | REFERENCE — assess current evidence only |
| same | unsupported GDPR/certification claims removed | COMP-CONSUMER | COMP-04 / COMP-06 | all publishing domains | VC-01 | `CTRL-COMPLIANCE-CLAIM-001` + regression evidence | REFERENCE — keep claim gate |
| same | processing registry / transparency | COMP-SHARED | COMP-02 / COMP-03 / COMP-04 / COMP-06 | Privacy / Data | VC-09 | processing registry/code | REFERENCE; if regression is found → `[COMPLIANCE_HANDOFF -> PRIVACY-DATA | VC-09]` |
| same | data-subject request workflow | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 | Privacy / Development | VC-01 | API/database evidence | REFERENCE; technical regression → `[COMPLIANCE_HANDOFF -> PRIVACY-DEVELOPMENT | VC-01]` |
| same | retention-as-code | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | Privacy / Data | VC-09 | ADR-0092 + runtime/migration evidence | missing execution evidence/remediation → `[COMPLIANCE_HANDOFF -> PRIVACY-DATA | VC-09]` |
| same | vendor DPA / subprocessor / SCC / TIA evidence | COMP-OWNED | COMP-01 / COMP-02 / COMP-06 / COMP-07 | Human Owner / Legal / Privacy | VC-09 | `docs/compliance/vendor-evidence/**` | evidence completion assigned → `[COMPLIANCE_HANDOFF -> PRIVACY-LEGAL | VC-09]` |
| same | actual vendor role / production-use confirmation | COMP-SHARED | COMP-01 / COMP-06 / COMP-07 | Human Owner / Privacy | VC-09 | owner confirmations + provider/runtime evidence | `[COMPLIANCE_HANDOFF -> PRIVACY-OWNER | VC-09]` |
| same | leaked-password paid-tier exception | COMP-CONSUMER | COMP-04 / COMP-06 | Security | VC-01 | S1/Owner evidence | REFERENCE — accepted constraint, no stronger claim |
| `S1_SECURITY_HARDENING_ROADMAP.md` | entitlement authority bypass / premium capability inventory | COMP-SHARED | COMP-03 / COMP-04 / COMP-05 / COMP-06 / COMP-07 | S1 Security | VC-01 | `CTRL-SEC-LEASTPRIV-001`, S1-R2 evidence | open remainder → `[COMPLIANCE_HANDOFF -> S1 | VC-01]` |
| same | Node control-plane convergence | NOT-COMPLIANCE | — | Development / Security | VC-02 | build/config evidence | KEEP in target domain |
| same | fail-fast fatal process handling | COMP-SHARED | COMP-04 / COMP-05 / COMP-06 / COMP-07 | S1 / Operations | VC-08 | runtime resilience evidence | `[COMPLIANCE_HANDOFF -> S1 | VC-08]` |
| same | server-owned Stripe redirect boundary | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | S1 Security | VC-01 | security code/tests | `[COMPLIANCE_HANDOFF -> S1 | VC-01]` |
| same | backup + measured restore drill | COMP-SHARED | COMP-04 / COMP-05 / COMP-06 / COMP-07 | S1 / Operations | VC-08 | restore drill evidence | `[COMPLIANCE_HANDOFF -> S1 | VC-08]` |
| same | strict CSP promotion evidence | COMP-CONSUMER | COMP-04 / COMP-06 | S1 Security | VC-01 | ADR-0040 + runtime evidence | REFERENCE; no Compliance execution |
| `docs/architecture/ROADMAP.md` | exact main/open-PR correlation | COMP-CONSUMER | COMP-03 / COMP-04 / COMP-06 | Governance / Development | VC-02 | `CTRL-SDLC-SYNC-001` + GitHub evidence | REFERENCE — Governance executes gate |
| same | explicit Human/Owner PR-creation approval | COMP-CONSUMER | COMP-03 / COMP-04 / COMP-06 | Human Owner / Governance | VC-02 | `CTRL-SDLC-PR-CREATE-001` | REFERENCE — no duplicate approval gate |
| same | hosted final-head CI | COMP-CONSUMER | COMP-04 / COMP-06 | Development / GitHub | VC-02 | `CTRL-CI-HOSTED-001` | REFERENCE — target execution only |
| same | human merge | COMP-CONSUMER | COMP-04 / COMP-06 | Human/CODEOWNER | VC-02 | `CTRL-MERGE-HUMAN-001` | REFERENCE |
| same | verified production promotion | COMP-CONSUMER | COMP-03 / COMP-04 / COMP-06 | Release / Operations | VC-07 | `CTRL-DEPLOY-AUTH-001`, deployment identity | REFERENCE |
| `GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | external standards remain non-authorizing crosswalk | COMP-CONSUMER | COMP-02 / COMP-03 | Governance | VC-02 | `CTRL-AIMS-PDCA-001`, standards crosswalk | CONSOLIDATE mappings only |
| same | historical authority cannot reactivate | COMP-CONSUMER | COMP-03 / COMP-06 | Governance / Documentary | VC-03 | `CTRL-GOV-HIST-001`, registries/archive | REFERENCE |
| `CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md` | AI Act role/use-case applicability | COMP-OWNED | COMP-01 / COMP-02 / COMP-04 | Compliance + Legal when required | VC-17 | AI inventory/use-case evidence | CONSOLIDATE; legal ambiguity → `LEGAL_REVIEW` |
| same | DORA entity scope | COMP-OWNED | COMP-01 / COMP-02 / COMP-05 / COMP-07 | Human Owner / Legal | VC-08 | entity/business/regulatory-status evidence absent | `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-08]` — LEGAL_REVIEW |
| same | ISO/IEC 42001 target question | COMP-OWNED | COMP-02 / COMP-03 / COMP-04 | Governance / Human Owner | VC-02 | `CTRL-AIMS-PDCA-001`, standards crosswalk | benchmark only; no certification work without Owner decision |
| `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md` | reclassify on purpose/user/decision/provider change | COMP-OWNED | COMP-08 / COMP-01 | Compliance | VC-17 | AI inventory + change evidence | continuous reassessment trigger |
| `AI_LITERACY_CONTROL.md` | human AI-literacy evidence | COMP-SHARED | COMP-02 / COMP-04 / COMP-05 / COMP-06 / COMP-07 | Human Owner / Operations | VC-01 | human training/acknowledgement evidence | `[COMPLIANCE_HANDOFF -> OWNER-OPERATIONS | VC-01]` |
| `ISO27001_STATEMENT_OF_APPLICABILITY.md` | dated 93-control technical assessment | COMP-CONSUMER | COMP-02 / COMP-03 / COMP-04 / COMP-06 | Security | VC-02 | dated SoA + scanner evidence | REFERENCE — benchmark, not certification/current proof |
| `src/platform/Compliance/**` | repository scanner runs/reports | COMP-CONSUMER | COMP-06 / COMP-08 | Security/Compliance runtime owner | VC-10 | runtime scan evidence | REUSE — no duplicate scanner/runtime |
| `SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | scoring/ranking provenance and bounded authority | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | SC-MD-SPT-0001 | VC-13 / VC-14 / VC-16 / VC-17 | scoring evidence | technical gap → target SC-MD-SPT handoff for affected stage |
| `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | research-only/live-execution boundary | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | FinTech Core Crypto | VC-15 / VC-17 | ADR-0099 + fintech evidence | technical gap → `[COMPLIANCE_HANDOFF -> FINTECH-CORE-CRYPTO | VC-17]` |
| `SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | consent/provider/AI-output change impact | COMP-SHARED | COMP-01 / COMP-02 / COMP-04 / COMP-06 / COMP-08 | SEO-GM | VC-01 | consent/provider/output evidence | material gap → `[COMPLIANCE_HANDOFF -> SEO-GM | VC-01]` |
| Documentary roadmaps | retention, documentary provenance, evidence lifecycle | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | Documentary | VC-03 / VC-10 | ESS-0010/0012 + Documentary evidence | technical gap → `[COMPLIANCE_HANDOFF -> DOC | VC-03]` or `VC-10` |
| `VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | missing stage evidence/traceability | COMP-SHARED | COMP-04 / COMP-05 / COMP-06 / COMP-07 / COMP-08 | VC-COV / affected stage owner | VC-04..VC-18 as mapped | coverage/evidence packs | each confirmed gap handed to its mapped stage owner |
| Master Roadmap | AI transparency/provenance open status | COMP-SHARED | COMP-02 / COMP-03 / COMP-04 / COMP-06 / COMP-07 | AI-T / affected product domain | VC-17 | ESS-0019 + content-transparency evidence | implementation gap → `[COMPLIANCE_HANDOFF -> AI-T | VC-17]` |

## Classification totals

- `COMP-OWNED`: 6
- `COMP-SHARED`: 14
- `COMP-CONSUMER`: 11
- `NOT-COMPLIANCE`: 1

These totals describe the extracted rows, not every task in every roadmap. Remediation shown by a handoff remains target-project work.
