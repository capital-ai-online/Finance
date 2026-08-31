# Compliance Task Extraction Matrix

**Document ID:** `DOC-COMP-TASK-EXTRACTION-2026-08-31`  
**Role:** inventory / non-authorizing  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

Only tasks with traceable repository sources are included. Completed work is not reopened; `REFERENCE` means the domain continues to own implementation/evidence while `CAPITAL-AI-COMP` owns assessment/traceability.

| Source | Original task / finding | Classification | COMP WP | Requirement / concern | Existing control / authority | Evidence source | Action | Consolidated state |
|---|---|---|---|---|---|---|---|---|
| `DSGVO_REMEDIATION_2026-08-19.md` | controller identity / public privacy consistency | COMP-CONSUMER | COMP-04 | privacy accountability | privacy ADRs / current docs | privacy/legal docs | REFERENCE | implemented in roadmap; revalidate evidence only |
| same | remove unsupported GDPR/certification claims | COMP-CONSUMER | COMP-04 | truthful compliance claims | `CTRL-COMPLIANCE-CLAIM-001` | regression/document evidence | REFERENCE | completed; keep claim gate |
| same | processing registry Art. 13 transparency | COMP-SHARED | COMP-04 | processing transparency | privacy authorities | processing registry/code | REFERENCE | implementation domain-owned; assess evidence |
| same | data subject request workflow | COMP-SHARED | COMP-04 | rights workflow | privacy authorities | API/database tests | REFERENCE | implementation completed in roadmap; verify current state when assessed |
| same | retention-as-code | COMP-SHARED | COMP-04 | retention/lifecycle | ADR-0092 | migrations/runtime evidence | REFERENCE | technical implementation domain-owned |
| same | vendor DPA / subprocessor / SCC / TIA evidence | COMP-OWNED | COMP-04 | vendor/transfer evidence completeness | ADR-0086 / ADR-0095 | `docs/compliance/vendor-evidence/**` | MOVE-EXECUTION | open evidence/assessment centralized here |
| same | actual vendor role/production-use confirmation | COMP-SHARED | COMP-04 | provider applicability | ADR-0086 | owner confirmations + runtime/provider evidence | MOVE-EXECUTION | requires domain/Owner evidence |
| same | leaked-password paid-tier exception | COMP-CONSUMER | COMP-05 | compensating security evidence | Security/Owner decision | S1 evidence | REFERENCE | accepted technical constraint; no stronger claim |
| `S1_SECURITY_HARDENING_ROADMAP.md` | entitlement authority bypass / paid capability | COMP-SHARED | COMP-05 | least privilege / authorization evidence | `CTRL-SEC-LEASTPRIV-001` | S1-R2-00 evidence + code/tests | REFERENCE | Security implements; Compliance assesses |
| same | Node control-plane convergence | NOT-COMPLIANCE | — | platform maintenance | Development/Security | build/config evidence | KEEP | remains Security/Development |
| same | fail-fast fatal process handling | COMP-SHARED | COMP-07 | operational resilience evidence | domain authority | code/runtime evidence | REFERENCE | Operations/Security implementation |
| same | server-owned Stripe redirect boundary | COMP-SHARED | COMP-05 | trusted redirect/auth boundary | Security controls | code/tests | REFERENCE | Security owns implementation |
| same | backup + measured restore drill | COMP-SHARED | COMP-07 | continuity/restore evidence | Operations/Security | restore drill evidence | REFERENCE | Compliance verifies evidence; does not run production mutation |
| same | strict CSP promotion evidence | COMP-CONSUMER | COMP-05 | security hardening evidence | ADR-0040 | CSP runtime evidence | REFERENCE | Security assessment input |
| `docs/architecture/ROADMAP.md` | exact main/open-PR correlation before PR | COMP-CONSUMER | COMP-06 | change-management traceability | `CTRL-SDLC-SYNC-001` | GitHub/main/PR evidence | REFERENCE | Governance owns gate; Compliance consumes evidence |
| same | explicit Human/Owner PR creation approval | COMP-CONSUMER | COMP-06 | approval / separation of duties | `CTRL-SDLC-PR-CREATE-001` | PR/gate record | REFERENCE | no duplicate gate |
| same | hosted final-head CI | COMP-CONSUMER | COMP-06 | independent validation | `CTRL-CI-HOSTED-001` | GitHub CI | REFERENCE | Development/Governance owns execution |
| same | human merge | COMP-CONSUMER | COMP-06 | separation of duties | `CTRL-MERGE-HUMAN-001` | PR merge evidence | REFERENCE | Governance owns authority |
| same | verified production promotion | COMP-CONSUMER | COMP-08 | production authorization/evidence | `CTRL-DEPLOY-AUTH-001` | CI/deployment identity | REFERENCE | Release/Operations implementation |
| `GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | external standards remain non-authorizing crosswalk | COMP-CONSUMER | COMP-11 | standards governance | `CTRL-AIMS-PDCA-001` | standards crosswalk | CONSOLIDATE | Compliance reuses crosswalk; no second policy hierarchy |
| same | historical authority cannot reactivate | COMP-CONSUMER | COMP-09 | document lifecycle/supersession | `CTRL-GOV-HIST-001` | registries/archive | REFERENCE | Governance owns rule |
| `CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md` | AI Act role/use-case applicability | COMP-OWNED | COMP-01/03 | AI applicability | current matrix + AI inventory | AI inventory/use-case evidence | CONSOLIDATE | central compliance assessment |
| same | DORA entity scope | COMP-OWNED | COMP-01/02 | DORA applicability | external requirement only | legal/entity evidence absent | LEGAL-REVIEW | fail closed pending legal/entity decision |
| same | ISO 42001 target | COMP-OWNED | COMP-11 | benchmark vs certification target | `CTRL-AIMS-PDCA-001` | standards crosswalk/Owner decision | GAP | benchmark only until Owner target exists |
| `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md` | reclassify on purpose/user/decision/provider change | COMP-OWNED | COMP-16 | compliance change impact | AI inventory | feature/model/provider changes | CONSOLIDATE | central change-impact trigger |
| `AI_LITERACY_CONTROL.md` | human AI-literacy evidence | COMP-SHARED | COMP-03/10 | AI literacy evidence | existing compliance specification | human training/ack evidence | GAP | human evidence cannot be fabricated |
| `ISO27001_STATEMENT_OF_APPLICABILITY.md` | 93-control dated technical assessment | COMP-CONSUMER | COMP-11/12 | ISO benchmark | existing SoA | dated code/config snapshot | REFERENCE | do not treat as certification/current proof |
| `src/platform/Compliance/**` | repository scanner runs and reports | COMP-CONSUMER | COMP-10/15 | continuous technical evidence | ESS-0006 / ADR-0012 | runtime scan results | REFERENCE | reuse native runtime; no duplicate scanner |
| `SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | scoring/ranking provenance and bounded authority | COMP-SHARED | COMP-03/10 | AI/decision-support traceability | SC-MD-SPT-0001 + ADRs | scoring evidence | REFERENCE | Scoring owns implementation |
| `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | research-only/live-execution boundary | COMP-SHARED | COMP-03/08 | automated-decision/execution boundary | ADR-0099 + scoring authorities | fintech evidence | REFERENCE | domain owns technical boundary |
| `SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | consent/provider/content transparency dependencies | COMP-SHARED | COMP-03/04/16 | privacy/AI/provider scope | SEO/Marketing authorities | consent/provider/output evidence | REFERENCE | domain implementation; compliance impact on changes |
| Documentary roadmaps | retention, documentary provenance, evidence lifecycle | COMP-SHARED | COMP-09/10 | record keeping/evidence integrity | ESS-0010/0012 + ADR-0097 | Documentary evidence | REFERENCE | Documentary owns engine, Compliance assesses records |
| `VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | missing stage evidence/traceability | COMP-SHARED | COMP-10/16 | end-to-end evidence coverage | current domain authorities | coverage maps/evidence packs | REFERENCE | Compliance consumes and flags gaps |
| Master Roadmap | AI transparency/provenance open contract/status | COMP-SHARED | COMP-03 | output transparency/provenance | ESS-0019 + existing content-transparency contract | output/audit evidence | CONSOLIDATE | compliance assessment centralized; no new ESS created here |

## Classification totals

- `COMP-OWNED`: 6
- `COMP-SHARED`: 14
- `COMP-CONSUMER`: 11
- `NOT-COMPLIANCE`: 1

These totals cover extracted tasks in this matrix, not every task in every domain roadmap.
