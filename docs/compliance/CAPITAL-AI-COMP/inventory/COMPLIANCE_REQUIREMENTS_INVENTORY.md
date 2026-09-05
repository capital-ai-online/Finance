# Compliance Requirements Inventory

**Document ID:** `DOC-COMP-REQUIREMENTS-INVENTORY-2026-08-31`  
**Role:** inventory / non-authorizing  
**Version:** 1.2.0  
**Date:** 2026-09-05  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main correlation:** `main@e96c8d13d9ef3a7d566fb579e93fc680482d07c3`  
**Applicability input:** `docs/compliance/CAPITAL-AI-COMP/inventory/APPLICABILITY_MATRIX.md` v1.3.0 as merged by PR #735  
**Status:** COMP-02 RE-CORRELATED AGAINST CURRENT MAIN — CONTINUOUS REQUIREMENT / ASSESSMENT-INPUT REGISTER

Requirement IDs are project-local traceability handles. They do not replace `AUTH-*`, `CTRL-*`, ADR or ESS identities and do not create repository Authority. This inventory is the COMP-02 source-backed requirement / assessment-input surface; control mapping, Primary Owner / `PVC-*` mapping, evidence sufficiency and compliance assessment remain COMP-03 / COMP-06 / COMP-04 concerns.

## Correlation semantics

- `Current-main correlation` records the repository state used to refresh this inventory. It is not a production baseline, certification baseline, frozen legal baseline or substitute for evidence freshness.
- Applicability is consumed from COMP-01. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` remain fail-closed and are not promoted by engineering inference.
- External law/regulation becomes an applicable requirement only to the extent competent applicability determination and factual scope support it.
- Benchmark/advisory standards may remain assessment inputs only where current repository Authority permits that use. Citation alone does not create a requirement, finding, remediation backlog, CI gate or Authority claim.
- NIST publications/frameworks/profiles are withdrawn from the current repository Governance baseline by `/AGENTS.md` v2.7.0. Former `REQ-COMP-026` and `REQ-COMP-027` are therefore retired from the active inventory and retained only as historical traceability handles; they MUST NOT be reused for new requirements.
- Current project ownership is resolved later through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`; historical `VC-*` routing is not carried in this COMP-02 inventory.

## Applicability vocabulary

`APPLICABLE` · `PARTIALLY_APPLICABLE` · `NOT_APPLICABLE` · `UNKNOWN` · `REQUIRES_LEGAL_REVIEW`

`NOT_APPLICABLE` for a benchmark row means **not applicable as binding legal/repository Authority**; the row may remain a bounded benchmark/advisory assessment input where current Authority permits it.

## Active requirements / assessment inputs

