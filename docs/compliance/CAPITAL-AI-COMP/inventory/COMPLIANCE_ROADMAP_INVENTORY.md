# Compliance Roadmap Inventory

**Document ID:** `DOC-COMP-ROADMAP-INVENTORY-2026-08-31`  
**Role:** inventory / non-authorizing  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Status:** REVIEWED SNAPSHOT

## Method

Repository paths searched include `docs/roadmaps/**`, `docs/architecture/**/*ROADMAP*`, `docs/**/*ROADMAP*` and roadmap-like remediation/status documents discovered by content search. Status is derived from the document itself, the current DevelopmentChain index, the Master Roadmap and document/ADR/ESS registries. Where these do not establish a current state, the status is `UNKNOWN` rather than inferred.

`CANONICAL` below means canonical for the document's bounded domain/role; it does not bypass current Governance/ADR/ESS authority.

## Inventory

| Source | Roadmap / Document ID | Domain | Status | Owner | Authority / role | Parent / dependencies | Open work / findings | Compliance dependency | Registry / evidence | Last verified baseline |
|---|---|---|---|---|---|---|---|---|---|---|
| `docs/architecture/ROADMAP.md` | `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` | Development/Governance | **CANONICAL / ACTIVE** current-state index | CAPITAL-AI Owner | stable current-state authority | AGENTS, DevelopmentChain policy, registries | S1-R2 and governance current-state items | COMP-06, COMP-08, COMP-10 | Authority/Control Plane | document baseline `f714eae6`; repository baseline for this inventory `0f5d4f2` |
| `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | portfolio index | Portfolio | **CANONICAL / ACTIVE** portfolio projection | SvenKulessa | roadmap projection | current-state index + Fachroadmaps | portfolio open items | all COMP streams | document exists; registry status not relied upon | document baseline `f714eae6`; inventory baseline `0f5d4f2` |
| `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | `ROADMAP-INTEGRATED-DC-SA-0001` | Development/Systemadmin | **ACTIVE** non-authorizing projection | SvenKulessa | projects current-state authority | `docs/architecture/ROADMAP.md` | M10 suspended; external mutation separately gated | COMP-06, COMP-07, COMP-08, COMP-10 | direct document evidence | 2026-08-25 document snapshot |
| `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | legacy DevelopmentChain roadmap | Development | **HISTORICAL** for current execution state | UNKNOWN | explicitly historical/non-authorizing in current-state index | superseded for status by `docs/architecture/ROADMAP.md` | historical M0-M10 detail | COMP-CONSUMER evidence only | current-state index classification | historical |
| `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | `GOV-CP-2026-08-19` | Governance | **PARTIAL / MERGED CONTEXT** | CAPITAL-AI Owner | `AUTH-GOV-CONTROL-PLANE-ROADMAP` | ADR-0096, Governance registries | historical follow-up text may be stale; current registries prevail | COMP-CONSUMER; COMP-09/10 | Authority/Control registry | post-merge reconciliation document |
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | S1 | Security | **ACTIVE / PARTIAL** | Security / Owner | canonical bounded Security hardening roadmap | Security ADR/evidence | R2-03..R2-11 mixed open/accepted/verify states | COMP-05, COMP-08, COMP-10 | Security evidence | document baseline `3815c7f`; main now includes PR #624 |
| `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md` | DSGVO remediation | Privacy | **PARTIAL / STALE-BASELINE REVALIDATION REQUIRED** | Controller / Owner | remediation roadmap, not legal authority | Privacy ADRs, vendor evidence | vendor contracts/transfer/TIA and advisor follow-up remain open in document | COMP-04, COMP-10, COMP-13 | privacy/vendor evidence | document baseline `345b2bd`; inventory `0f5d4f2` |
| `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | `SC-MD-SPT-0001` | Scoring/Market Data | **CANONICAL / ACTIVE** bounded runtime/scoring scope | CAPITAL-AI Owner | registered roadmap with bounded normative scope | ADR-0087..0090 + evidence | current work-package states outside this inventory require domain status | COMP-03, COMP-10, COMP-16 | document registry + scoring evidence | registry current on baseline |
| `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | FinTechCore Crypto Module 01 | FinTech | **ACTIVE / PARTIAL** | CAPITAL-AI Owner | domain roadmap / ADR-0099 context | scoring/risk/evidence authorities | FT-7 live execution remains blocked per current-state index | COMP-05, COMP-10, COMP-16 | ADR-0099 + fintech evidence | current-state index 2026-08-30 |
| `docs/roadmaps/VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | `ROADMAP-VC-COV-HARDEN-2026-08-30` | Architecture/Portfolio | **ACTIVE / PARTIAL** | CAPITAL-AI Owner | coverage roadmap | Inventory/implementation packs | registry insert/runtime work separately gated | COMP-10, COMP-16 | coverage/evidence packs | 2026-08-30 |
| `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | `DOC-ROADMAP-DOCUMENTARY-EVENT-VALUE-CHAIN` | Documentary/EventMesh | **ACTIVE / PARTIAL** | CAPITAL-AI | roadmap projection | ESS-0010/0013, documentary evidence | producer/coverage gaps | COMP-09, COMP-10 | document registry | current registry |
| `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | Systemadmin | Operations/Systemadmin | **ACTIVE / PARTIAL** projection | CAPITAL-AI Owner | non-authorizing domain roadmap | Systemadmin policy, integrated roadmap | SA5 protected external mutation remains blocked/gated | COMP-07, COMP-08, COMP-10 | roadmap/evidence | current Master projection |
| `docs/roadmaps/AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | IAM diagnostics | IAM/Systemadmin | **PARTIAL / PARTLY HISTORICAL** | UNKNOWN | roadmap projection | current IAM/Security authorities | Master flags retained/superseded/migrated analysis needed | COMP-05, COMP-10 | Master Roadmap | current Master classification |
| `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | `SEO-GM-ROADMAP-0002` | SEO/Marketing | **CANONICAL / ACTIVE** | CAPITAL-AI Owner | single-point domain roadmap | SEO/Marketing ADR/ESS | Q2 remainder, D4, optional D5, N1; runtime enablement gated | COMP-04, COMP-09, COMP-16 | Master Roadmap | Master cites v0002.11 |
| `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | Marketing Agent | Marketing | **SUPERSEDED** | UNKNOWN | historical projection | superseded by SEO-GM | no parallel work | COMP-CONSUMER history only | Master Roadmap | superseded 2026-08-15 |
| `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | SEO Management | SEO | **SUPERSEDED** | UNKNOWN | historical projection | superseded by SEO-GM | no parallel work | COMP-CONSUMER history only | Master Roadmap | superseded 2026-08-15 |
| `docs/frontend/FRONTEND_ROADMAP.md` | `DOC-FRONTEND-ROADMAP` | Frontend | **ACTIVE / APPROVED** | CAPITAL-AI | non-normative roadmap | `AUTH-FRONTEND-PRESENTATION-ARCHITECTURE` | detailed open WPs not reclassified without current evidence | COMP-03, COMP-04, COMP-16 where UI transparency/data affected | document registry | registry version 1.5.1 |
| `docs/architecture/VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md` | Vocabulary migration | Vocabulary | **HISTORICAL / COMPLETED-CONTEXT** | UNKNOWN | migration roadmap | ESS-0017 | current-state index says Vocabulary operational | COMP-CONSUMER traceability | current-state index | 2026-08-30 status context |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | AI Agent M0-M9 | AI Agent | **HISTORICAL / NOT SEPARATE OPEN PROGRAM** | UNKNOWN | implementation history | current DevelopmentChain/ESS-0019 | no independent current program per Master | COMP-CONSUMER; COMP-03/06 evidence | Master classification | historical projection |
| `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md` | M5A WP | Systemadmin | **HISTORICAL / WORK-PACKAGE EVIDENCE** | UNKNOWN | work package, not portfolio roadmap | DevelopmentChain | completed/historical status to current index | COMP-CONSUMER | DevelopmentChain evidence | historical |
| `docs/roadmaps/PDF_BRANDING_FINALIZATION_P1_P2_2026-08-19.md` | PDF Branding P1/P2 | Documentary/Reporting | **REVIEWED / DOMAIN STATUS REQUIRES REVALIDATION** | CAPITAL-AI Owner | registered roadmap | ADR-0091 + ADR-0093 | no compliance task inferred solely from branding | NOT-COMPLIANCE except record/evidence claims | document registry | 2026-08-19 |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` + current ESS-0019 | AI capability lifecycle | AI/Governance | **HISTORICAL + CURRENT ESS CONSUMER** | Platform Director | current capability authority is ESS-0019 | AGENTS/Control Plane | historical tasks not reopened | COMP-03/06 consumer | ESS registry | current registry |

## Roadmap-like domains searched with no separate canonical Compliance roadmap before this branch

The repository contains privacy/legal remediation, Security and Governance roadmaps, but no pre-existing `CAPITAL-AI-COMP` roadmap. No separate Risk, Production, Release or Observability compliance roadmap is promoted by this inventory merely because those domains have compliance dependencies.

## Status counts for this snapshot

Counting unique source rows (excluding the combined duplicate AI lifecycle note):

- `CANONICAL / ACTIVE`: 4
- `ACTIVE / PARTIAL` or active projection: 7
- `PARTIAL / revalidation required`: 3
- `SUPERSEDED`: 2
- `HISTORICAL / completed-context`: 4
- `REVIEWED / status revalidation`: 1

These counts are documentary classifications, not compliance status.
