# Compliance Roadmap Inventory

**Document ID:** `DOC-COMP-ROADMAP-INVENTORY-2026-08-31`  
**Role:** inventory / non-authorizing  
**Version:** 1.2.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@5d3360c21ee51771495aab734ba81c2bdfd3d08b`  
**Status:** REVIEWED SNAPSHOT

## Method

Repository paths searched include `docs/projects/**`, `docs/roadmaps/**`, `docs/architecture/**/*ROADMAP*`, `docs/**/*ROADMAP*` and roadmap-like remediation/status documents discovered by content search. Status is derived from the document itself, the current DevelopmentChain index, Master Roadmap and document/ADR/ESS registries. Where these do not establish a current state, status remains `UNKNOWN` rather than inferred.

`CANONICAL` means canonical for the document's bounded domain/role; it does not bypass current Governance/ADR/ESS authority. Compliance dependencies use only the V2.1 workstreams `COMP-01`…`COMP-08`.

The final-main correlation includes PR #626: `docs/projects/agent-client/` now defines `CAPITAL-AI-CLIENT` as the single Primary Owner of `VC-01 — Agent Client`. This ownership is consumed by Compliance mappings and handoffs; Compliance does not duplicate the Agent Client project model.

## Inventory

| Source | Roadmap / Document ID | Domain | Status | Owner | Authority / role | Parent / dependencies | Open work / findings | Compliance dependency | Registry / evidence | Last verified baseline |
|---|---|---|---|---|---|---|---|---|---|---|
| `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md` | `DOC-COMP-ROADMAP-2026-08-31` / project `CAPITAL-AI-COMP` | Compliance | **CANONICAL / ACTIVE** assessment SPOE / non-authorizing | CAPITAL-AI Owner / Compliance | V2.1 roadmap projection; `primary_value_chain_ownership=[]` | current Governance + all relevant Primary Owner roadmaps/evidence | open findings/handoffs in project reports | COMP-01..08 | project matrices/reports; document-registry treatment reviewed separately | final correlation `5d3360c2` |
| `docs/projects/agent-client/ROADMAP.md` | project `CAPITAL-AI-CLIENT` | Agent Client / VC-01 | **CANONICAL / ACTIVE — VC-01 PRIMARY OWNER** | `CAPITAL-AI-CLIENT` | non-authorizing bounded VC-01 execution roadmap; AGENTS remains trust root | `docs/projects/agent-client/README.md`, inventory/runtime mapping/work packages/traceability | CLIENT-02..CLIENT-07 READY; no foreign VC execution | COMP-01 / 02 / 03 / 04 / 05 / 06 / 07 / 08 as requirements/evidence affect the client boundary | `docs/projects/agent-client/**`; PR #626 merged to main | `main@5d3360c2` |
| `docs/architecture/ROADMAP.md` | `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` | Development/Governance | **CANONICAL / ACTIVE** current-state index | CAPITAL-AI Owner | stable current-state authority | AGENTS, DevelopmentChain policy, registries | S1-R2 and governance current-state items | COMP-03 / 04 / 06 | Authority/Control Plane | final correlation `5d3360c2` |
| `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | portfolio index | Portfolio | **CANONICAL / ACTIVE** portfolio projection | SvenKulessa | roadmap projection | current-state index + Fachroadmaps | portfolio open items | COMP-01..08 cross-cutting | final merged projection must retain CLIENT and COMP | `main@5d3360c2` + branch COMP integration |
| `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | `ROADMAP-INTEGRATED-DC-SA-0001` | Development/Systemadmin | **ACTIVE** non-authorizing projection | SvenKulessa | projects current-state authority | `docs/architecture/ROADMAP.md` | M10 suspended; external mutation separately gated | COMP-03 / 04 / 06 | direct document evidence | 2026-08-25 document snapshot |
| `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | legacy DevelopmentChain roadmap | Development | **HISTORICAL** for current execution state | UNKNOWN | explicitly historical/non-authorizing in current-state index | superseded for status by `docs/architecture/ROADMAP.md` | historical M0-M10 detail | COMP-06 consumer evidence only | current-state index classification | historical |
| `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | `GOV-CP-2026-08-19` | Governance | **PARTIAL / MERGED CONTEXT** | CAPITAL-AI Owner | `AUTH-GOV-CONTROL-PLANE-ROADMAP` | ADR-0096, Governance registries | historical follow-up text may be stale; current registries prevail | COMP-02 / 03 / 06 | Authority/Control registry | post-merge reconciliation document |
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | S1 | Security | **ACTIVE / PARTIAL** | Security / Owner | canonical bounded Security hardening roadmap | Security ADR/evidence | R2-03..R2-11 mixed open/accepted/verify states | COMP-03 / 04 / 05 / 06 / 07 / 08 | Security evidence; VC-01 technical remediation routes to CAPITAL-AI-CLIENT | final correlation `5d3360c2` |
| `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md` | DSGVO remediation | Privacy | **PARTIAL / STALE-BASELINE REVALIDATION REQUIRED** | Controller / Owner | remediation roadmap, not legal authority | Privacy ADRs, vendor evidence | vendor contracts/transfer/TIA and advisor follow-up open in document | COMP-01 / 02 / 03 / 04 / 05 / 06 / 07 | privacy/vendor evidence; VC-01 client implementation remains CAPITAL-AI-CLIENT-owned | document baseline `345b2bd`; inventory `5d3360c2` |
| `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | `SC-MD-SPT-0001` | Scoring/Market Data | **CANONICAL / ACTIVE** bounded runtime/scoring scope | CAPITAL-AI Owner | registered roadmap with bounded normative scope | ADR-0087..0090 + evidence | domain work-package state remains target-owned | COMP-01 / 02 / 03 / 04 / 06 / 07 / 08 | document registry + scoring evidence | registry current on baseline |
| `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | FinTechCore Crypto Module 01 | FinTech | **ACTIVE / PARTIAL** | CAPITAL-AI Owner | domain roadmap / ADR-0099 context | scoring/risk/evidence authorities | FT-7 live execution remains blocked per current-state index | COMP-03 / 04 / 06 / 07 / 08 | ADR-0099 + fintech evidence | current-state index 2026-08-30 |
| `docs/roadmaps/VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | `ROADMAP-VC-COV-HARDEN-2026-08-30` | Architecture/Portfolio | **ACTIVE / PARTIAL** | CAPITAL-AI Owner | coverage roadmap | inventory/implementation packs | target stage gaps remain Primary Owner work | COMP-04 / 05 / 06 / 07 / 08 | coverage/evidence packs; VC-01 owner now resolved by CAPITAL-AI-CLIENT | final correlation `5d3360c2` |
| `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | `DOC-ROADMAP-DOCUMENTARY-EVENT-VALUE-CHAIN` | Documentary/EventMesh | **ACTIVE / PARTIAL** | CAPITAL-AI | roadmap projection | ESS-0010/0013, Documentary evidence | producer/coverage gaps | COMP-03 / 04 / 06 / 07 | document registry | current registry |
| `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | Systemadmin | Operations/Systemadmin | **ACTIVE / PARTIAL** projection | CAPITAL-AI Owner | non-authorizing domain roadmap | Systemadmin policy, integrated roadmap | SA5 protected external mutation remains blocked/gated | COMP-03 / 04 / 06 | roadmap/evidence | current Master projection |
| `docs/roadmaps/AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | IAM diagnostics | IAM/Systemadmin | **PARTIAL / PARTLY HISTORICAL** | UNKNOWN | roadmap projection | current IAM/Security authorities | Master flags retained/superseded/migrated analysis needed | COMP-03 / 04 / 05 / 06 / 07 | Master Roadmap | current Master classification |
| `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | `SEO-GM-ROADMAP-0002` | SEO/Marketing | **CANONICAL / ACTIVE** | CAPITAL-AI Owner | single-point domain roadmap | SEO/Marketing ADR/ESS | Q2 remainder, D4, optional D5, N1; runtime enablement gated | COMP-01 / 02 / 03 / 04 / 06 / 08 | source-domain consent/provider/output evidence; VC-01 technical remediation routes to CAPITAL-AI-CLIENT | final correlation `5d3360c2` |
| `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | Marketing Agent | Marketing | **SUPERSEDED** | UNKNOWN | historical projection | superseded by SEO-GM | no parallel work | COMP-03 / 06 history only | Master Roadmap | superseded 2026-08-15 |
| `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | SEO Management | SEO | **SUPERSEDED** | UNKNOWN | historical projection | superseded by SEO-GM | no parallel work | COMP-03 / 06 history only | Master Roadmap | superseded 2026-08-15 |
| `docs/frontend/FRONTEND_ROADMAP.md` | `DOC-FRONTEND-ROADMAP` | Frontend | **ACTIVE / APPROVED** | CAPITAL-AI | non-normative roadmap/source-domain context | `AUTH-FRONTEND-PRESENTATION-ARCHITECTURE`; `CAPITAL-AI-CLIENT` for VC-01 ownership | detailed open WPs not reclassified without current evidence | COMP-01 / 02 / 03 / 04 / 06 / 08 where transparency/data scope affected | document registry + Agent Client mapping | final correlation `5d3360c2` |
| `docs/architecture/VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md` | Vocabulary migration | Vocabulary | **HISTORICAL / COMPLETED-CONTEXT** | UNKNOWN | migration roadmap | ESS-0017 | current-state index says Vocabulary operational | COMP-03 / 06 traceability | current-state index | 2026-08-30 status context |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | AI Agent M0-M9 | AI Agent | **HISTORICAL / NOT SEPARATE OPEN PROGRAM** | UNKNOWN | implementation history | current DevelopmentChain/ESS-0019 | no independent current program per Master | COMP-03 / 06 evidence | Master classification | historical projection |
| `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md` | M5A WP | Systemadmin | **HISTORICAL / WORK-PACKAGE EVIDENCE** | UNKNOWN | work package, not portfolio roadmap | DevelopmentChain | completed/historical status to current index | COMP-06 consumer | DevelopmentChain evidence | historical |
| `docs/roadmaps/PDF_BRANDING_FINALIZATION_P1_P2_2026-08-19.md` | PDF Branding P1/P2 | Documentary/Reporting | **REVIEWED / DOMAIN STATUS REQUIRES REVALIDATION** | CAPITAL-AI Owner | registered roadmap | ADR-0091 + ADR-0093 | no Compliance task inferred solely from branding | NOT-COMPLIANCE unless claim/evidence semantics change | document registry | 2026-08-19 |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` + current ESS-0019 | AI capability lifecycle | AI/Governance | **HISTORICAL + CURRENT ESS CONSUMER** | Platform Director | current capability authority is ESS-0019 | AGENTS/Control Plane | historical tasks not reopened | COMP-03 / 06 consumer | ESS registry | current registry |

## Roadmap-like domains searched with no prior canonical Compliance roadmap

The repository contains privacy/legal remediation, Security and Governance roadmaps, but no pre-existing `CAPITAL-AI-COMP` roadmap before this branch. `docs/projects/agent-client/` is now an explicit project model for the VC-01 Primary Owner; it is consumed as target-owner context and does not imply that cross-cutting Compliance must move out of `docs/compliance/`.

No separate Risk, Production, Release or Observability Compliance roadmap is promoted merely because those domains have Compliance dependencies.

## Status counts for this snapshot

Counting unique source rows and excluding the combined duplicate AI lifecycle note:

- `CANONICAL / ACTIVE`: **6** (including `CAPITAL-AI-COMP` and `CAPITAL-AI-CLIENT`)
- `ACTIVE / PARTIAL` or active projection: **7**
- `PARTIAL / revalidation required`: **3**
- `SUPERSEDED`: **2**
- `HISTORICAL / completed-context`: **4**
- `REVIEWED / status revalidation`: **1**
- **Total unique roadmap/roadmap-like sources:** **23**

These are documentary classifications, not Compliance status.