| Requirement ID | Source / version | Jurisdiction / scope | Applicability input | Requirement / assessment input | Source / COMP-01 basis | Open scope / legal gate | Next COMP path |
|---|---|---|---|---|---|---|---|
| REQ-COMP-001 | `/AGENTS.md` v2.7.0 | Internal | APPLICABLE | use the current repository trust root and Authority-resolution model | current-main trust root | none for source identity; implementation evidence is separate | COMP-03 / 04 / 06 |
| REQ-COMP-002 | `/AGENTS.md` v2.7.0 + current Governance controls | Internal | APPLICABLE | do not make unsupported certification, regulatory-status or complete-compliance claims | trust-root Authority/claim boundary | claim sufficiency remains scope/evidence dependent | COMP-03 / 04 / 05 / 06 |
| REQ-COMP-003 | `/AGENTS.md` v2.7.0 — SDLC branch lifecycle | Internal | APPLICABLE | protected repository work uses a fresh scoped branch; direct `main` edits are prohibited | current mandatory development lifecycle | per-change execution evidence | COMP-03 / 04 / 06 |
| REQ-COMP-004 | `/AGENTS.md` v2.7.0 — final sync/correlation lifecycle | Internal | APPLICABLE | refresh current `main`, open PRs/writers and semantic overlap before PR readiness | current mandatory development lifecycle | per-change correlation evidence | COMP-03 / 04 / 06 |
| REQ-COMP-005 | `/AGENTS.md` v2.7.0 — `CTRL-SDLC-PR-CREATE-001` | Internal | APPLICABLE | PR creation requires explicit Human/Owner approval for the exact correlated `main SHA` + `branch head SHA` | current PR-creation gate | approval is per concrete PR state | COMP-03 / 04 / 06 |
| REQ-COMP-006 | current Governance Control Catalog — hosted validation | Internal | APPLICABLE | required hosted validation is bound to the exact PR head and remains non-authorizing for merge | current control plane | exact required checks depend on PR class/scope | COMP-03 / 04 / 06 |
| REQ-COMP-007 | `/AGENTS.md` v2.7.0 | Internal | APPLICABLE | merge authority remains Human/CODEOWNER-only | current Human Authority boundary | merge evidence exists only at merge phase | COMP-03 / 04 / 06 |
| REQ-COMP-008 | `/AGENTS.md` v2.7.0 + current deployment controls | Internal | APPLICABLE | production promotion uses the verified `main` deployment pipeline and preserves exact-SHA identity | current PR-CI / Production Deployment State | runtime/deployment evidence is release-specific | COMP-03 / 04 / 06 |
| REQ-COMP-009 | `/AGENTS.md` v2.7.0 Security and Data Integrity Baseline | Internal | APPLICABLE | preserve least privilege, explicit authorization and fail-closed security behavior | trust-root security baseline | open technical findings remain Security/owner work | COMP-03 / 04 / 05 / 06 / 07 |
| REQ-COMP-010 | current Governance/Security controls | Internal | APPLICABLE | secrets must not be disclosed through repository, evidence or model output | current secret-protection controls | continuous regression risk | COMP-03 / 04 / 06 |
| REQ-COMP-011 | `/AGENTS.md` v2.7.0 Documentation Governance + current document lifecycle | Internal | APPLICABLE | governed records use canonical document placement, identity, role and lifecycle | current documentation governance | document-registry applicability/evidence remains separate | COMP-03 / 04 / 06 |
| REQ-COMP-012 | `/AGENTS.md` v2.7.0 Authority Resolution / historical handling | Internal | APPLICABLE | superseded, retired and historical artifacts remain non-authorizing and cannot regain Authority by citation | current Authority-resolution rule | legacy ADR/ESS correlation is COMP-03 scope | COMP-03 / 04 / 05 / 06 |
| REQ-COMP-013 | GDPR / Regulation (EU) 2016/679 — data-processing principles | EU/EEA | APPLICABLE | apply purpose limitation, data minimisation, storage limitation and related principles to documented personal-data processing scope | COMP-01 confirms material personal-data processing | exact lawful basis/role/processing obligations remain processing-specific | COMP-02 / 03 / 04 / 06 |
| REQ-COMP-014 | GDPR / Regulation (EU) 2016/679 — transparency/accountability | EU/EEA | APPLICABLE | maintain processing transparency and accountable records for the documented processing scope | COMP-01 confirms privacy/account/profile/billing/consent/vendor processing surfaces | completeness/currentness remains evidence- and processing-specific | COMP-02 / 03 / 04 / 06 |
| REQ-COMP-015 | GDPR / Regulation (EU) 2016/679 — data-subject rights | EU/EEA | APPLICABLE | support applicable rights-request/export/deletion/restriction workflows for covered processing | documented personal-data scope from COMP-01 | exact request scope and current runtime evidence remain to be assessed | COMP-02 / 03 / 04 / 06 |
| REQ-COMP-016 | GDPR / Regulation (EU) 2016/679 — retention/lifecycle | EU/EEA | APPLICABLE | define and evidence retention/deletion criteria for covered personal data | documented processing scope; existing retention authority/evidence | operational freshness and per-processing sufficiency remain open | COMP-02 / 03 / 04 / 06 / 07 |
| REQ-COMP-017 | GDPR / Regulation (EU) 2016/679 — processor/vendor/transfer accountability | EU/EEA | PARTIALLY_APPLICABLE | maintain processor/vendor/role/transfer evidence for actual production providers and flows | COMP-01-A confirms provider factual scope but leaves DPA/subprocessor/transfer/TIA/role gaps | Human/Legal review per actual provider/flow; contractual evidence incomplete | COMP-01 / 02 / 04 / 05 / 06 / 07 |
| REQ-COMP-018 | EU AI Act / Regulation (EU) 2024/1689, consolidated 2026-07-27; timing amendment Regulation (EU) 2026/1744 | EU | PARTIALLY_APPLICABLE | maintain material AI use-case inventory and determine system-specific legal roles | COMP-01-B factual role/use-case package completed | provider/deployer/other legal role not established for every material system | COMP-01 / 02 / 04 |
| REQ-COMP-019 | EU AI Act / Regulation (EU) 2024/1689 — transparency candidate scope | EU | PARTIALLY_APPLICABLE | identify and evidence transparency duties for affected AI interaction/generated-content surfaces where legally applicable | COMP-01-B identifies customer-facing AI interaction/explanation surfaces | complete content-surface inventory and legal sufficiency remain system/content specific | COMP-01 / 02 / 03 / 04 / 06 |
| REQ-COMP-020 | EU AI Act / Regulation (EU) 2024/1689 — human oversight / decision-boundary candidate scope | EU | REQUIRES_LEGAL_REVIEW | maintain bounded AI authority and, where the legal classification requires it, applicable human-oversight measures | COMP-01 confirms `financialDecisionAuthority=false` and no blanket high-risk classification | legal role/risk classification must trigger before asserting a specific oversight obligation | COMP-01 / 02 / 03 / 04 |
| REQ-COMP-021 | EU AI Act / Regulation (EU) 2024/1689 — AI literacy candidate scope | EU | PARTIALLY_APPLICABLE | maintain appropriate role-based AI-literacy evidence where Article-4 scope applies | COMP-01-D confirms material AI use and existing control specification | role determination plus attributable Human completion/acknowledgement evidence remain missing | COMP-01 / 02 / 04 / 05 / 06 / 07 |
| REQ-COMP-022 | DORA / Regulation (EU) 2022/2554 | EU | REQUIRES_LEGAL_REVIEW | determine actual entity/business/activity scope before mapping DORA obligations | COMP-01-C factual entity/business package completed | competent Human/Legal determination of Article-2 or other applicable scope | COMP-01 / 02 / 05 / 07 |
| REQ-COMP-023 | EU/DE consumer protection and digital-contract obligations | DE/EU | REQUIRES_LEGAL_REVIEW | determine actual B2C/service/market scope and applicable pre-contract, cancellation, withdrawal and digital-performance duties | COMP-01-E confirms paid subscription/Stripe/consumer-term trigger surfaces | actual customer mix/markets and legal sufficiency require Human/Legal review | COMP-01 / 02 / 07 |
| REQ-COMP-024 | ISO/IEC 27001:2022 | External standard | NOT_APPLICABLE | bounded security benchmark evidence only; no certification or binding-Authority inference | current repository retains dated SoA/security crosswalk material | refresh only when useful to an existing internal control or explicit assurance target | COMP-02 / 03 / 04 / 06 |
| REQ-COMP-025 | ISO/IEC 42001:2023 | External standard | NOT_APPLICABLE | current Governance management-system benchmark/crosswalk; non-certifying and non-authorizing | `/AGENTS.md` v2.7.0 Standards Baseline | separate Owner target/assurance evidence required for any certification scope | COMP-02 / 03 |
| REQ-COMP-028 | OWASP / CIS guidance | External guidance | NOT_APPLICABLE | advisory secure-SDLC/security input only when correlated to an existing internal control | COMP-01 confirms advisory/non-binding treatment | bounded mapping only; citation alone creates no requirement/gap | COMP-02 / 03 |
| REQ-COMP-029 | current Compliance evidence principle + trust-root evidence rules | Internal | APPLICABLE | no positive compliance conclusion without current scope-adequate evidence | current Compliance roadmap/evidence model | stale or missing evidence remains explicit | COMP-04 / 06 |
| REQ-COMP-030 | current Compliance change-impact model | Internal | APPLICABLE | reassess applicability/requirements when material feature, model, data, provider, market, user, purpose, deployment or content facts change | COMP-08 trigger model + COMP-01 fail-closed rules | operational trigger/evidence freshness remains continuous | COMP-08 → COMP-01 / 02 / 03 / 06 / 04; COMP-07 if remediation is required |
| REQ-COMP-031 | binding contractual obligations universe | Contractual | UNKNOWN | identify actual customer/provider/partner contracts and incorporated terms that impose obligations | COMP-01-A/E confirms only a partial contract universe | complete binding-contract universe and effective versions are not established | COMP-01 / 02 / 06 / 07 |
| REQ-COMP-032 | internal resilience/continuity controls; conditional external regimes only after applicability | Internal / conditional external | APPLICABLE | retain measured backup/restore, incident and continuity evidence required by current internal controls | current OPS/Security roadmaps keep measured recovery evidence open | any external-regime mapping remains separate Legal Review; measured restore evidence remains missing | COMP-04 / 05 / 06 / 07 |
| REQ-COMP-033 | current audit/traceability controls | Internal | APPLICABLE | protected actions and compliance-relevant events retain traceable evidence | current internal traceability model | end-to-end coverage/freshness requires evidence assessment | COMP-03 / 04 / 06 |
| REQ-COMP-034 | current Data / scoring provenance and integrity authorities | Internal | APPLICABLE | preserve provenance, lineage, quality and integrity through affected value-chain stages | current Data/Scoring contracts and project roadmaps | end-to-end evidence coverage remains assessment work | COMP-03 / 04 / 06 / 07 if remediation is confirmed |
| REQ-COMP-035 | current documentation / record-keeping controls; conditional external duties only after applicability | Internal / conditional external | APPLICABLE | required records retain identity, lifecycle, retention and traceability | current documentation governance | external record-keeping duties remain regime/scope specific | COMP-03 / 04 / 05 / 06 / 07 |
| REQ-COMP-036 | current release / rollback controls | Internal | APPLICABLE | retain release authorization, exact-SHA evidence and rollback capability | current verified-main deployment model | runtime/rollback evidence is release-specific | COMP-03 / 04 / 06 / 07 if a gap is confirmed |
| REQ-COMP-037 | German DDG + TDDDG, current official sources rechecked by COMP-01 | DE | REQUIRES_LEGAL_REVIEW | determine exact provider-information, digital-service and consent/storage/access obligations for the factual public/analytics/advertising surfaces | COMP-01-E confirms public provider/imprint plus GA4/Ads/CookieHub/TDDDG trigger surfaces | exact service classification and legal sufficiency require Human/Legal review | COMP-01 / 02 / 03 / 04 / 06 / 07 |
| REQ-COMP-038 | financial-services / supervisory obligations beyond proven scope | DE/EU / affected jurisdictions | UNKNOWN | determine whether the actual business model, services, remuneration/referral model or customer use create regulated financial-service/supervisory obligations | COMP-01-E confirms financial analysis/scoring/ranking features and `financialDecisionAuthority=false` | regulated activity, licensing/role and jurisdictional scope are not established | COMP-01 / 02 / 07 |
| REQ-COMP-039 | EU AI Act / Regulation (EU) 2024/1689 — high-risk classification trigger | EU | REQUIRES_LEGAL_REVIEW | perform competent legal classification before asserting high-risk obligations when intended purpose, user, role or decision authority reaches a relevant trigger | COMP-01-B found no current blanket Annex-III/high-risk basis and retained reclassification triggers | Human/Legal classification required on trigger; no pre-emptive high-risk remediation backlog | COMP-08 → COMP-01 / 02 / 03 / 04 / 07 as applicable |

