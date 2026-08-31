# Compliance Task Extraction Matrix

**Document ID:** `DOC-COMP-TASK-EXTRACTION-2026-08-31`  
**Role:** inventory / non-authorizing  
**Version:** 1.2.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@5d3360c21ee51771495aab734ba81c2bdfd3d08b`

Only tasks with traceable repository sources are included. Completed work is not reopened. The `COMP WP` column uses only the eight V2.1 workstreams. A handoff delegates remediation; it does not authorize Compliance to execute the target work.

`CAPITAL-AI-CLIENT` is the single Primary Owner for `VC-01`. Security, Privacy, IAM, SEO/Marketing, Frontend and AI sources remain control/evidence or non-VC-01 implementation owners; they do not form parallel VC-01 ownership.

| Source | Original task / finding | Classification | COMP WP | Primary Owner | VC | Evidence / requirement | Action / handoff |
|---|---|---|---|---|---|---|---|
| `docs/projects/agent-client/ROADMAP.md` | Agent Client request/identity/capability/response/security contract | COMP-SHARED / target owner | COMP-01 / 02 / 03 / 04 / 05 / 06 / 07 / 08 as applicable | **CAPITAL-AI-CLIENT** | **VC-01** | Agent Client inventory/runtime mapping/traceability + downstream source evidence | REFERENCE as VC-01 Primary Owner; confirmed VC-01 technical remediation → `[COMPLIANCE_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]` |
| `DSGVO_REMEDIATION_2026-08-19.md` | controller identity / public privacy consistency | COMP-CONSUMER | COMP-04 / COMP-06 | CAPITAL-AI-CLIENT for VC-01 presentation; Privacy/Legal for legal/source evidence | VC-01 | privacy/legal docs; accountability | REFERENCE — assess current evidence; confirmed client-surface remediation → CAPITAL-AI-CLIENT |
| same | unsupported GDPR/certification claims removed | COMP-CONSUMER | COMP-04 / COMP-06 | CAPITAL-AI-CLIENT for VC-01 output; publishing/source domains retain non-VC-01 evidence ownership | VC-01 | `CTRL-COMPLIANCE-CLAIM-001` + regression evidence | REFERENCE — keep claim gate; future VC-01 technical gap → CAPITAL-AI-CLIENT |
| same | processing registry / transparency | COMP-SHARED | COMP-02 / COMP-03 / COMP-04 / COMP-06 | Privacy / Data | VC-09 | processing registry/code | REFERENCE; if regression is found → `[COMPLIANCE_HANDOFF -> PRIVACY-DATA | VC-09]` |
| same | data-subject request workflow | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 | CAPITAL-AI-CLIENT for client UX/handoff; Privacy/Development for authoritative backend | VC-01 / VC-02 as affected | API/database evidence + Agent Client contract | VC-01 client regression → CAPITAL-AI-CLIENT; backend privacy implementation gap → target Privacy/Development owner |
| same | retention-as-code | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | Privacy / Data | VC-09 | ADR-0092 + runtime/migration evidence | missing execution evidence/remediation → `[COMPLIANCE_HANDOFF -> PRIVACY-DATA | VC-09]` |
| same | vendor DPA / subprocessor / SCC / TIA evidence | COMP-OWNED | COMP-01 / COMP-02 / COMP-06 / COMP-07 | Human Owner / Legal / Privacy | VC-09 | `docs/compliance/vendor-evidence/**` | evidence completion assigned → `[COMPLIANCE_HANDOFF -> PRIVACY-LEGAL | VC-09]` |
| same | actual vendor role / production-use confirmation | COMP-SHARED | COMP-01 / COMP-06 / COMP-07 | Human Owner / Privacy | VC-09 | owner confirmations + provider/runtime evidence | target source-domain evidence handoff; no VC-01 ownership implication |
| same | leaked-password paid-tier exception | COMP-CONSUMER | COMP-04 / COMP-06 | CAPITAL-AI-CLIENT for VC-01 behavior; Security is control/evidence owner | VC-01 | S1/Owner evidence | REFERENCE — accepted constraint, no stronger claim; no parallel Security VC-01 ownership |
| `S1_SECURITY_HARDENING_ROADMAP.md` | entitlement authority bypass / premium capability inventory | COMP-SHARED | COMP-03 / COMP-04 / COMP-05 / COMP-06 / COMP-07 | **CAPITAL-AI-CLIENT for VC-01; S1 Security for source controls/evidence and downstream Security remediation** | VC-01 plus affected downstream stage | `CTRL-SEC-LEASTPRIV-001`, S1-R2 evidence, Agent Client contract | confirmed VC-01 remainder → `[COMPLIANCE_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]`; non-VC-01 Security work remains S1-owned |
| same | Node control-plane convergence | NOT-COMPLIANCE | — | Development / Security | VC-02 | build/config evidence | KEEP in target domain |
| same | fail-fast fatal process handling | COMP-SHARED | COMP-04 / COMP-05 / COMP-06 / COMP-07 | S1 / Operations | VC-08 | runtime resilience evidence | `[COMPLIANCE_HANDOFF -> S1 | VC-08]` |
| same | server-owned Stripe redirect boundary | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | CAPITAL-AI-CLIENT for client handoff; S1/Controlled Implementation for authoritative server boundary | VC-01 / VC-02 as affected | security code/tests + client handoff evidence | VC-01 client contract gap → CAPITAL-AI-CLIENT; server-boundary gap → S1/Controlled Implementation owner |
| same | backup + measured restore drill | COMP-SHARED | COMP-04 / COMP-05 / COMP-06 / COMP-07 | S1 / Operations | VC-08 | restore drill evidence | `[COMPLIANCE_HANDOFF -> S1 | VC-08]` |
| same | strict CSP promotion evidence | COMP-CONSUMER | COMP-04 / COMP-06 | CAPITAL-AI-CLIENT for VC-01 presentation; S1/Frontend evidence sources | VC-01 | ADR-0040 + runtime evidence | REFERENCE; confirmed VC-01 implementation gap → CAPITAL-AI-CLIENT |
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
| `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md` | reclassify on purpose/user/decision/provider change | COMP-OWNED | COMP-08 / COMP-01 | Compliance | relevant VC | AI inventory + change evidence | continuous reassessment trigger; VC-01 technical result routes to CAPITAL-AI-CLIENT |
| `AI_LITERACY_CONTROL.md` | human AI-literacy evidence | COMP-SHARED | COMP-02 / COMP-04 / COMP-05 / COMP-06 / COMP-07 | Human Owner / Operations for organizational evidence; CAPITAL-AI-CLIENT remains VC-01 technical owner | VC-01 | human training/acknowledgement evidence | `[COMPLIANCE_HANDOFF -> OWNER-OPERATIONS | VC-01]` is non-technical organizational evidence only |
| `ISO27001_STATEMENT_OF_APPLICABILITY.md` | dated 93-control technical assessment | COMP-CONSUMER | COMP-02 / COMP-03 / COMP-04 / COMP-06 | Security | VC-02 | dated SoA + scanner evidence | REFERENCE — benchmark, not certification/current proof |
| `src/platform/Compliance/**` | repository scanner runs/reports | COMP-CONSUMER | COMP-06 / COMP-08 | Security/Compliance runtime owner | VC-10 | runtime scan evidence | REUSE — no duplicate scanner/runtime |
| `SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | scoring/ranking provenance and bounded authority | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | SC-MD-SPT-0001 | VC-13 / VC-14 / VC-16 / VC-17 | scoring evidence | technical gap → target SC-MD-SPT handoff for affected stage |
| `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | research-only/live-execution boundary | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | FinTech Core Crypto | VC-15 / VC-17 | ADR-0099 + fintech evidence | technical gap → `[COMPLIANCE_HANDOFF -> FINTECH-CORE-CRYPTO | VC-17]` |
| `SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | consent/provider/AI-output change impact | COMP-SHARED | COMP-01 / COMP-02 / COMP-04 / COMP-06 / COMP-08 | **CAPITAL-AI-CLIENT for VC-01; SEO-GM for source-domain content/provider/consent** | VC-01 plus source-domain scope | consent/provider/output evidence | confirmed VC-01 technical gap → `[COMPLIANCE_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]`; SEO-GM remains source-domain owner outside VC-01 |
| Documentary roadmaps | retention, documentary provenance, evidence lifecycle | COMP-SHARED | COMP-03 / COMP-04 / COMP-06 / COMP-07 | Documentary | VC-03 / VC-10 | ESS-0010/0012 + Documentary evidence | technical gap → `[COMPLIANCE_HANDOFF -> DOC | VC-03]` or `VC-10` |
| `VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | missing stage evidence/traceability | COMP-SHARED | COMP-04 / COMP-05 / COMP-06 / COMP-07 / COMP-08 | VC-COV / affected stage owner; VC-01 resolved to CAPITAL-AI-CLIENT | mapped VC | coverage/evidence packs | each confirmed gap handed to its current mapped stage owner |
| Master Roadmap | AI transparency/provenance open status | COMP-SHARED | COMP-02 / COMP-03 / COMP-04 / COMP-06 / COMP-07 | AI-T / affected product domain; CAPITAL-AI-CLIENT if the affected implementation is VC-01 | VC-17 or VC-01 as affected | ESS-0019 + content-transparency evidence | implementation gap routes to the affected stage owner; no parallel VC-01 owner |

## Classification totals

- `COMP-OWNED`: 6
- `COMP-SHARED`: 15 (includes the newly correlated Agent Client owner row)
- `COMP-CONSUMER`: 11
- `NOT-COMPLIANCE`: 1

These totals describe the extracted rows, not every task in every roadmap. Remediation shown by a handoff remains target-project work.