## Retired historical requirement IDs

| Requirement ID | Historical source | Current state | Current meaning |
|---|---|---|---|
| REQ-COMP-026 | NIST SSDF / SP 800-218A | RETIRED / HISTORICAL | no current Governance requirement, benchmark requirement, finding, CI gate or remediation backlog; future use requires explicit Human/Owner re-adoption of exact source/version/scope |
| REQ-COMP-027 | NIST AI RMF / GenAI profile | RETIRED / HISTORICAL | no current Governance requirement, benchmark requirement, finding, CI gate or remediation backlog; future use requires explicit Human/Owner re-adoption of exact source/version/scope |

These IDs remain reserved for historical traceability and MUST NOT be reassigned.

## Applicability totals — active inventory only

- `APPLICABLE`: **23**
- `PARTIALLY_APPLICABLE`: **4**
- `NOT_APPLICABLE`: **3**
- `UNKNOWN`: **2**
- `REQUIRES_LEGAL_REVIEW`: **5**
- Active requirements / assessment inputs: **37**
- Retired historical IDs excluded from active totals: **2** (`REQ-COMP-026`, `REQ-COMP-027`)

These are Compliance requirement / assessment inputs, not a legal register, certification scope, regulated-entity determination, policy hierarchy or proof of compliance. COMP-03 must perform current control/Primary Owner/`PVC-*` mapping from this inventory; COMP-04/COMP-06 must assess only against sufficient current scoped evidence.